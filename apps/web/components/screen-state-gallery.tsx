import {
  CircleAlert,
  CloudOff,
  LoaderCircle,
  MapPinOff,
  RefreshCw,
  SearchX,
} from 'lucide-react';
import type { ReactNode } from 'react';

type StateCardProps = {
  action: string;
  body: string;
  heading: string;
  icon: ReactNode;
};

function StateCard({ action, body, heading, icon }: StateCardProps) {
  return (
    <article className="rounded-panel border border-ink/15 bg-surface p-6">
      <div aria-hidden="true" className="mb-4 text-civic">
        {icon}
      </div>
      <h3 className="m-0 text-lg font-bold">{heading}</h3>
      <p className="mb-5 mt-2 text-neutral">{body}</p>
      <button
        className="min-h-11 rounded-control border-2 border-ink bg-surface px-4 py-2 font-bold text-ink hover:bg-canvas"
        type="button"
      >
        {action}
      </button>
    </article>
  );
}

export function ScreenStateGallery() {
  return (
    <section aria-labelledby="states-heading">
      <div className="mb-8 max-w-prose">
        <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.12em] text-civic">
          Designed for real conditions
        </p>
        <h2
          className="m-0 text-2xl font-extrabold sm:text-3xl"
          id="states-heading"
        >
          Clear next steps, even when something fails
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StateCard
          action="Retry"
          body="We are checking for public-safe reports near your selected area."
          heading="Loading nearby reports"
          icon={<LoaderCircle className="size-6 motion-safe:animate-spin" />}
        />
        <StateCard
          action="Start a report"
          body="There are no published reports in this area yet."
          heading="No reports found"
          icon={<SearchX className="size-6" />}
        />
        <StateCard
          action="Use address instead"
          body="Your draft is safe. Enter a street and area without using GPS."
          heading="Location permission denied"
          icon={<MapPinOff className="size-6" />}
        />
        <StateCard
          action="Retry connection"
          body="Drafting still works on this device. Submission needs a connection."
          heading="You are offline"
          icon={<CloudOff className="size-6" />}
        />
        <StateCard
          action="Refresh results"
          body="You can keep working, but nearby report information may have changed."
          heading="Results may be stale"
          icon={<RefreshCw className="size-6" />}
        />
        <StateCard
          action="Retry"
          body="No draft was lost. Try again or use the contact support route."
          heading="Something went wrong"
          icon={<CircleAlert className="size-6" />}
        />
      </div>
    </section>
  );
}
