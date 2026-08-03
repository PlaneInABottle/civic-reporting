'use client';

import {
  ReportFlow,
  type ReportingCategory,
  type ServerDraft,
} from './report-flow';
import { reportingFlowAdapter } from '@/lib/reporting/browser-adapters';

export function ReportFlowBoundary({
  categories,
  initialAuthenticated,
  initialDraft,
}: {
  categories: ReportingCategory[];
  initialAuthenticated: boolean;
  initialDraft: ServerDraft | null;
}) {
  return (
    <ReportFlow
      adapter={reportingFlowAdapter}
      categories={categories}
      initialAuthenticated={initialAuthenticated}
      initialDraft={initialDraft}
    />
  );
}
