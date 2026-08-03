import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { MfaEnrollment } from '@/components/auth/mfa-enrollment';
import { OtpSignIn } from '@/components/auth/otp-sign-in';

async function expectNoAxeViolations(container: HTMLElement) {
  const result = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  });
  expect(result.violations).toEqual([]);
}

describe('Phase 2 auth accessibility', () => {
  it('keeps both OTP states free of automated axe violations', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <OtpSignIn
        auth={{
          requestOtp: vi.fn().mockResolvedValue({ ok: true }),
          verifyOtp: vi.fn(),
        }}
        draft={{
          claim: vi.fn(),
          hasSavedDraft: vi.fn().mockResolvedValue(true),
        }}
        nextPath="/account"
        onVerified={vi.fn()}
      />,
    );

    await expectNoAxeViolations(container);
    await user.type(
      screen.getByLabelText('Email address'),
      'pilot@example.test',
    );
    await user.click(screen.getByRole('button', { name: 'Email me a code' }));
    await screen.findByLabelText('Six-digit code');
    await expectNoAxeViolations(container);
  });

  it('keeps TOTP enrollment free of automated axe violations', async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MfaEnrollment
        adapter={{
          enroll: vi.fn().mockResolvedValue({
            ok: true,
            factorId: 'synthetic-factor',
            qrCode: 'data:image/svg+xml,test-only',
            secret: 'SYNTHETICTESTKEY',
          }),
          verify: vi.fn(),
        }}
        nextPath="/platform"
        onVerified={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Set up authenticator' }),
    );
    await screen.findByLabelText('Authenticator code');
    await expectNoAxeViolations(container);
  });
});
