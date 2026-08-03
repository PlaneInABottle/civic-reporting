import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { OtpSignIn } from '@/components/auth/otp-sign-in';

describe('Phase 2 OTP and same-browser draft handshake', () => {
  it('requests a pasteable OTP and preserves the local draft indicator', async () => {
    const user = userEvent.setup();
    const requestOtp = vi.fn().mockResolvedValue({ ok: true });

    render(
      <OtpSignIn
        auth={{ requestOtp, verifyOtp: vi.fn() }}
        draft={{
          claim: vi.fn(),
          hasSavedDraft: vi.fn().mockResolvedValue(true),
        }}
        nextPath="/account/drafts"
        onVerified={vi.fn()}
      />,
    );

    expect(
      await screen.findByText(/draft is still saved on this device/i),
    ).toBeVisible();
    await user.type(
      screen.getByLabelText('Email address'),
      ' Pilot@Example.test ',
    );
    await user.click(screen.getByRole('button', { name: 'Email me a code' }));

    expect(requestOtp).toHaveBeenCalledWith('pilot@example.test');
    expect(await screen.findByLabelText('Six-digit code')).toHaveAttribute(
      'autocomplete',
      'one-time-code',
    );
    expect(screen.getByText(/same browser/i)).toBeVisible();
  });

  it('recovers from an invalid or expired OTP without discarding the draft', async () => {
    const user = userEvent.setup();
    const verifyOtp = vi.fn().mockResolvedValue({
      ok: false,
      message: 'Token has expired or is invalid',
    });

    render(
      <OtpSignIn
        auth={{
          requestOtp: vi.fn().mockResolvedValue({ ok: true }),
          verifyOtp,
        }}
        draft={{
          claim: vi.fn(),
          hasSavedDraft: vi.fn().mockResolvedValue(true),
        }}
        nextPath="/account/drafts"
        onVerified={vi.fn()}
      />,
    );

    await user.type(
      screen.getByLabelText('Email address'),
      'pilot@example.test',
    );
    await user.click(screen.getByRole('button', { name: 'Email me a code' }));
    await user.type(await screen.findByLabelText('Six-digit code'), '000000');
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /code is invalid or has expired/i,
    );
    expect(
      screen.getByText(/draft is still saved on this device/i),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Resend code' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Change email' })).toBeVisible();
  });

  it('claims a valid local draft only after verification and then continues safely', async () => {
    const user = userEvent.setup();
    const claim = vi.fn().mockResolvedValue({ ok: true });
    const onVerified = vi.fn();

    render(
      <OtpSignIn
        auth={{
          requestOtp: vi.fn().mockResolvedValue({ ok: true }),
          verifyOtp: vi.fn().mockResolvedValue({ ok: true }),
        }}
        draft={{ claim, hasSavedDraft: vi.fn().mockResolvedValue(true) }}
        nextPath="/account/drafts"
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

    await waitFor(() => expect(claim).toHaveBeenCalledOnce());
    expect(onVerified).toHaveBeenCalledWith('/account/drafts');
  });

  it('preserves an explicit account destination when a report draft is claimed', async () => {
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
            nextPath: '/report/new?verified=1',
          }),
          hasSavedDraft: vi.fn().mockResolvedValue(true),
        }}
        nextPath="/account/drafts"
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
      expect(onVerified).toHaveBeenCalledWith('/account/drafts'),
    );
  });

  it('keeps the verified session recoverable when local draft storage fails', async () => {
    const user = userEvent.setup();
    render(
      <OtpSignIn
        auth={{
          requestOtp: vi.fn().mockResolvedValue({ ok: true }),
          verifyOtp: vi.fn().mockResolvedValue({ ok: true }),
        }}
        draft={{
          claim: vi.fn().mockRejectedValue(new Error('IndexedDB unavailable')),
          hasSavedDraft: vi.fn().mockResolvedValue(true),
        }}
        nextPath="/account/drafts"
        onVerified={vi.fn()}
      />,
    );

    await user.type(
      screen.getByLabelText('Email address'),
      'pilot@example.test',
    );
    await user.click(screen.getByRole('button', { name: 'Email me a code' }));
    await user.type(await screen.findByLabelText('Six-digit code'), '123456');
    await user.click(screen.getByRole('button', { name: 'Verify code' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      /draft could not be copied yet/i,
    );
    expect(
      screen.getByText(/draft is still saved on this device/i),
    ).toBeVisible();
  });
});
