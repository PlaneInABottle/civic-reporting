export default function ReportDetailLoading() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6" id="main-content">
      <section
        aria-busy="true"
        aria-label="Loading public report detail"
        role="status"
      >
        <p className="mb-2 font-extrabold text-civic">
          Public-safe report · Synthetic pilot, not a real government service
        </p>
        <h1 className="m-0 text-3xl font-black sm:text-4xl">
          Loading public report…
        </h1>
        <p className="mt-4 max-w-prose text-neutral">
          Loading the public report and its status timeline. Exact location,
          reporter identity, and private notes remain hidden.
        </p>
        <div
          aria-hidden="true"
          className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]"
        >
          <div className="grid gap-6">
            <div className="rounded-control border-l-4 border-info bg-surface p-5">
              <div className="h-4 w-36 rounded bg-ink/10 motion-safe:animate-pulse" />
              <div className="mt-3 h-6 w-3/4 rounded bg-ink/10 motion-safe:animate-pulse" />
            </div>
            <div className="h-9 w-2/3 rounded bg-ink/10 motion-safe:animate-pulse" />
            <div className="h-24 rounded bg-ink/10 motion-safe:animate-pulse" />
          </div>
          <div className="min-h-64 rounded-panel border border-ink/10 bg-surface p-6">
            <div className="h-6 w-36 rounded bg-ink/10 motion-safe:animate-pulse" />
            <div className="mt-4 h-4 w-full rounded bg-ink/10 motion-safe:animate-pulse" />
            <div className="mt-2 h-4 w-4/5 rounded bg-ink/10 motion-safe:animate-pulse" />
          </div>
        </div>
      </section>
    </main>
  );
}
