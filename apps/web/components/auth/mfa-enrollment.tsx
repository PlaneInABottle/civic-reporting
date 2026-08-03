'use client';

import { useRef, useState, type FormEvent } from 'react';

type EnrollmentResult =
  | { ok: true; factorId: string; qrCode: string; secret: string }
  | { ok: false; message: string };
type VerificationResult = { ok: true } | { ok: false; message: string };

export interface MfaAdapter {
  enroll(): Promise<EnrollmentResult>;
  verify(factorId: string, code: string): Promise<VerificationResult>;
}

export function MfaEnrollment({
  adapter,
  nextPath,
  onVerified,
}: {
  adapter: MfaAdapter;
  nextPath: string;
  onVerified(path: string): void;
}) {
  const [enrollment, setEnrollment] = useState<Extract<
    EnrollmentResult,
    { ok: true }
  > | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  function showError(message: string) {
    setError(message);
    queueMicrotask(() => errorRef.current?.focus());
  }

  async function enroll() {
    setBusy(true);
    setError(null);
    const result = await adapter.enroll();
    setBusy(false);
    if (!result.ok) {
      showError('Authenticator setup is temporarily unavailable. Try again.');
      return;
    }
    setEnrollment(result);
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!enrollment || !/^\d{6}$/.test(code)) {
      showError('Enter the six-digit code from your authenticator.');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await adapter.verify(enrollment.factorId, code);
    setBusy(false);
    if (!result.ok) {
      showError('That authenticator code could not be verified. Try again.');
      return;
    }
    onVerified(nextPath);
  }

  return (
    <section
      aria-labelledby="mfa-heading"
      className="rounded-panel border border-ink/15 bg-surface p-6 sm:p-8"
    >
      <h1 className="m-0 text-3xl font-black" id="mfa-heading">
        Set up multi-factor authentication
      </h1>
      <p className="mt-3 text-neutral">
        Administrator routes require a verified authenticator code in addition
        to email verification.
      </p>
      {error ? (
        <div
          className="my-4 rounded-control border-l-4 border-error bg-error-bg p-4 font-semibold"
          ref={errorRef}
          role="alert"
          tabIndex={-1}
        >
          {error}
        </div>
      ) : null}
      {!enrollment ? (
        <button
          className="mt-4 min-h-12 rounded-control bg-civic px-5 py-3 font-extrabold text-white disabled:opacity-60"
          disabled={busy}
          onClick={() => void enroll()}
          type="button"
        >
          {busy ? 'Preparing authenticator…' : 'Set up authenticator'}
        </button>
      ) : (
        <form className="mt-6 grid gap-4" noValidate onSubmit={verify}>
          {/* Supabase returns a local data URI; no remote QR provider is used. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt="Authenticator QR code"
            className="size-52 max-w-full border border-ink/15 bg-white p-2"
            height="208"
            src={enrollment.qrCode}
            width="208"
          />
          <label className="grid gap-2 font-bold" htmlFor="manual-key">
            Manual setup key
            <input
              className="min-h-12 rounded-control border-2 border-ink bg-white px-3 py-2 font-mono font-normal"
              id="manual-key"
              readOnly
              type="password"
              value={enrollment.secret}
            />
          </label>
          <label className="grid gap-2 font-bold" htmlFor="totp-code">
            Authenticator code
            <input
              autoComplete="one-time-code"
              className="min-h-12 rounded-control border-2 border-ink bg-white px-3 py-2 font-mono text-xl tracking-[0.25em]"
              id="totp-code"
              inputMode="numeric"
              maxLength={6}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
              }
              pattern="[0-9]*"
              value={code}
            />
          </label>
          <button
            className="min-h-12 rounded-control bg-civic px-5 py-3 font-extrabold text-white disabled:opacity-60"
            disabled={busy}
            type="submit"
          >
            {busy ? 'Verifying…' : 'Verify authenticator'}
          </button>
        </form>
      )}
      <p className="mb-0 mt-6 text-sm text-neutral">
        Store recovery information in an approved secure location. The pilot
        does not claim a production account-recovery process is complete.
      </p>
    </section>
  );
}
