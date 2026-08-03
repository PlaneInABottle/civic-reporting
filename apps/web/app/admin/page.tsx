import { StaffShell } from '@/components/staff-shell';
import { StateNotice } from '@/components/state-notice';
import { requireRoute } from '@/lib/auth/require-route';

const pilotOrganizationId = '10000000-0000-4000-8000-000000000001';

export function AdminPageContent() {
  return (
    <StaffShell eyebrow="Harborfield Civic Works Lab · synthetic staff area">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.12em] text-civic">
            Operator workspace
          </p>
          <h1 className="m-0 text-3xl font-black">Triage queue</h1>
          <p className="mt-2 text-neutral">
            Work first: filter, preview, and act on one scoped report at a time.
          </p>
        </div>
        <p className="m-0 text-sm text-neutral">
          0 results · Last refreshed: not connected
        </p>
      </div>
      <section aria-label="Queue filters" className="mt-8 flex flex-wrap gap-2">
        {['Assigned to me', 'Unassigned', 'Aging'].map((label) => (
          <button
            className="min-h-11 rounded-control border-2 border-ink bg-surface px-4 py-2 font-bold"
            key={label}
            type="button"
          >
            {label}
          </button>
        ))}
      </section>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <StateNotice action="Retry queue" title="Network error" tone="error">
          Queue data could not be loaded. No action was applied.
        </StateNotice>
        <StateNotice action="Refresh queue" title="Stale queue" tone="warning">
          Another operator may have changed this work since your last refresh.
        </StateNotice>
        <StateNotice title="Permission denied">
          This preset cannot open the requested organization scope.
        </StateNotice>
      </div>
      <section
        aria-labelledby="queue-heading"
        className="mt-8 overflow-hidden rounded-panel border border-ink/15 bg-surface"
      >
        <h2
          className="border-b border-ink/10 px-5 py-4 text-lg font-extrabold"
          id="queue-heading"
        >
          Queue results
        </h2>
        <div className="p-8 text-center">
          <p className="m-0 font-bold">No local reports yet</p>
          <p className="mt-2 text-sm text-neutral">
            Reports will appear here after the Phase 2 data boundary exists.
          </p>
        </div>
      </section>
    </StaffShell>
  );
}

export default async function AdminPage() {
  await requireRoute(
    {
      kind: 'organization',
      organizationId: pilotOrganizationId,
      preset: 'operator',
    },
    '/admin',
  );
  return <AdminPageContent />;
}
