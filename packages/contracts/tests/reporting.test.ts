import { describe, expect, it } from 'vitest';
import {
  duplicateCandidateSchema,
  locationSearchResultSchema,
  publicReportSchema,
  publicTimelineEventSchema,
  reportRelationshipRequestSchema,
  reportSubmissionRequestSchema,
  reportSubmissionResultSchema,
  verifiedDraftIntentSchema,
} from '../src/index';

const ids = {
  category: '30000000-0000-4000-8000-000000000001',
  correlation: 'a1000000-0000-4000-8000-000000000002',
  draft: 'a1000000-0000-4000-8000-000000000003',
  idempotency: 'a1000000-0000-4000-8000-000000000001',
  report: 'a1000000-0000-4000-8000-000000000004',
};

const validDraft = {
  intentKind: 'new_report',
  organizationCategoryId: ids.category,
  description: 'A safe synthetic footpath issue for contract tests.',
  exactLocation: { longitude: 0.0042, latitude: 0.0031 },
  exactAddress: 'Private Fixture Lane 77',
  publicLocation: { longitude: 0, latitude: 0 },
  publicLabel: 'Harborfield North (Synthetic)',
  publicLocationPrecision: 'neighborhood',
  publicationPolicyVersion: 1,
  idempotencyKey: ids.idempotency,
  correlationId: ids.correlation,
};

describe('Phase 3 location and duplicate contracts', () => {
  it('keeps exact address and public representation explicit', () => {
    const location = locationSearchResultSchema.parse({
      id: 'fixture-lane-77',
      label: 'Fixture Lane 77 (Synthetic)',
      privateAddress: 'Private Fixture Lane 77',
      publicLabel: 'Harborfield North (Synthetic)',
      exactLocation: { longitude: 0.0042, latitude: 0.0031 },
      publicLocation: { longitude: 0, latitude: 0 },
      publicLocationPrecision: 'neighborhood',
      source: 'synthetic_fixture',
    });
    expect(location.privateAddress).not.toBe(location.publicLabel);
  });

  it('accepts only public-safe duplicate candidate fields', () => {
    const candidate = duplicateCandidateSchema.parse({
      publicId: 'HBR-SYNTHETIC-1',
      title: 'Synthetic footpath sample',
      publicLabel: 'Harborfield North (Synthetic)',
      categoryName: 'Street or footpath',
      approximateDistanceMeters: 240,
      status: 'received',
      acceptedAt: '2026-08-03T00:00:00.000Z',
      whySuggested: 'Nearby public report in the same category.',
    });
    expect(candidate).not.toHaveProperty('exactAddress');
    expect(() =>
      duplicateCandidateSchema.parse({ ...candidate, publicId: 'not safe/id' }),
    ).toThrow();
  });
});

describe('Phase 3 reporting contracts', () => {
  it('distinguishes a new report draft from a private support intent', () => {
    expect(verifiedDraftIntentSchema.parse(validDraft).intentKind).toBe(
      'new_report',
    );
    expect(
      verifiedDraftIntentSchema.parse({
        ...validDraft,
        intentKind: 'support_existing',
        duplicateTargetPublicId: 'HBR-SYNTHETIC-1',
        notificationLevel: 'none',
      }).duplicateTargetPublicId,
    ).toBe('HBR-SYNTHETIC-1');
    expect(() =>
      verifiedDraftIntentSchema.parse({
        ...validDraft,
        intentKind: 'support_existing',
      }),
    ).toThrow();
  });

  it('validates atomic submission and recoverable gate results', () => {
    expect(
      reportSubmissionRequestSchema.parse({
        draftId: ids.draft,
        expectedVersion: 1,
        idempotencyKey: ids.idempotency,
        correlationId: ids.correlation,
      }).expectedVersion,
    ).toBe(1);
    expect(
      reportSubmissionResultSchema.parse({
        reportId: ids.report,
        publicId: 'HBR-ABC123DEF456',
        reportStatus: 'pending_moderation',
        publicationState: 'pending',
        moderation: {
          state: 'temporarily_unavailable',
          retryable: true,
        },
      }).moderation.retryable,
    ).toBe(true);
  });

  it('keeps support identity private while preserving notification choice', () => {
    expect(
      reportRelationshipRequestSchema.parse({
        publicId: 'HBR-SYNTHETIC-1',
        kind: 'support',
        enabled: true,
        notificationLevel: 'none',
        idempotencyKey: ids.idempotency,
        correlationId: ids.correlation,
      }),
    ).not.toHaveProperty('userId');
  });
});

describe('Phase 3 public-safe read contracts', () => {
  it('rejects missing qualified timeline evidence', () => {
    const event = {
      publicId: 'HBR-SYNTHETIC-1',
      publicLabel: 'Accepted by the platform',
      newStatus: 'submitted',
      createdAt: '2026-08-03T00:00:00.000Z',
      actorType: 'system',
      source: 'system',
    };
    expect(publicTimelineEventSchema.parse(event).actorType).toBe('system');
    expect(() =>
      publicTimelineEventSchema.parse({ ...event, actorType: undefined }),
    ).toThrow();
  });

  it('allows only the explicit public report projection', () => {
    const parsed = publicReportSchema.parse({
      publicId: 'HBR-SYNTHETIC-1',
      title: 'Synthetic footpath sample',
      description: 'Approved synthetic public text.',
      status: 'submitted',
      closeReason: null,
      publicLabel: 'Harborfield North (Synthetic)',
      publicLocationPrecision: 'neighborhood',
      publicLatitude: 0,
      publicLongitude: 0,
      acceptedAt: '2026-08-03T00:00:00.000Z',
      updatedAt: '2026-08-03T00:00:00.000Z',
      categoryName: 'Street or footpath',
      supportCount: 0,
      exactAddress: 'must be stripped',
    });
    expect(parsed).not.toHaveProperty('exactAddress');
  });
});
