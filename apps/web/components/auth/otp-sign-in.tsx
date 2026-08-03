'use client';

import {
  otpRequestSchema,
  otpVerificationSchema,
} from '@civic-reporting/contracts';
import { mapOtpError } from '@civic-reporting/domain';
import { useEffect, useRef, useState, type FormEvent } from 'react';

type AdapterResult = { ok: true } | { ok: false; message: string };
type DraftClaimResult =
  { ok: true; nextPath?: string } | { ok: false; message: string };

export interface OtpAuth {
  requestOtp(email: string): Promise<AdapterResult>;
  verifyOtp(email: string, token: string): Promise<AdapterResult>;
}

export interface DraftHandshake {
  hasSavedDraft(): Promise<boolean>;
  claim(): Promise<DraftClaimResult>;
}

interface OtpSignInProps {
  auth: OtpAuth;
  draft: DraftHandshake;
  nextPath: string;
  onVerified(path: string): void;
}

const errorMessages = {
  expired_or_invalid:
    'That code is invalid or has expired. Resend it and try again.',
  rate_limited: 'Too many attempts. Wait before requesting another code.',
  temporarily_unavailable:
    'Email verification is temporarily unavailable. Your draft remains on this device.',
};

export function OtpSignIn({
  auth,
  draft,
  nextPath,
  onVerified,
}: OtpSignInProps) {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void draft
      .hasSavedDraft()
      .then(setHasDraft)
      .catch(() => setHasDraft(false));
  }, [draft]);

  useEffect(() => {
    if (error) errorRef.current?.focus();
  }, [error]);

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    setError(null);
    const parsed = otpRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setError('Enter a valid email address.');
      return;
    }
    setBusy(true);
    const result = await auth.requestOtp(parsed.data.email);
    setBusy(false);
    if (!result.ok) {
      setError(errorMessages[mapOtpError(result.message)]);
      return;
    }
    setEmail(parsed.data.email);
    setStep('code');
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = otpVerificationSchema.safeParse({ email, token });
    if (!parsed.success) {
      setError('Enter the six-digit code from the email.');
      return;
    }
    setBusy(true);
    const result = await auth.verifyOtp(parsed.data.email, parsed.data.token);
    if (!result.ok) {
      setBusy(false);
      setError(errorMessages[mapOtpError(result.message)]);
      return;
    }
    let claimResult: DraftClaimResult;
    try {
      claimResult = await draft.claim();
    } catch {
      claimResult = {
        ok: false,
        message:
          'The verified draft could not be copied yet. Retry from this browser.',
      };
    }
    setBusy(false);
    if (!claimResult.ok) {
      setError(claimResult.message);
      return;
    }
    const isReportingRecovery =
      nextPath === '/report/new?verified=1' || nextPath.startsWith('/reports/');
    onVerified(
      isReportingRecovery ? (claimResult.nextPath ?? nextPath) : nextPath,
    );
  }

  return (
    <section
      className="rounded-panel border border-ink/15 bg-surface p-6 sm:p-8"
      aria-labelledby="sign-in-heading"
    >
      <h1 className="m-0 text-3xl font-black" id="sign-in-heading">
        Verify your email
      </h1>
      <p className="mt-3 text-neutral">
        We send a six-digit code. Paste it in this same browser so your local
        draft stays available.
      </p>
      {hasDraft ? (
        <p className="rounded-control border-l-4 border-civic bg-canvas p-4 font-semibold">
          Your draft is still saved on this device. It is not readable by the
          server before verification.
        </p>
      ) : null}
      {error ? (
        <div
          ref={errorRef}
          role="alert"
          tabIndex={-1}
          className="my-4 rounded-control border-l-4 border-error bg-error-bg p-4 font-semibold"
        >
          {error}
        </div>
      ) : null}
      {step === 'email' ? (
        <form className="mt-6 grid gap-4" onSubmit={requestCode} noValidate>
          <label className="grid gap-2 font-bold" htmlFor="email">
            Email address
            <input
              className="min-h-12 rounded-control border-2 border-ink bg-white px-3 py-2 font-normal"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <button
            className="min-h-12 rounded-control bg-civic px-5 py-3 font-extrabold text-white disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? 'Sending code…' : 'Email me a code'}
          </button>
        </form>
      ) : (
        <form className="mt-6 grid gap-4" onSubmit={verifyCode} noValidate>
          <p className="m-0 text-sm text-neutral">
            Code sent to <strong>{email}</strong>.
          </p>
          <label className="grid gap-2 font-bold" htmlFor="otp">
            Six-digit code
            <input
              className="min-h-12 rounded-control border-2 border-ink bg-white px-3 py-2 font-mono text-xl tracking-[0.25em]"
              id="otp"
              name="otp"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="one-time-code"
              maxLength={6}
              value={token}
              onChange={(event) =>
                setToken(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
            />
          </label>
          <button
            className="min-h-12 rounded-control bg-civic px-5 py-3 font-extrabold text-white disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? 'Verifying…' : 'Verify code'}
          </button>
          <div className="flex flex-wrap gap-3">
            <button
              className="min-h-11 rounded-control border-2 border-ink bg-surface px-4 py-2 font-bold"
              disabled={busy}
              onClick={() => void requestCode()}
              type="button"
            >
              Resend code
            </button>
            <button
              className="min-h-11 rounded-control px-4 py-2 font-bold text-link underline"
              disabled={busy}
              onClick={() => {
                setStep('email');
                setToken('');
                setError(null);
              }}
              type="button"
            >
              Change email
            </button>
          </div>
        </form>
      )}
      <p className="mb-0 mt-6 text-sm text-neutral">
        Shared device? Clear the local draft and sign out when you finish.
      </p>
    </section>
  );
}
