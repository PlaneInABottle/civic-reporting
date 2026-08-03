import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OtpSignIn } from '@/components/auth/otp-sign-in';
import { claimVerifiedDraftIntent } from '@/lib/auth/browser-adapters';

const supportIntent = {
  intentKind: 'support_existing' as const,
  organizationCategoryId: '30000000-0000-4000-8000-000000000001',
  description: 'Private support intent for a synthetic public report.',
  exactLocation: { longitude: 0.0042, latitude: 0.0031 },
  exactAddress: 'Private Fixture Lane 77',
  publicLocation: { longitude: 0, latitude: 0 },
  publicLabel: 'Harborfield North (Synthetic)',
  publicLocationPrecision: 'neighborhood' as const,
  publicationPolicyVersion: 1,
  idempotencyKey: 'a1000000-0000-4000-8000-000000000001',
  correlationId: 'a1000000-0000-4000-8000-000000000002',
  duplicateTargetPublicId: 'HBR-SYNTHETIC-1',
  notificationLevel: 'none' as const,
};

describe('Phase 3 same-browser recovery intents', () => {
  it('claims a duplicate support intent without creating a report draft', async () => {
    const createDraft = vi.fn();
    const setRelationship = vi.fn().mockResolvedValue(undefined);

    const result = await claimVerifiedDraftIntent(supportIntent, {
      createDraft,
      setRelationship,
    });

    expect(createDraft).not.toHaveBeenCalled();
    expect(setRelationship).toHaveBeenCalledWith(
      expect.objectContaining({
        target_public_id: 'HBR-SYNTHETIC-1',
        requested_kind: 'support',
        requested_enabled: true,
        requested_notification_level: 'none',
      }),
    );
    expect(result).toEqual({
      ok: true,
      nextPath: '/reports/HBR-SYNTHETIC-1?supported=1',
    });
  });

  it('continues to the path selected by the claimed local intent', async () => {
    const user = userEvent.setup();
    const onVerified = vi.fn();
    render(
      <OtpSignIn
        auth={{
          requestOtp: vi.fn().mockResolvedValue({ ok: true }),
          verifyOtp: vi.fn().mockResolvedValue({ ok: true }),
        }}
        draft={{
          claim: vi.fn().mockResolvedValue({
            ok: true,
            nextPath: '/reports/HBR-SYNTHETIC-1?supported=1',
          }),
          hasSavedDraft: vi.fn().mockResolvedValue(true),
        }}
        nextPath="/report/new?verified=1"
        onVerified={onVerified}
      />,
    );

    await user.type(
      screen.getByLabelText('Email address'),
      'pilot@example.test',
    );
    await user.click(screen.getByRole('button', { name: 'Email me a code' }));
    await user.type(await screen.findByLabelText('Six-digit code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    await waitFor(() =>
      expect(onVerified).toHaveBeenCalledWith(
        '/reports/HBR-SYNTHETIC-1?supported=1',
      ),
    );
  });
});
