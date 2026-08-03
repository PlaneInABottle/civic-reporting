import Link from 'next/link';
import type { ReactNode } from 'react';

const staffLinks = [
  ['Triage', '/admin'],
  ['Moderation', '/admin/moderation'],
] as const;

export function StaffShell({
  children,
  eyebrow,
}: {
  children: ReactNode;
  eyebrow: string;
}) {
  return (
    <>
      <a
        className="fixed left-4 top-4 z-50 -translate-y-24 rounded-control bg-ink px-4 py-3 font-semibold text-white focus:translate-y-0"
        href="#main-content"
      >
        Skip to main content
      </a>
      <header className="border-b border-ink/15 bg-ink text-white">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div>
            <Link
              className="text-lg font-extrabold text-white no-underline"
              href="/admin"
            >
              Civic Reporting
            </Link>
            <p className="m-0 text-sm text-white/80">{eyebrow}</p>
          </div>
          <nav aria-label="Staff navigation">
            <ul className="m-0 flex list-none gap-1 overflow-x-auto p-0">
              {staffLinks.map(([label, href]) => (
                <li key={href}>
                  <Link
                    className="inline-flex min-h-11 items-center rounded-control px-3 py-2 font-semibold text-white hover:bg-white/10"
                    href={href}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main
        className="mx-auto min-h-[70vh] max-w-[90rem] px-4 py-8 lg:px-6"
        id="main-content"
      >
        {children}
      </main>
    </>
  );
}
