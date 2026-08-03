import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MfaEnrollment } from '@/components/auth/mfa-enrollment';

describe('Phase 2 administrator MFA enrollment', () => {
  it('enrolls TOTP and verifies a six-digit challenge', async () => {
    const user = userEvent.setup();
    const verify = vi.fn().mockResolvedValue({ ok: true });
    render(
      <MfaEnrollment
        adapter={{
          enroll: vi.fn().mockResolvedValue({
            ok: true,
            factorId: 'factor-1',
            qrCode: 'data:image/svg+xml,test-only',
            secret: 'SYNTHETICTESTKEY',
          }),
          verify,
        }}
        nextPath="/platform"
        onVerified={vi.fn()}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: 'Set up authenticator' }),
    );
    expect(
      await screen.findByRole('img', { name: /authenticator qr code/i }),
    ).toBeVisible();
    expect(screen.getByLabelText('Manual setup key')).toHaveAttribute(
      'type',
      'password',
    );
    await user.type(screen.getByLabelText('Authenticator code'), '123456');
    await user.click(
      screen.getByRole('button', { name: 'Verify authenticator' }),
    );

    expect(verify).toHaveBeenCalledWith('factor-1', '123456');
  });

  it('keeps challenge failures recoverable', async () => {
    const user = userEvent.setup();
    render(
      <MfaEnrollment
        adapter={{
          enroll: vi.fn().mockResolvedValue({
            ok: true,
            factorId: 'factor-1',
            qrCode: 'data:image/svg+xml,test-only',
            secret: 'SYNTHETICTESTKEY',
          }),
          verify: vi.fn().mockResolvedValue({
            ok: false,
            message: 'Invalid TOTP code',
          }),
        }}
        nextPath="/platform"
        onVerified={vi.fn()}
      />,
    );
    await user.click(
      screen.getByRole('button', { name: 'Set up authenticator' }),
    );
    await user.type(
      await screen.findByLabelText('Authenticator code'),
      '000000',
    );
    await user.click(
      screen.getByRole('button', { name: 'Verify authenticator' }),
    );
    expect(await screen.findByRole('alert')).toHaveTextContent(
      /could not be verified/i,
    );
  });
});
