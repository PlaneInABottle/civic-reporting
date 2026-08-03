import {
  mapPublicReportRows,
  mapPublicTimelineRows,
} from '@civic-reporting/data-access';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/public-shell';
import { PublicReportDetailBoundary } from '@/components/reports/public-report-detail-boundary';
import { createClient } from '@/lib/supabase/server';

type RouteParams = Promise<{ publicId: string }>;

export async function generateMetadata({
  params,
}: {
  params: RouteParams;
}): Promise<Metadata> {
  const { publicId } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from('public_reports')
    .select('title, public_label')
    .eq('public_id', publicId)
    .maybeSingle();
  if (!data)
    return { title: 'Public report not found', robots: { index: false } };
  return {
    title: data.title ?? 'Public report',
    description: `Public-safe civic report near ${data.public_label} in the fictional Harborfield pilot.`,
    openGraph: {
      title: data.title ?? 'Public report',
      description: `Public-safe report near ${data.public_label}. Synthetic pilot only.`,
      type: 'article',
    },
  };
}

export default async function PublicReportPage({
  params,
}: {
  params: RouteParams;
}) {
  const { publicId } = await params;
  const supabase = await createClient();
  const [{ data: reportRow, error }, { data: eventRows }, { data: userData }] =
    await Promise.all([
      supabase
        .from('public_reports')
        .select(
          'public_id, title, description, status, close_reason, public_label, public_location_precision, public_latitude, public_longitude, accepted_at, updated_at, category_name, support_count',
        )
        .eq('public_id', publicId)
        .maybeSingle(),
      supabase
        .from('public_report_events')
        .select(
          'public_id, public_label, new_status, created_at, actor_type, source',
        )
        .eq('public_id', publicId)
        .order('created_at'),
      supabase.auth.getUser(),
    ]);

  if (error || !reportRow) notFound();
  const report = mapPublicReportRows([reportRow])[0]!;
  const timeline = mapPublicTimelineRows(eventRows ?? []);

  let initialSupport = null;
  let initialFollow = null;
  if (userData.user) {
    const [{ data: support }, { data: follow }] = await Promise.all([
      supabase.rpc('get_my_report_relationship', {
        target_public_id: publicId,
        requested_kind: 'support',
      }),
      supabase.rpc('get_my_report_relationship', {
        target_public_id: publicId,
        requested_kind: 'follow',
      }),
    ]);
    initialSupport = support?.[0]
      ? {
          enabled: support[0].enabled,
          notificationLevel: support[0].notification_level,
        }
      : { enabled: false, notificationLevel: 'none' as const };
    initialFollow = follow?.[0]
      ? {
          enabled: follow[0].enabled,
          notificationLevel: follow[0].notification_level,
        }
      : { enabled: false, notificationLevel: 'none' as const };
  }

  return (
    <PublicShell>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6" id="main-content">
        <p className="mb-6 text-sm font-extrabold text-civic">
          Public-safe report · {report.publicId}
        </p>
        <PublicReportDetailBoundary
          initialFollow={initialFollow}
          initialSupport={initialSupport}
          report={report}
          timeline={timeline}
        />
      </main>
    </PublicShell>
  );
}
