import { describe, expect, it } from 'vitest';
import {
  actorQualifiedStatus,
  buildDeterministicTitle,
  mapSubmissionFailure,
  orderDuplicateCandidates,
  publicLocationPreview,
} from '../src/index';

describe('Phase 3 publication rules', () => {
  it('builds a deterministic title from public-safe inputs only', () => {
    expect(
      buildDeterministicTitle(
        'Street or footpath',
        'Harborfield North (Synthetic)',
      ),
    ).toBe('Street or footpath near Harborfield North (Synthetic)');
  });

  it('withholds coordinates when the policy says withheld', () => {
    expect(
      publicLocationPreview(
        { longitude: 0.0042, latitude: 0.0031 },
        'Harborfield private area (Synthetic)',
        'withheld',
      ),
    ).toEqual({
      label: 'Harborfield private area (Synthetic)',
      location: null,
      precision: 'withheld',
    });
  });

  it('never renders an unqualified organization status', () => {
    expect(actorQualifiedStatus('submitted', null)).toBe(
      'Accepted by the platform',
    );
    expect(actorQualifiedStatus('in_progress', null)).toBe(
      'Work marked in progress by the fictional organization',
    );
    expect(actorQualifiedStatus('resolved', null)).toBe(
      'Marked resolved by the fictional organization',
    );
    expect(actorQualifiedStatus('closed', 'duplicate')).toBe(
      'Closed — duplicate of another report',
    );
  });
});

describe('Phase 3 recovery and duplicate rules', () => {
  it('treats an uncertain transport result as safe to retry idempotently', () => {
    expect(mapSubmissionFailure('Failed to fetch')).toEqual({
      kind: 'uncertain',
      retryable: true,
      message:
        'Submission interrupted — check status before retrying. The same retry key will not create another report.',
    });
    expect(mapSubmissionFailure('verified_identity_required').retryable).toBe(
      false,
    );
  });

  it('prioritizes same-category nearby reports and caps the list at five', () => {
    const candidates = Array.from({ length: 7 }, (_, index) => ({
      publicId: `HBR-SYNTHETIC-${index}`,
      title: `Synthetic report ${index}`,
      publicLabel: 'Harborfield North (Synthetic)',
      categoryName: index === 6 ? 'Street or footpath' : 'Waste',
      approximateDistanceMeters: 100 + index,
      status: 'submitted' as const,
      acceptedAt: '2026-08-03T00:00:00.000Z',
      whySuggested: 'Nearby public report.',
    }));
    const ordered = orderDuplicateCandidates(candidates, 'Street or footpath');
    expect(ordered).toHaveLength(5);
    expect(ordered[0]?.publicId).toBe('HBR-SYNTHETIC-6');
  });
});
