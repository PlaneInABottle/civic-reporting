'use client';

import type {
  NotificationLevel,
  PublicReport,
  PublicTimelineEvent,
} from '@civic-reporting/contracts';
import { PublicReportDetail } from './public-report-detail';
import { publicRelationshipAdapter } from '@/lib/reporting/browser-adapters';

type PrivateRelationship = {
  enabled: boolean;
  notificationLevel: NotificationLevel;
} | null;

export function PublicReportDetailBoundary({
  report,
  timeline,
  initialSupport,
  initialFollow,
}: {
  report: PublicReport;
  timeline: PublicTimelineEvent[];
  initialSupport: PrivateRelationship;
  initialFollow: PrivateRelationship;
}) {
  return (
    <PublicReportDetail
      initialFollow={initialFollow}
      initialRelationship={initialSupport}
      relationshipAdapter={publicRelationshipAdapter}
      report={report}
      timeline={timeline}
    />
  );
}
