import { StaffShell } from '@/components/staff-shell';
import { requireRoute } from '@/lib/auth/require-route';

const pilotOrganizationId = '10000000-0000-4000-8000-000000000001';

export default async function OrganizationAdminPage() {
  await requireRoute(
    {
      kind: 'organization',
      organizationId: pilotOrganizationId,
      preset: 'organization_admin',
    },
    '/admin/organization',
  );
  return (
    <StaffShell eyebrow="Synthetic pilot · administrator boundary">
      <h1 className="m-0 text-3xl font-black">Organization configuration</h1>
      <p className="mt-3 max-w-prose text-neutral">
        The Phase 2 boundary is active. Configuration editing is deferred to
        Phase 5.
      </p>
      <p className="rounded-control border-l-4 border-attention bg-warning-bg p-4">
        Multi-factor authentication is required. This preset does not reveal
        reporter identity, exact location, or moderation media.
      </p>
    </StaffShell>
  );
}
