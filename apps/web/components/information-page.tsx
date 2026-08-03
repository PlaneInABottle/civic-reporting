import { PublicShell } from '@/components/public-shell';
import type { ReactNode } from 'react';

export function InformationPage({
  children,
  eyebrow,
  summary,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  summary: string;
  title: string;
}) {
  return (
    <PublicShell>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6" id="main-content">
        <p className="mb-2 font-extrabold text-civic">{eyebrow}</p>
        <h1 className="m-0 text-3xl font-black sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-prose text-lg text-neutral">{summary}</p>
        <div className="mt-10 grid gap-8">{children}</div>
      </main>
    </PublicShell>
  );
}
