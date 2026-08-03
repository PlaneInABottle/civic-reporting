import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  TextModerationUnavailableError,
  createTextModerationAdapter,
} from '../../../supabase/functions/_shared/text-moderation';
import { completedSubmissionResult } from '../../../supabase/functions/_shared/submission-state';

function read(relativeUrl: string) {
  return readFileSync(new URL(relativeUrl, import.meta.url), 'utf8');
}

describe('Phase 3 semantic text moderation adapter', () => {
  it('returns a current published result without re-running a finalized gate', () => {
    expect(
      completedSubmissionResult({
        report_id: 'a1000000-0000-4000-8000-000000000001',
        public_id: 'HBR-SYNTHETIC-1',
        report_status: 'submitted',
        publication_state: 'published',
      }),
    ).toEqual({
      reportId: 'a1000000-0000-4000-8000-000000000001',
      publicId: 'HBR-SYNTHETIC-1',
      reportStatus: 'submitted',
      publicationState: 'published',
      moderation: { state: 'published', retryable: false },
    });
  });

  it('uses the explicit fake only for safe synthetic local fixtures', async () => {
    const adapter = createTextModerationAdapter({
      provider: 'local-safe-fixture',
      runtime: 'local',
    });
    await expect(
      adapter.moderate({
        attempt: 1,
        description: 'A safe synthetic path defect for local testing.',
      }),
    ).resolves.toEqual({ decision: 'approved', code: 'local_safe_fixture' });
    await expect(
      adapter.moderate({
        attempt: 1,
        description: 'Synthetic review fixture for trained human follow-up.',
      }),
    ).resolves.toEqual({
      decision: 'escalated',
      code: 'local_review_fixture',
    });
  });

  it('models a recoverable provider outage without weakening the gate', async () => {
    const adapter = createTextModerationAdapter({
      provider: 'local-safe-fixture',
      runtime: 'local',
    });
    await expect(
      adapter.moderate({
        attempt: 1,
        description: 'Synthetic provider retry fixture for local recovery.',
      }),
    ).rejects.toBeInstanceOf(TextModerationUnavailableError);
    await expect(
      adapter.moderate({
        attempt: 2,
        description: 'Synthetic provider retry fixture for local recovery.',
      }),
    ).resolves.toEqual({ decision: 'approved', code: 'local_retry_recovered' });
  });

  it('fails closed outside the local runtime when no approved provider exists', () => {
    expect(() =>
      createTextModerationAdapter({
        provider: 'local-safe-fixture',
        runtime: 'production',
      }),
    ).toThrow(TextModerationUnavailableError);
    expect(() =>
      createTextModerationAdapter({
        provider: undefined,
        runtime: 'production',
      }),
    ).toThrow(TextModerationUnavailableError);
  });
});

describe('Phase 3 protected worker source boundary', () => {
  it('keeps privileged credentials inside the Edge Function and validates the user', () => {
    const source = read('../../../supabase/functions/submit-report/index.ts');
    expect(source).toContain('SUPABASE_SERVICE_ROLE_KEY');
    expect(source).toContain('auth.getUser');
    expect(source).toMatch(/rpc\(\s*'submit_verified_report'/);
    expect(source).toMatch(/rpc\(\s*'record_text_moderation_attempt'/);
    expect(source).toMatch(/rpc\(\s*'finalize_text_moderation'/);
    expect(source).not.toMatch(/console\.(log|info)\([^)]*description/);
    expect(source).not.toContain('submissionError?.message');
    expect(source).toContain("'submission_conflict'");
    expect(source).toContain("'submission_forbidden'");
  });

  it('serves the function with JWT verification and an explicit local adapter', () => {
    const config = read('../../../supabase/config.toml');
    const example = read('../../../supabase/functions/.env.example');
    expect(config).toContain('[functions.submit-report]');
    expect(config).toContain('verify_jwt = true');
    expect(example).toContain('TEXT_MODERATION_PROVIDER=unconfigured');
    expect(example).not.toContain('SERVICE_ROLE');
  });
});
