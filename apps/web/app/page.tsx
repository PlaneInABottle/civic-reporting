import Link from 'next/link';
import { PublicShell } from '@/components/public-shell';
import { ScreenStateGallery } from '@/components/screen-state-gallery';

export default function HomePage() {
  return (
    <PublicShell>
      <main id="main-content">
        <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:py-20">
          <div className="max-w-2xl">
            <p className="mb-3 font-extrabold text-civic">
              Non-emergency public-space issues
            </p>
            <h1 className="m-0 text-4xl font-black leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-[3.25rem]">
              Tell the right team what needs attention.
            </h1>
            <p className="mt-6 max-w-prose text-lg text-neutral">
              Report a problem in the fictional Harborfield Pilot District. We
              explain what can be public, verify your email before routing, and
              never pretend a team has acted when it has not.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-control bg-safety px-6 py-3 font-extrabold text-ink no-underline hover:bg-safety-hover"
                href="/report/new"
              >
                Start a report
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-control border-2 border-ink px-6 py-3 font-bold text-ink no-underline"
                href="/reports"
              >
                Browse public reports
              </Link>
            </div>
            <p className="mt-5 text-sm text-neutral">
              Do not use this pilot for emergencies or immediate danger. Email
              verification is required before a report can be routed.
            </p>
          </div>
          <aside className="rounded-panel border border-ink/10 bg-surface p-6 lg:p-8">
            <p className="m-0 text-sm font-extrabold uppercase tracking-[0.12em] text-civic">
              How it works
            </p>
            <ol className="mt-6 grid gap-6 pl-6">
              <li>
                <strong>Locate</strong>
                <span className="block text-neutral">
                  Search or use the non-map address path.
                </span>
              </li>
              <li>
                <strong>Describe</strong>
                <span className="block text-neutral">
                  Check similar reports, then explain the issue.
                </span>
              </li>
              <li>
                <strong>Track</strong>
                <span className="block text-neutral">
                  See platform, delivery, and organization facts separately.
                </span>
              </li>
            </ol>
          </aside>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <ScreenStateGallery />
        </section>
      </main>
    </PublicShell>
  );
}
