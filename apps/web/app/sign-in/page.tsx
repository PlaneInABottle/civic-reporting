import type { Metadata } from 'next';
import { PublicShell } from '@/components/public-shell';
import { OtpSignInBoundary } from '@/components/auth/otp-sign-in-boundary';

export const metadata: Metadata = {
  title: 'Verify your email',
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <PublicShell>
      <main
        className="mx-auto max-w-[40rem] px-4 py-10 sm:px-6"
        id="main-content"
      >
        <OtpSignInBoundary nextPath={next} />
      </main>
    </PublicShell>
  );
}
