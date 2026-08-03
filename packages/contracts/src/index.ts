import { z } from 'zod';

export const membershipPresetSchema = z.enum([
  'operator',
  'moderator',
  'organization_admin',
]);
export const platformPresetSchema = z.enum([
  'platform_admin',
  'legal_escalator',
]);
export const locationPrecisionSchema = z.enum([
  'exact',
  'block',
  'neighborhood',
  'withheld',
]);
export const reportStatusSchema = z.enum([
  'draft',
  'pending_verification',
  'pending_moderation',
  'submitted',
  'received',
  'needs_information',
  'in_progress',
  'resolved',
  'closed',
]);
export const moderationStateSchema = z.enum([
  'pending',
  'approved',
  'rejected',
  'escalated',
]);
export const deliveryStateSchema = z.enum([
  'queued',
  'attempting',
  'delivered',
  'acknowledged',
  'retry_scheduled',
  'failed',
  'cancelled',
]);
export const publicationStateSchema = z.enum([
  'private',
  'pending',
  'approved',
  'published',
  'rejected',
]);
export const reportCloseReasonSchema = z.enum([
  'duplicate',
  'out_of_service_area',
  'no_action_planned',
  'content_policy',
  'withdrawn',
]);
export const relationshipKindSchema = z.enum(['support', 'follow']);
export const notificationLevelSchema = z.enum([
  'none',
  'status_only',
  'all_updates',
]);
export const actorTypeSchema = z.enum([
  'citizen',
  'operator',
  'moderator',
  'organization_admin',
  'platform_admin',
  'legal_escalator',
  'integration',
  'system',
]);

export const pointSchema = z.object({
  longitude: z.number().finite().min(-180).max(180),
  latitude: z.number().finite().min(-90).max(90),
});

export const verifiedDraftIntentSchema = z
  .object({
    intentKind: z.enum(['new_report', 'support_existing']).optional(),
    organizationCategoryId: z.uuid(),
    description: z.string().trim().min(10).max(4000),
    exactLocation: pointSchema,
    exactAddress: z.string().trim().max(300).optional(),
    publicLocation: pointSchema.nullable(),
    publicLabel: z.string().trim().min(2).max(160),
    publicLocationPrecision: locationPrecisionSchema,
    publicationPolicyVersion: z.number().int().positive(),
    idempotencyKey: z.uuid(),
    correlationId: z.uuid(),
    duplicateTargetPublicId: z
      .string()
      .regex(/^HBR-[A-Z0-9-]{3,40}$/)
      .optional(),
    notificationLevel: notificationLevelSchema.optional(),
  })
  .superRefine((draft, context) => {
    const shouldBeWithheld = draft.publicLocationPrecision === 'withheld';
    if (shouldBeWithheld !== (draft.publicLocation === null)) {
      context.addIssue({
        code: 'custom',
        path: ['publicLocation'],
        message: shouldBeWithheld
          ? 'Coordinates must be omitted when the public location is withheld.'
          : 'Public coordinates are required for the selected precision.',
      });
    }
    if (
      draft.intentKind === 'support_existing' &&
      !draft.duplicateTargetPublicId
    ) {
      context.addIssue({
        code: 'custom',
        path: ['duplicateTargetPublicId'],
        message: 'A support intent requires the public report reference.',
      });
    }
  });

const publicIdSchema = z.string().regex(/^HBR-[A-Z0-9-]{3,40}$/);

export const locationSearchResultSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  label: z.string().trim().min(2).max(160),
  privateAddress: z.string().trim().min(2).max(300),
  publicLabel: z.string().trim().min(2).max(160),
  exactLocation: pointSchema,
  publicLocation: pointSchema.nullable(),
  publicLocationPrecision: locationPrecisionSchema,
  source: z.literal('synthetic_fixture'),
});

export const duplicateCandidateSchema = z.object({
  publicId: publicIdSchema,
  title: z.string().trim().min(2).max(240),
  publicLabel: z.string().trim().min(2).max(160),
  categoryName: z.string().trim().min(2).max(120),
  approximateDistanceMeters: z.number().int().nonnegative(),
  status: reportStatusSchema,
  acceptedAt: z.iso.datetime({ offset: true }),
  whySuggested: z.string().trim().min(2).max(200),
});

