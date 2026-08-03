import Link from 'next/link';
import { PublicShell } from '@/components/public-shell';
import { requireRoute } from '@/lib/auth/require-route';
import { createClient } from '@/lib/supabase/server';

export default async function AccountReportsPage() {
  await requireRoute({ kind: 'citizen' }, '/account/reports');
  const supabase = await createClient();
  const { data: reports, error } = await supabase
    .from('reports')
    .select(
      'id, public_id, description, public_title, status, close_reason, publication_state, accepted_at, updated_at',
    )
    .order('accepted_at', { ascending: false });

  return (
    <PublicShell>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6" id="main-content">
        <p className="font-extrabold text-civic">Verified citizen area</p>
        <h1 className="text-3xl font-black">Your reports</h1>
        <p className="text-neutral">
          These are platform states. “Submitted” means accepted by this
          platform; organization delivery is not implemented in Phase 3.
        </p>
        {error ? (
          <section className="mt-8 rounded-panel border border-error bg-surface p-6">
            <h2 className="m-0 text-xl font-extrabold">
              Private reports did not load
            </h2>
            <p className="mb-0 text-neutral">
              Retry later. No public fallback is substituted for your private
              dashboard.
            </p>
          </section>
        ) : reports?.length ? (
          <ul
            aria-label="Your reports"
            className="mt-8 grid list-none gap-4 p-0"
          >
            {reports.map((report) => (
              <li
                className="rounded-panel border border-ink/15 bg-surface p-5"
                key={report.id}
              >
                <p className="m-0 text-sm font-extrabold text-civic">
                  {report.publication_state === 'published'
                    ? 'Published after platform safety checks'
                    : report.publication_state === 'rejected'
                      ? 'Not published under the content policy'
                      : 'Private — platform safety checks pending'}
                </p>
                <h2 className="mb-0 mt-2 text-xl font-extrabold">
                  {report.public_title ?? 'Private report awaiting publication'}
                </h2>
                <p className="whitespace-pre-wrap text-neutral">
                  {report.description}
                </p>
                <p className="text-sm font-bold">
                  Platform state: {report.status.replaceAll('_', ' ')} ·{' '}
                  reference {report.public_id}
                </p>
                {report.publication_state === 'published' ? (
                  <Link
                    className="font-bold text-link"
                    href={`/reports/${report.public_id}`}
                  >
                    View public-safe report
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <section className="mt-8 rounded-panel border border-ink/15 bg-surface p-6">
            <h2 className="m-0 text-xl font-extrabold">No submitted reports</h2>
            <p className="text-neutral">
              A verified draft is not a report until you review and submit it.
            </p>
            <Link className="font-bold text-link" href="/report/new">
              Start a report
            </Link>
          </section>
        )}
      </main>
    </PublicShell>
  );
}
