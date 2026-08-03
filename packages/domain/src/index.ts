import type {
  ActorContext,
  DeliveryState,
  MembershipPreset,
  ModerationState,
  PlatformPreset,
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
