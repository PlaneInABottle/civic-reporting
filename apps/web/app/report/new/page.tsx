import type { Metadata } from 'next';
import { PublicShell } from '@/components/public-shell';

export const metadata: Metadata = {
  title: 'Report an issue',
  robots: { index: false, follow: false },
};

export default function ReportNewPage() {
  return (
    <PublicShell>
      <main
        className="mx-auto max-w-[40rem] px-4 py-10 pb-28 sm:px-6"
        id="main-content"
      >
        <p className="m-0 text-sm font-extrabold text-civic">
          Step 1 of 6 · Location
        </p>
        <h1 className="mb-0 mt-3 text-3xl font-black sm:text-4xl">
          Where is the issue?
        </h1>
        <p className="mt-4 max-w-prose text-neutral">
          Choose a location inside the fictional Harborfield Pilot District.
          Email verification is required before your report is routed.
        </p>
        <section
          aria-labelledby="location-options-heading"
          className="mt-8 rounded-panel border border-ink/15 bg-surface p-6 sm:p-8"
        >
          <h2
            className="m-0 text-xl font-extrabold"
            id="location-options-heading"
          >
            Choose how to locate the issue
          </h2>
          <p className="mt-2 text-neutral">
            Location permission is requested only after you choose the location
            button. A complete non-map route is always available.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              className="min-h-12 rounded-control bg-civic px-5 py-3 font-extrabold text-white hover:bg-civic-hover"
              type="button"
            >
              Use my location
            </button>
            <button
              className="min-h-12 rounded-control border-2 border-ink bg-surface px-5 py-3 font-extrabold text-ink"
              type="button"
            >
              Enter address without a map
            </button>
          </div>
          <div className="mt-8 rounded-control border-l-4 border-attention bg-warning-bg p-4">
            <h2 className="m-0 text-base font-extrabold">
              Location not available?
            </h2>
            <p className="mb-0 mt-1 text-sm text-neutral">
              Your local draft is preserved if permission is denied, GPS times
              out, the map fails, or you go offline.
            </p>
          </div>
        </section>
      </main>
    </PublicShell>
  );
}
