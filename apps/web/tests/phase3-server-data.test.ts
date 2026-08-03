import { describe, expect, it } from 'vitest';
import { selectLatestActionableDraft } from '@/lib/reporting/server-data';

describe('Phase 3 server draft continuity', () => {
  it('skips consumed drafts so a citizen can start another report', () => {
    const drafts = [
      { id: 'draft-consumed', updated_at: '2026-08-03T02:00:00Z' },
      { id: 'draft-open', updated_at: '2026-08-03T01:00:00Z' },
    ];

    expect(selectLatestActionableDraft(drafts, ['draft-consumed'])).toEqual(
      drafts[1],
    );
    expect(selectLatestActionableDraft(drafts, [])).toEqual(drafts[0]);
  });

  it('keeps a pending consumed draft actionable for publication retry', () => {
    const drafts = [{ id: 'draft-pending' }, { id: 'draft-older' }];

    expect(selectLatestActionableDraft(drafts, [])).toEqual(drafts[0]);
  });
});
