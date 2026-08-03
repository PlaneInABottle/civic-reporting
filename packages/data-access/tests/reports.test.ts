import { describe, expect, it } from 'vitest';
import {
  mapDuplicateCandidateRows,
  mapPublicReportRows,
  mapPublicTimelineRows,
  toRelationshipRpcArgs,
  toSubmissionRpcArgs,
} from '../src/index';

describe('Phase 3 public report data mapping', () => {
  it('maps snake-case view rows into the strict public contract', () => {
    const [report] = mapPublicReportRows([
      {
        public_id: 'HBR-SYNTHETIC-1',
        title: 'Synthetic footpath sample',
        description: 'Approved safe synthetic public description.',
        status: 'submitted',
        close_reason: null,
        public_label: 'Harborfield North (Synthetic)',
        public_location_precision: 'neighborhood',
        public_latitude: 0,
        public_longitude: 0,
        accepted_at: '2026-08-03T00:00:00.000Z',
        updated_at: '2026-08-03T00:00:00.000Z',
        category_name: 'Street or footpath',
        support_count: 2,
        exact_address: 'must never survive mapping',
      },
    ] as never);
    expect(report?.publicId).toBe('HBR-SYNTHETIC-1');
    expect(report).not.toHaveProperty('exactAddress');
  });

  it('requires actor and source evidence for every public event', () => {
    expect(
      mapPublicTimelineRows([
        {
          public_id: 'HBR-SYNTHETIC-1',
          public_label: 'Accepted by the platform',
          new_status: 'submitted',
          created_at: '2026-08-03T00:00:00.000Z',
          actor_type: 'system',
          source: 'system',
        },
      ])[0],
    ).toMatchObject({ actorType: 'system', source: 'system' });
  });

  it('maps only public-safe duplicate candidate fields', () => {
    expect(
      mapDuplicateCandidateRows([
        {
          public_id: 'HBR-SYNTHETIC-1',
          title: 'Synthetic footpath sample',
          public_label: 'Harborfield North (Synthetic)',
          category_name: 'Street or footpath',
          approximate_distance_meters: 210,
          status: 'submitted',
          accepted_at: '2026-08-03T00:00:00.000Z',
          why_suggested: 'Nearby public report in the same category.',
        },
      ])[0],
    ).not.toHaveProperty('reporterUserId');
  });
});

describe('Phase 3 RPC argument mapping', () => {
  it('maps submission identifiers without privileged credentials', () => {
    expect(
      toSubmissionRpcArgs({
        draftId: 'a1000000-0000-4000-8000-000000000003',
        expectedVersion: 1,
        idempotencyKey: 'a1000000-0000-4000-8000-000000000001',
        correlationId: 'a1000000-0000-4000-8000-000000000002',
      }),
    ).toEqual({
      target_draft_id: 'a1000000-0000-4000-8000-000000000003',
      expected_version: 1,
      request_idempotency_key: 'a1000000-0000-4000-8000-000000000001',
      request_correlation_id: 'a1000000-0000-4000-8000-000000000002',
    });
  });

  it('maps private relationship changes to the narrow RPC', () => {
    expect(
      toRelationshipRpcArgs({
        publicId: 'HBR-SYNTHETIC-1',
        kind: 'support',
        enabled: true,
        notificationLevel: 'none',
        idempotencyKey: 'a1000000-0000-4000-8000-000000000001',
        correlationId: 'a1000000-0000-4000-8000-000000000002',
      }),
    ).toMatchObject({
      target_public_id: 'HBR-SYNTHETIC-1',
      requested_kind: 'support',
      requested_enabled: true,
    });
  });
});
