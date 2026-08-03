import Link from 'next/link';
import { requireRoute } from '@/lib/auth/require-route';

export function PlatformPageContent() {
  return (
    <>
      <a
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-control bg-ink px-4 py-3 font-semibold text-white focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>
      <header className="border-b border-ink/15 bg-surface">
        <div className="mx-auto flex min-h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div>
            <Link
              className="font-extrabold text-ink no-underline"
              href="/platform"
            >
              Civic Reporting
            </Link>
            <p className="m-0 text-xs font-bold text-neutral">
              Narrow platform backstop
            </p>
          </div>
          <span className="rounded-control border border-ink/20 px-3 py-2 text-sm font-bold">
            Synthetic pilot
          </span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6" id="main-content">
        <p className="mb-2 font-extrabold text-civic">
          Operational metadata only
        </p>
        <h1 className="m-0 text-3xl font-black">Platform health</h1>
        <p className="mt-3 max-w-prose text-neutral">
          Redacted by default. This surface is not a report, identity, exact
          location, or media browser.
        </p>
        <section
          aria-labelledby="gate-heading"
          className="mt-8 rounded-panel border border-attention/40 bg-warning-bg p-6"
        >
          <h2 className="m-0 text-xl font-extrabold" id="gate-heading">
            Launch blockers
          </h2>
          <ul className="mb-0 mt-4 grid gap-2 pl-6 text-neutral">
            <li>
              Legal, privacy, and real-jurisdiction approval not complete.
            </li>
            <li>
              Moderation provider DPA and trained staffing not configured.
            </li>
            <li>
              Production email, delivery, monitoring, and backup not verified.
            </li>
            <li>Public media remains disabled.</li>
          </ul>
        </section>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            ['App runtime', 'Not connected'],
            ['Pilot organization', 'Synthetic fixture only'],
            ['Active incidents', 'Metadata unavailable'],
          ].map(([label, value]) => (
            <section
              className="rounded-panel border border-ink/15 bg-surface p-5"
              key={label}
            >
              <h2 className="m-0 text-sm font-bold text-neutral">{label}</h2>
              <p className="mb-0 mt-2 font-extrabold">{value}</p>
            </section>
          ))}
        </div>
      </main>
    </>
  );
}

export default async function PlatformPage() {
  await requireRoute(
    { kind: 'platform', preset: 'platform_admin' },
    '/platform',
  );
  return <PlatformPageContent />;
}
