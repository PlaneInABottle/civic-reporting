import type { Metadata } from 'next';
import { PublicShell } from '@/components/public-shell';
import { ReportFlowBoundary } from '@/components/report-flow/report-flow-boundary';
import type {
  ReportingCategory,
  ServerDraft,
} from '@/components/report-flow/report-flow';
import { createClient } from '@/lib/supabase/server';
import { selectLatestActionableDraft } from '@/lib/reporting/server-data';

export const metadata: Metadata = {
  title: 'Report an issue',
  robots: { index: false, follow: false },
};

export function ReportNewPageContent({
  categories,
  initialAuthenticated,
  initialDraft,
  unavailable = false,
}: {
  categories: ReportingCategory[];
  initialAuthenticated: boolean;
  initialDraft: ServerDraft | null;
  unavailable?: boolean;
}) {
  return (
    <PublicShell>
      <main
        className="mx-auto max-w-[40rem] px-4 py-10 pb-28 sm:px-6"
        id="main-content"
      >
        <p className="mb-6 text-neutral">
          Email verification is required before submission. A local draft stays
          in this browser until verification succeeds.
        </p>
        {unavailable || categories.length === 0 ? (
          <section className="rounded-panel border border-ink/15 bg-surface p-6">
            <h1 className="m-0 text-3xl font-black">
              Reporting is temporarily unavailable
            </h1>
            <p className="text-neutral">
              The local pilot configuration could not be loaded. No report was
              sent. Retry when the local service is available.
            </p>
            <a className="secondary-button inline-flex" href="/report/new">
              Retry reporting
            </a>
          </section>
        ) : (
          <ReportFlowBoundary
            categories={categories}
            initialAuthenticated={initialAuthenticated}
            initialDraft={initialDraft}
          />
        )}
      </main>
    </PublicShell>
  );
}

export default async function ReportNewPage() {
  const supabase = await createClient();
  const [{ data: userData }, { data: configuredCategories, error }] =
    await Promise.all([
      supabase.auth.getUser(),
      supabase
        .from('organization_categories')
        .select(
          'id, version, category:categories!inner(name, emergency_exclusion)',
        )
        .eq('is_active', true)
        .order('id'),
    ]);

  const categories: ReportingCategory[] = (configuredCategories ?? []).map(
    (configured) => ({
      id: configured.id,
      name: configured.category.name,
      emergencyExclusion: configured.category.emergency_exclusion,
      publicationPolicyVersion: configured.version,
    }),
  );

  let initialDraft: ServerDraft | null = null;
  if (userData.user) {
    const { data: drafts } = await supabase
      .from('report_drafts')
      .select(
        'id, version, description, exact_address, public_label, public_location_precision, organization_category_id',
      )
      .gt('expires_at', new Date().toISOString())
      .order('updated_at', { ascending: false })
      .limit(20);
    const draftIds = (drafts ?? []).map((draft) => draft.id);
    const { data: finalizedReports } = draftIds.length
      ? await supabase
          .from('reports')
          .select('source_draft_id, publication_state')
          .in('source_draft_id', draftIds)
          .in('publication_state', ['published', 'rejected'])
      : { data: [] };
    const draft = selectLatestActionableDraft(
      drafts ?? [],
      (finalizedReports ?? []).map((report) => report.source_draft_id),
    );
    if (draft) {
      initialDraft = {
        id: draft.id,
        version: draft.version,
        description: draft.description,
        exactAddress: draft.exact_address,
        publicLabel: draft.public_label,
        publicLocationPrecision: draft.public_location_precision,
        categoryName:
          categories.find(
            (category) => category.id === draft.organization_category_id,
          )?.name ?? 'Configured issue category',
      };
    }
  }

  return (
    <ReportNewPageContent
      categories={categories}
      initialAuthenticated={Boolean(userData.user)}
      initialDraft={initialDraft}
      unavailable={Boolean(error)}
    />
  );
}
