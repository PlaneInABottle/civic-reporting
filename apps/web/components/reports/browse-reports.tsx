'use client';

import type { PublicReport } from '@civic-reporting/contracts';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function BrowseReports({
  reports,
  loadError = false,
}: {
  reports: PublicReport[];
  loadError?: boolean;
}) {
  const [showMap, setShowMap] = useState(false);
  const [selected, setSelected] = useState(reports[0]?.publicId ?? null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,1.1fr)]">
      <section aria-labelledby="report-list-heading">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold" id="report-list-heading">
            Report list
          </h2>
          <button
            className="secondary-button lg:hidden"
            onClick={() => setShowMap((value) => !value)}
            type="button"
          >
            {showMap ? 'Hide optional map' : 'Show optional map'}
          </button>
        </div>
        {offline ? (
          <p
            className="rounded-control border-l-4 border-attention bg-warning-bg p-4"
            role="status"
          >
            Offline — showing the last server-rendered public list.
          </p>
        ) : null}
        {loadError ? (
          <div className="rounded-panel border border-error bg-surface p-6">
            <h3 className="m-0 text-lg font-extrabold">
              Public reports are unavailable
            </h3>
            <p className="text-neutral">
              The last request failed. No private fallback data is shown.
            </p>
            <button
              className="secondary-button"
              onClick={() => window.location.reload()}
              type="button"
            >
              Retry public list
            </button>
          </div>
        ) : reports.length ? (
          <ul
            aria-label="Public reports"
            className="m-0 grid list-none gap-4 p-0"
          >
            {reports.map((report) => (
              <li key={report.publicId}>
                <article
                  className={`rounded-panel border bg-surface p-5 ${selected === report.publicId ? 'border-civic' : 'border-ink/15'}`}
                >
                  <p className="m-0 text-sm font-bold text-civic">
                    {report.categoryName}
                  </p>
                  <h3 className="mb-0 mt-2 text-xl font-extrabold">
                    <Link href={`/reports/${report.publicId}`}>
                      {report.title}
                    </Link>
                  </h3>
                  <p className="mt-2 text-neutral">
                    {report.publicLabel} · {report.supportCount} private support
                    {report.supportCount === 1 ? '' : 's'}
                  </p>
                  <button
                    className="mt-2 min-h-11 font-bold text-link underline"
                    onClick={() => {
                      setSelected(report.publicId);
                      setShowMap(true);
                    }}
                    type="button"
                  >
                    Show on optional map
                  </button>
                </article>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-panel border border-ink/15 bg-surface p-6">
            <h3 className="m-0 text-lg font-extrabold">No public reports</h3>
            <p className="mb-0 text-neutral">
              No text has passed the publication gate yet.
            </p>
          </div>
        )}
      </section>
      {showMap && !loadError ? (
        <section aria-label="Synthetic report map">
          <h2 className="text-xl font-extrabold">Optional schematic map</h2>
          <div
            aria-label="Public report markers"
            className="synthetic-map"
            role="group"
          >
            <p className="map-caption">
              No external tiles loaded. The list remains the source of truth.
            </p>
            {reports.map((report, index) => (
              <button
                aria-pressed={selected === report.publicId}
                className={`map-marker map-marker-${(index % 4) + 1}`}
                key={report.publicId}
                onClick={() => setSelected(report.publicId)}
                type="button"
              >
                {report.title} · {report.publicLabel}
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
