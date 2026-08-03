import { PublicShell } from '@/components/public-shell';
import Link from 'next/link';
import { requireRoute } from '@/lib/auth/require-route';
import { createClient } from '@/lib/supabase/server';

export default async function AccountDraftsPage() {
  await requireRoute({ kind: 'citizen' }, '/account/drafts');
  const supabase = await createClient();
  const { data: drafts } = await supabase
    .from('report_drafts')
    .select('id, description, expires_at, updated_at')
    .order('updated_at', { ascending: false });

  return (
    <PublicShell>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6" id="main-content">
        <p className="font-extrabold text-civic">Verified citizen area</p>
        <h1 className="text-3xl font-black">Verified drafts</h1>
        <p className="text-neutral">
          Server drafts appear only after email verification and expire
          automatically.
        </p>
        {drafts?.length ? (
          <ul className="mt-8 grid list-none gap-4 p-0">
            {drafts.map((draft) => (
              <li
                className="rounded-panel border border-ink/15 bg-surface p-5"
                key={draft.id}
              >
                <p className="m-0 font-bold">{draft.description}</p>
                <p className="mb-0 mt-2 text-sm text-neutral">
                  Draft ID {draft.id.slice(0, 8)}… · expires{' '}
                  {new Date(draft.expires_at).toLocaleDateString('en')}
                </p>
                <Link
                  className="mt-3 inline-block font-bold text-link"
                  href="/report/new?verified=1"
                >
                  Continue and submit
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <section className="mt-8 rounded-panel border border-ink/15 bg-surface p-6">
            <h2 className="m-0 text-xl font-extrabold">No verified drafts</h2>
            <p className="mb-0 text-neutral">
              A local browser draft is not sent here until verification
              succeeds.
            </p>
          </section>
        )}
      </main>
    </PublicShell>
  );
}
