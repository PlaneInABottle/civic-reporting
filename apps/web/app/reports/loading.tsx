export default function ReportsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6" id="main-content">
      <section
        aria-busy="true"
        aria-label="Loading public report list"
        className="max-w-3xl"
        role="status"
      >
        <p className="mb-2 font-extrabold text-civic">
          Harborfield synthetic pilot — not a real government service
        </p>
        <h1 className="m-0 text-3xl font-black sm:text-4xl">
          Loading public reports…
        </h1>
        <p className="mt-4 max-w-prose text-neutral">
          Fetching public-safe reports for the list. The accessible list will
          appear before the optional map.
        </p>
        <div aria-hidden="true" className="mt-8 grid gap-4">
          <div className="h-5 w-32 rounded bg-ink/10 motion-safe:animate-pulse" />
          <div className="rounded-panel border border-ink/10 bg-surface p-5">
            <div className="h-4 w-28 rounded bg-civic/15 motion-safe:animate-pulse" />
            <div className="mt-4 h-6 w-3/4 rounded bg-ink/10 motion-safe:animate-pulse" />
            <div className="mt-4 h-4 w-1/2 rounded bg-ink/10 motion-safe:animate-pulse" />
          </div>
        </div>
      </section>
    </main>
  );
}
