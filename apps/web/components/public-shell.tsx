import Link from 'next/link';
import type { ReactNode } from 'react';

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-control bg-ink px-4 py-3 font-semibold text-white transition-transform focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>
      <aside aria-label="Pilot status">
        <p className="m-0 bg-ink px-4 py-2 text-center text-sm font-semibold text-white">
          Synthetic pilot for Harborfield Pilot District — not a real government
          service.
        </p>
      </aside>
      <header className="sticky top-0 z-40 border-b border-ink/10 bg-canvas/95 backdrop-blur">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            className="text-xl font-extrabold tracking-tight text-ink no-underline"
            href="/"
          >
            Civic Reporting
          </Link>
          <nav aria-label="Primary navigation">
            <ul className="m-0 flex list-none items-center gap-2 p-0 sm:gap-5">
              <li className="hidden sm:block">
                <Link className="font-semibold text-ink" href="/reports">
                  Browse reports
                </Link>
              </li>
              <li>
                <Link
                  className="inline-flex min-h-11 items-center rounded-control bg-safety px-4 py-2 font-extrabold text-ink no-underline shadow-sm hover:bg-safety-hover"
                  href="/report/new"
                >
                  Report an issue
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      {children}
      <footer className="mt-16 border-t border-ink/15 bg-surface">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:grid-cols-2 sm:px-6">
          <div>
            <p className="m-0 font-bold">Harborfield Civic Works Lab</p>
            <p className="mt-1 max-w-prose text-sm text-neutral">
              A fictional organization used only for safe local development and
              staging demonstrations.
            </p>
          </div>
          <nav aria-label="Help and policies" className="sm:text-right">
            <Link className="mr-5 text-link" href="/accessibility">
              Accessibility
            </Link>
            <Link className="mr-5 text-link" href="/privacy">
              Privacy
            </Link>
            <Link className="text-link" href="/contact">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
