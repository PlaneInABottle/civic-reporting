import type { ReactNode } from 'react';

export function StateNotice({
  action,
  children,
  title,
  tone = 'neutral',
}: {
  action?: string;
  children: ReactNode;
  title: string;
  tone?: 'neutral' | 'warning' | 'error';
}) {
  const headingId = `state-${title.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`;
  const toneClass = {
    neutral: 'border-neutral/30 bg-surface',
    warning: 'border-attention/40 bg-warning-bg',
    error: 'border-failure/35 bg-error-bg',
  }[tone];

  return (
    <section
      className={`rounded-control border-l-4 p-4 ${toneClass}`}
      aria-labelledby={headingId}
    >
      <h2 className="m-0 text-base font-extrabold" id={headingId}>
        {title}
      </h2>
      <div className="mt-1 text-sm text-neutral">{children}</div>
      {action ? (
        <button
          className="mt-3 min-h-11 rounded-control border-2 border-ink px-4 py-2 font-bold"
          type="button"
        >
          {action}
        </button>
      ) : null}
    </section>
  );
}
