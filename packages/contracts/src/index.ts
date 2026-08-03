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

const pointSchema = z.object({
  longitude: z.number().finite().min(-180).max(180),
  latitude: z.number().finite().min(-90).max(90),
});

export const verifiedDraftIntentSchema = z
  .object({
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
export type DeliveryState = z.infer<typeof deliveryStateSchema>;
export type LocalDraftEnvelope = z.infer<typeof localDraftEnvelopeSchema>;
export type MembershipPreset = z.infer<typeof membershipPresetSchema>;
export type ModerationState = z.infer<typeof moderationStateSchema>;
export type PlatformPreset = z.infer<typeof platformPresetSchema>;
export type ReportStatus = z.infer<typeof reportStatusSchema>;
export type VerifiedDraftIntent = z.infer<typeof verifiedDraftIntentSchema>;
