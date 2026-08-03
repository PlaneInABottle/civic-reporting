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
          Only your own verified drafts are available in Phase 2.
        </p>
        <Link className="font-bold text-link" href="/account/drafts">
          View verified drafts
        </Link>
      </main>
    </PublicShell>
  );
}