export const reportSubmissionRequestSchema = z.object({
  draftId: z.uuid(),
  expectedVersion: z.number().int().positive(),
  idempotencyKey: z.uuid(),
  correlationId: z.uuid(),
});

export const reportSubmissionResultSchema = z.object({
  reportId: z.uuid(),
  publicId: publicIdSchema,
  reportStatus: reportStatusSchema,
  publicationState: publicationStateSchema,
  moderation: z.object({
    state: z.enum([
      'published',
      'pending_review',
      'rejected',
      'temporarily_unavailable',
    ]),
    retryable: z.boolean(),
  }),
});

export const reportRelationshipRequestSchema = z.object({
  publicId: publicIdSchema,
  kind: relationshipKindSchema,
  enabled: z.boolean(),
  notificationLevel: notificationLevelSchema,
  idempotencyKey: z.uuid(),
  correlationId: z.uuid(),
});

export const publicReportSchema = z.object({
  publicId: publicIdSchema,
  title: z.string().trim().min(2).max(240),
  description: z.string().trim().min(10).max(4000),
  status: reportStatusSchema,
  closeReason: reportCloseReasonSchema.nullable(),
  publicLabel: z.string().trim().min(2).max(160),
  publicLocationPrecision: locationPrecisionSchema,
  publicLatitude: z.number().finite().min(-90).max(90).nullable(),
  publicLongitude: z.number().finite().min(-180).max(180).nullable(),
  acceptedAt: z.iso.datetime({ offset: true }),
  updatedAt: z.iso.datetime({ offset: true }),
  categoryName: z.string().trim().min(2).max(120),
  supportCount: z.coerce.number().int().nonnegative(),
});

export const publicTimelineEventSchema = z.object({
  publicId: publicIdSchema,
  publicLabel: z.string().trim().min(2).max(240),
  newStatus: reportStatusSchema,
  createdAt: z.iso.datetime({ offset: true }),
  actorType: actorTypeSchema,
  source: z.enum(['web', 'staff', 'integration', 'system']),
});

export const localDraftEnvelopeSchema = z
  .object({
    version: z.literal(1),
    draft: verifiedDraftIntentSchema,
    savedAt: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
  })
  .refine((envelope) => envelope.expiresAt > envelope.savedAt, {
    path: ['expiresAt'],
    message: 'The local draft expiry must be after its save time.',
  });

const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email().max(254));

export const otpRequestSchema = z.object({
  email: normalizedEmailSchema,
});

export const otpVerificationSchema = z.object({
  email: normalizedEmailSchema,
  token: z.string().regex(/^\d{6}$/),
});

export const actorContextSchema = z.object({
  userId: z.uuid(),
  email: normalizedEmailSchema,
  aal: z.enum(['aal1', 'aal2']),
  organizationRoles: z.array(
    z.object({
      organizationId: z.uuid(),
      preset: membershipPresetSchema,
    }),
  ),
  platformRoles: z.array(platformPresetSchema),
});

export type ActorContext = z.infer<typeof actorContextSchema>;
export type DuplicateCandidate = z.infer<typeof duplicateCandidateSchema>;
export type DeliveryState = z.infer<typeof deliveryStateSchema>;
export type LocationPrecision = z.infer<typeof locationPrecisionSchema>;
export type LocationSearchResult = z.infer<typeof locationSearchResultSchema>;
export type LocalDraftEnvelope = z.infer<typeof localDraftEnvelopeSchema>;
export type MembershipPreset = z.infer<typeof membershipPresetSchema>;
export type ModerationState = z.infer<typeof moderationStateSchema>;
export type NotificationLevel = z.infer<typeof notificationLevelSchema>;
export type PlatformPreset = z.infer<typeof platformPresetSchema>;
export type PublicReport = z.infer<typeof publicReportSchema>;
export type PublicTimelineEvent = z.infer<typeof publicTimelineEventSchema>;
export type ReportCloseReason = z.infer<typeof reportCloseReasonSchema>;
export type ReportRelationshipRequest = z.infer<
  typeof reportRelationshipRequestSchema
>;
export type ReportSubmissionRequest = z.infer<
  typeof reportSubmissionRequestSchema
>;
export type ReportSubmissionResult = z.infer<
  typeof reportSubmissionResultSchema
>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type VerifiedDraftIntent = z.infer<typeof verifiedDraftIntentSchema>;
