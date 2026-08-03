'use client';

export default function ReportsError({ reset }: { reset(): void }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6" id="main-content">
      <section className="rounded-panel border border-error bg-surface p-6">
        <h1 className="m-0 text-3xl font-black">Public reports did not load</h1>
        <p className="text-neutral">
          No private data is used as a fallback. Retry the public-safe request.
        </p>
        <button className="secondary-button" onClick={reset} type="button">
          Retry public reports
        </button>
      </section>
    </main>
  );
}
