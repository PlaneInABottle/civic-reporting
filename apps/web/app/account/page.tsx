import Link from 'next/link';
import { PublicShell } from '@/components/public-shell';
import { requireRoute } from '@/lib/auth/require-route';

export default async function AccountPage() {
  await requireRoute({ kind: 'citizen' }, '/account');
  return (
    <PublicShell>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6" id="main-content">
        <p className="font-extrabold text-civic">Verified citizen area</p>
        <h1 className="text-3xl font-black">Your account</h1>
        <p className="text-neutral">
          Review your private submissions and verified drafts. Platform
          acceptance never implies organization receipt or delivery.
        </p>
        <div className="flex flex-wrap gap-5">
          <Link className="font-bold text-link" href="/account/reports">
            View your reports
          </Link>
          <Link className="font-bold text-link" href="/account/drafts">
            View verified drafts
          </Link>
        </div>
      </main>
    </PublicShell>
  );
}
