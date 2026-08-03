import { StaffShell } from '@/components/staff-shell';
import { StateNotice } from '@/components/state-notice';
import { requireRoute } from '@/lib/auth/require-route';

const pilotOrganizationId = '10000000-0000-4000-8000-000000000001';

export function ModerationPageContent() {
  return (
    <StaffShell eyebrow="Restricted reviewer workspace · synthetic pilot">
      <p className="mb-2 text-sm font-extrabold uppercase tracking-[0.12em] text-review">
        Moderator preset
      </p>
      <h1 className="m-0 text-3xl font-black">Moderation queue</h1>
      <p className="mt-3 max-w-prose text-neutral">
        Original media is not shown in this queue. Review begins with safe
        metadata and a neutral placeholder.
      </p>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_22rem]">
        <section className="rounded-panel border border-ink/15 bg-surface p-6">
          <h2 className="m-0 text-xl font-extrabold">
            No items awaiting review
          </h2>
          <p className="text-neutral">
            Public media is disabled. A provider, legal process, trained
            staffing, and launch approval are still required.
          </p>
          <button
            className="min-h-11 rounded-control border-2 border-ink px-4 py-2 font-bold"
            type="button"
          >
            Refresh queue
          </button>
        </section>
        <StateNotice title="Reveal is never automatic" tone="warning">
          Future staged access requires the moderator preset, a reason, a case
          scope, an expiry, and an audit event.
        </StateNotice>
      </div>
    </StaffShell>
  );
}

export default async function ModerationPage() {
  await requireRoute(
    {
      kind: 'organization',
      organizationId: pilotOrganizationId,
      preset: 'moderator',
    },
    '/admin/moderation',
  );
  return <ModerationPageContent />;
}
