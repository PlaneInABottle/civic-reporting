import type { Metadata } from 'next';
import Link from 'next/link';
import { PublicShell } from '@/components/public-shell';

export const metadata: Metadata = {
  title: 'Browse public reports',
  description:
    'Public-safe issue reports in the fictional Harborfield Pilot District.',
};

export default function ReportsPage() {
  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6" id="main-content">
        <div className="flex flex-col gap-6 border-b border-ink/15 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 font-extrabold text-civic">Harborfield pilot</p>
            <h1 className="m-0 text-3xl font-black sm:text-4xl">
              Browse public reports
            </h1>
            <p className="mt-3 text-neutral">
              The accessible list is available before the map and remains the
              source of truth on weak connections.
            </p>
          </div>
          <p className="m-0 text-sm text-neutral">
            Last refreshed: awaiting local data
          </p>
        </div>
        <div className="grid gap-6 py-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)]">
          <section aria-labelledby="report-list-heading">
            <h2 className="text-xl font-extrabold" id="report-list-heading">
              Report list
            </h2>
            <div className="rounded-panel border border-ink/15 bg-surface p-6">
              <h3 className="m-0 text-lg font-bold">
                Public reports are unavailable
              </h3>
              <p className="text-neutral">
                The Phase 1 shell has no backend data. Retry after the local
                service is connected, or start a report.
              </p>
              <button
                className="min-h-11 rounded-control border-2 border-ink px-4 py-2 font-bold"
                type="button"
              >
                Retry
              </button>
              <Link className="ml-4 font-bold" href="/report/new">
                Start a report
              </Link>
            </div>
          </section>
          <section aria-labelledby="map-heading">
            <h2 className="text-xl font-extrabold" id="map-heading">
              Optional map
            </h2>
            <div className="grid min-h-72 place-items-center rounded-panel border border-dashed border-ink/30 bg-map-empty p-6 text-center">
              <div>
                <p className="m-0 font-extrabold">Map not loaded</p>
                <p className="mt-2 max-w-md text-sm text-neutral">
                  Reports remain usable in the synchronized list when map tiles
                  are slow or unavailable.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </PublicShell>
  );
}
