'use client';

import type {
  NotificationLevel,
  PublicReport,
  PublicTimelineEvent,
  ReportRelationshipRequest,
} from '@civic-reporting/contracts';
import { actorQualifiedStatus } from '@civic-reporting/domain';
import { useState } from 'react';

export interface RelationshipAdapter {
  setRelationship(request: ReportRelationshipRequest): Promise<{
    enabled: boolean;
    notificationLevel: NotificationLevel;
    supportCount: number;
  }>;
  signIn(nextPath: string): void;
}

export function PublicReportDetail({
  report,
  timeline,
  initialRelationship,
  initialFollow,
  relationshipAdapter,
}: {
  report: PublicReport;
  timeline: PublicTimelineEvent[];
  initialRelationship: {
    enabled: boolean;
    notificationLevel: NotificationLevel;
  } | null;
  initialFollow?: {
    enabled: boolean;
    notificationLevel: NotificationLevel;
  } | null;
  relationshipAdapter: RelationshipAdapter;
}) {
  const [enabled, setEnabled] = useState(initialRelationship?.enabled ?? false);
  const [supportCount, setSupportCount] = useState(report.supportCount);
  const [followEnabled, setFollowEnabled] = useState(
    initialFollow?.enabled ?? false,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function toggleSupport() {
    if (!initialRelationship) {
      relationshipAdapter.signIn(`/reports/${report.publicId}`);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await relationshipAdapter.setRelationship({
        publicId: report.publicId,
        kind: 'support',
        enabled: !enabled,
        notificationLevel: 'none',
        idempotencyKey: crypto.randomUUID(),
        correlationId: crypto.randomUUID(),
      });
      setEnabled(result.enabled);
      setSupportCount(result.supportCount);
      setMessage(
        result.enabled
          ? 'Private support recorded.'
          : 'Private support undone.',
      );
    } catch {
      setMessage('Support could not be changed. Retry without refreshing.');
    } finally {
      setBusy(false);
    }
  }

  async function toggleFollow() {
    if (!initialFollow) {
      relationshipAdapter.signIn(`/reports/${report.publicId}`);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await relationshipAdapter.setRelationship({
        publicId: report.publicId,
        kind: 'follow',
        enabled: !followEnabled,
        notificationLevel: followEnabled ? 'none' : 'status_only',
        idempotencyKey: crypto.randomUUID(),
        correlationId: crypto.randomUUID(),
      });
      setFollowEnabled(result.enabled);
      setMessage(
        result.enabled
          ? 'Private follow enabled for status updates.'
          : 'Private follow disabled.',
      );
    } catch {
      setMessage(
        'Follow preference could not be changed. Retry without refreshing.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div>
        <div className="rounded-control border-l-4 border-info bg-surface p-5">
          <p className="m-0 text-sm font-bold">Current public status</p>
          <p className="mb-0 mt-1 text-xl font-extrabold">
            {actorQualifiedStatus(report.status, report.closeReason)}
          </p>
        </div>
        <p className="mt-8 text-sm font-extrabold text-civic">
          {report.categoryName}
        </p>
        <h1 className="m-0 text-3xl font-black sm:text-4xl">{report.title}</h1>
        <p className="mt-5 whitespace-pre-wrap text-lg">{report.description}</p>
        <section aria-labelledby="timeline-heading" className="mt-10">
          <h2 className="text-2xl font-black" id="timeline-heading">
            Public timeline
          </h2>
          <ol className="timeline-list">
            {timeline.map((event) => (
              <li key={`${event.createdAt}-${event.publicLabel}`}>
                <p className="m-0 font-extrabold">{event.publicLabel}</p>
                <p className="my-1 text-sm text-neutral">
                  {actorLabel(event.actorType)} · {event.source} evidence
                </p>
                <time
                  className="text-sm text-neutral"
                  dateTime={event.createdAt}
                >
                  {new Date(event.createdAt).toLocaleString('en')}
                </time>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <aside className="rounded-panel border border-ink/15 bg-surface p-6">
        <h2 className="m-0 text-xl font-extrabold">Public location</h2>
        <p>{report.publicLabel}</p>
        <p className="text-sm text-neutral">
          Shown at {report.publicLocationPrecision} precision. Exact address and
          coordinates remain private.
        </p>
        <hr className="my-6 border-ink/15" />
        <h2 className="text-xl font-extrabold">Support this report</h2>
        <p className="text-sm text-neutral">
          Support is private and notifications remain off unless you choose to
          follow separately.
        </p>
        <button
          aria-pressed={enabled}
          className="secondary-button w-full"
          disabled={busy}
          onClick={() => void toggleSupport()}
          type="button"
        >
          {enabled ? 'Undo private support' : 'Support this report privately'}
        </button>
        <p className="text-sm font-bold">
          {supportCount} private support{supportCount === 1 ? '' : 's'}
        </p>
        <hr className="my-6 border-ink/15" />
        <h2 className="text-xl font-extrabold">Follow updates</h2>
        <p className="text-sm text-neutral">
          {followEnabled
            ? 'Following is on for public status updates.'
            : 'Following is off. No notifications are sent.'}
        </p>
        <button
          aria-pressed={followEnabled}
          className="secondary-button w-full"
          disabled={busy}
          onClick={() => void toggleFollow()}
          type="button"
        >
          {followEnabled
            ? 'Stop following privately'
            : 'Follow status updates privately'}
        </button>
        {message ? (
          <p aria-live="polite" className="text-sm">
            {message}
          </p>
        ) : null}
        <p className="mt-6 text-sm">
          <a href="/contact">Report a privacy or content concern</a>
        </p>
      </aside>
    </article>
  );
}

function actorLabel(actorType: PublicTimelineEvent['actorType']) {
  if (actorType === 'system') return 'Platform';
  if (actorType === 'integration') return 'Fictional organization integration';
  if (actorType === 'operator' || actorType === 'organization_admin')
    return 'Fictional organization';
  return 'Authorized actor';
}
