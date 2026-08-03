import type { Metadata } from 'next';
import { PublicShell } from '@/components/public-shell';
import { MfaEnrollmentBoundary } from '@/components/auth/mfa-enrollment-boundary';
import { requireRoute } from '@/lib/auth/require-route';

export const metadata: Metadata = {
  title: 'Account security',
  robots: { index: false, follow: false },
};

export default async function AccountSecurityPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await requireRoute({ kind: 'citizen' }, '/account/security');
  const { next } = await searchParams;
  return (
    <PublicShell>
      <main
        className="mx-auto max-w-[40rem] px-4 py-10 sm:px-6"
        id="main-content"
      >
        <MfaEnrollmentBoundary nextPath={next} />
      </main>
    </PublicShell>
  );
}
