export default function ReportsLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6" id="main-content">
      <p className="font-extrabold text-civic">Loading public reports…</p>
      <div
        aria-hidden="true"
        className="mt-6 min-h-64 animate-pulse rounded-panel bg-surface"
      />
    </main>
  );
}
