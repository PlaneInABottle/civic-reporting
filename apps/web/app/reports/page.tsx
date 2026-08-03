import type { PublicReport } from '@civic-reporting/contracts';
import { mapPublicReportRows } from '@civic-reporting/data-access';
import type { Metadata } from 'next';
import { PublicShell } from '@/components/public-shell';
import { BrowseReports } from '@/components/reports/browse-reports';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Browse public reports',
  description:
    'Public-safe issue reports in the fictional Harborfield Pilot District.',
};

export function ReportsPageContent({
  reports,
  loadError = false,
}: {
  reports: PublicReport[];
  loadError?: boolean;
}) {
  return (
    <PublicShell>
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6" id="main-content">
        <div className="flex flex-col gap-6 border-b border-ink/15 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 font-extrabold text-civic">
              Harborfield synthetic pilot
            </p>
            <h1 className="m-0 text-3xl font-black sm:text-4xl">
              Browse public reports
            </h1>
            <p className="mt-3 text-neutral">
              The accessible list is available before the map. The optional
              schematic remains synchronized, while the list is the source of
              truth on weak connections.
            </p>
          </div>
          <p className="m-0 text-sm text-neutral">
            Last refreshed: this server response
          </p>
        </div>
        <div className="py-8">
          <BrowseReports loadError={loadError} reports={reports} />
        </div>
      </main>
    </PublicShell>
  );
}

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('public_reports')
    .select(
      'public_id, title, description, status, close_reason, public_label, public_location_precision, public_latitude, public_longitude, accepted_at, updated_at, category_name, support_count',
    )
    .order('accepted_at', { ascending: false })
    .limit(100);

  return (
    <ReportsPageContent
      loadError={Boolean(error)}
      reports={error ? [] : mapPublicReportRows(data ?? [])}
    />
  );
}
