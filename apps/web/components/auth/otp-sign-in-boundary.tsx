'use client';

import { safeNextPath } from '@civic-reporting/domain';
import { draftHandshake, otpAuth } from '@/lib/auth/browser-adapters';
import { OtpSignIn } from './otp-sign-in';

export function OtpSignInBoundary({ nextPath }: { nextPath?: string }) {
  const safePath = safeNextPath(nextPath);
  return (
    <OtpSignIn
      auth={otpAuth}
      draft={draftHandshake}
      nextPath={safePath}
      onVerified={(path) => window.location.assign(path)}
    />
  );
}
