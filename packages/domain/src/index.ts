import type {
  ActorContext,
  DeliveryState,
  DuplicateCandidate,
  LocationPrecision,
  MembershipPreset,
  ModerationState,
  PlatformPreset,
  ReportCloseReason,
  ReportStatus,
} from '@civic-reporting/contracts';

export type AuthorizationRequirement =
  | { kind: 'citizen' }
  | {
      kind: 'organization';
      organizationId: string;
      preset: MembershipPreset;
    }
  | { kind: 'platform'; preset: PlatformPreset };

export type AuthorizationResult =
  | { allowed: true }
  | {
      allowed: false;
      reason: 'authentication_required' | 'mfa_required' | 'role_not_allowed';
    };

export function authorizeRoute(
  context: ActorContext | null,
  requirement: AuthorizationRequirement,
): AuthorizationResult {
  if (!context) {
    return { allowed: false, reason: 'authentication_required' };
  }
  if (requirement.kind === 'citizen') {
    return { allowed: true };
  }

  const requiresMfa =
    (requirement.kind === 'organization' &&
      requirement.preset === 'organization_admin') ||
    (requirement.kind === 'platform' &&
      requirement.preset === 'platform_admin');

  if (requiresMfa && context.aal !== 'aal2') {
    return { allowed: false, reason: 'mfa_required' };
  }

  const hasPreset =
    requirement.kind === 'organization'
      ? context.organizationRoles.some(
          (membership) =>
            membership.organizationId === requirement.organizationId &&
            membership.preset === requirement.preset,
        )
      : context.platformRoles.includes(requirement.preset);

  return hasPreset
    ? { allowed: true }
    : { allowed: false, reason: 'role_not_allowed' };
}

const allowedRedirectRoots = ['/account', '/admin', '/platform', '/report'];

export function safeNextPath(candidate: string | null | undefined): string {
  if (
    !candidate ||
    !candidate.startsWith('/') ||
    candidate.startsWith('//') ||
    !allowedRedirectRoots.some(
      (root) =>
        candidate === root ||
        candidate.startsWith(`${root}/`) ||
        candidate.startsWith(`${root}?`),
    )
  ) {
    return '/account';
  }
  return candidate;
}

export type OtpRecoveryState =
  'expired_or_invalid' | 'rate_limited' | 'temporarily_unavailable';

export function mapOtpError(message: string): OtpRecoveryState {
  const normalized = message.toLowerCase();
  if (
    normalized.includes('expired') ||
    normalized.includes('invalid') ||
    normalized.includes('token')
  ) {
    return 'expired_or_invalid';
  }
  if (normalized.includes('rate') || normalized.includes('limit')) {
    return 'rate_limited';
  }
  return 'temporarily_unavailable';
}

export function isDraftExpired(
  draft: Pick<{ expiresAt: string }, 'expiresAt'>,
  now = new Date(),
): boolean {
  return Date.parse(draft.expiresAt) <= now.getTime();
}

const reportTransitions: Partial<
  Record<ReportStatus, readonly ReportStatus[]>
> = {
  submitted: ['received', 'closed'],
  received: ['needs_information', 'in_progress', 'resolved', 'closed'],
  needs_information: ['in_progress', 'resolved', 'closed'],
  in_progress: ['needs_information', 'resolved', 'closed'],
  resolved: ['in_progress', 'closed'],
};

export function isReportTransitionAllowed(
  from: ReportStatus,
  to: ReportStatus,
): boolean {
  return reportTransitions[from]?.includes(to) ?? false;
}

const moderationTransitions: Partial<
  Record<ModerationState, readonly ModerationState[]>
> = {
  pending: ['approved', 'rejected', 'escalated'],
  escalated: ['approved', 'rejected'],
};

export function isModerationTransitionAllowed(
  from: ModerationState,
  to: ModerationState,
): boolean {
  return moderationTransitions[from]?.includes(to) ?? false;
}

const deliveryTransitions: Partial<
  Record<DeliveryState, readonly DeliveryState[]>
> = {
  queued: ['attempting', 'cancelled'],
  attempting: ['delivered', 'retry_scheduled', 'failed', 'cancelled'],
  delivered: ['acknowledged'],
  retry_scheduled: ['attempting', 'cancelled'],
  failed: ['retry_scheduled', 'cancelled'],
};

export function isDeliveryTransitionAllowed(
  from: DeliveryState,
  to: DeliveryState,
): boolean {
  return deliveryTransitions[from]?.includes(to) ?? false;
}

export function buildDeterministicTitle(
  categoryName: string,
  publicLabel: string,
): string {
  return `${categoryName.trim()} near ${publicLabel.trim()}`;
}

export function publicLocationPreview(
  publicLocation: { longitude: number; latitude: number },
  label: string,
  precision: LocationPrecision,
) {
  return {
    label: label.trim(),
    location: precision === 'withheld' ? null : publicLocation,
    precision,
  };
}

export function actorQualifiedStatus(
  status: ReportStatus,
  closeReason: ReportCloseReason | null,
): string {
  if (status === 'closed') {
    const reasons: Record<ReportCloseReason, string> = {
      duplicate: 'Closed — duplicate of another report',
      out_of_service_area: 'Closed — outside this service area',
      no_action_planned:
        'Closed — no action planned by the fictional organization',
      content_policy: 'Closed — not published under the content policy',
      withdrawn: 'Closed — withdrawn by the reporter',
    };
    return closeReason ? reasons[closeReason] : 'Closed by an authorized actor';
  }
  const labels: Record<ReportStatus, string> = {
    draft: 'Draft — not submitted',
    pending_verification: 'Waiting for email verification',
    pending_moderation: 'Accepted by the platform — safety checks in progress',
    submitted: 'Accepted by the platform',
    received: 'Acknowledged by the fictional organization',
    needs_information: 'The fictional organization needs more information',
    in_progress: 'Work marked in progress by the fictional organization',
    resolved: 'Marked resolved by the fictional organization',
    closed: 'Closed by an authorized actor',
  };
  return labels[status];
}

export function mapSubmissionFailure(message: string): {
  kind: 'uncertain' | 'authentication' | 'invalid';
  retryable: boolean;
  message: string;
} {
  const normalized = message.toLowerCase();
  if (
    normalized.includes('verified_identity_required') ||
    normalized.includes('unauthorized') ||
    normalized.includes('jwt')
  ) {
    return {
      kind: 'authentication',
      retryable: false,
      message:
        'Your verification expired. Verify your email again to continue.',
    };
  }
  if (
    normalized.includes('failed to fetch') ||
    normalized.includes('network') ||
    normalized.includes('timeout')
  ) {
    return {
      kind: 'uncertain',
      retryable: true,
      message:
        'Submission interrupted — check status before retrying. The same retry key will not create another report.',
    };
  }
  return {
    kind: 'invalid',
    retryable: false,
    message:
      'The report could not be submitted. Review the draft and try again.',
  };
}

export function orderDuplicateCandidates(
  candidates: readonly DuplicateCandidate[],
  categoryName: string,
): DuplicateCandidate[] {
  return [...candidates]
    .sort((left, right) => {
      const categoryDifference =
        Number(right.categoryName === categoryName) -
        Number(left.categoryName === categoryName);
      return (
        categoryDifference ||
        left.approximateDistanceMeters - right.approximateDistanceMeters
      );
    })
    .slice(0, 5);
}
