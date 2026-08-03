'use client';

import { safeNextPath } from '@civic-reporting/domain';
import { createClient } from '@/lib/supabase/browser';
import { MfaEnrollment, type MfaAdapter } from './mfa-enrollment';

const adapter: MfaAdapter = {
  async enroll() {
    const { data, error } = await createClient().auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Civic Reporting local pilot',
    });
    if (error || !data.totp) {
      return { ok: false, message: error?.message ?? 'Enrollment failed' };
    }
    return {
      ok: true,
      factorId: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
    };
  },
  async verify(factorId, code) {
    const { error } = await createClient().auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    if (error) return { ok: false, message: error.message };
    const { error: refreshError } = await createClient().auth.refreshSession();
    return refreshError
      ? { ok: false, message: refreshError.message }
      : { ok: true };
  },
};

export function MfaEnrollmentBoundary({ nextPath }: { nextPath?: string }) {
  const safePath = safeNextPath(nextPath);
  return (
    <MfaEnrollment
      adapter={adapter}
      nextPath={safePath}
      onVerified={(path) => window.location.assign(path)}
    />
  );
}
