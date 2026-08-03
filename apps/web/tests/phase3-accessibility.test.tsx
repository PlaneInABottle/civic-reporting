import type {
  PublicReport,
  PublicTimelineEvent,
} from '@civic-reporting/contracts';
import { render } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it, vi } from 'vitest';
import { ReportFlow } from '@/components/report-flow/report-flow';
import { BrowseReports } from '@/components/reports/browse-reports';
import { PublicReportDetail } from '@/components/reports/public-report-detail';

const report: PublicReport = {
  publicId: 'HBR-SYNTHETIC-1',
  title: 'Synthetic footpath sample',
  description: 'Approved safe synthetic public description.',
  status: 'received',
  closeReason: null,
  publicLabel: 'Harborfield North (Synthetic)',
  publicLocationPrecision: 'neighborhood',
  publicLatitude: 0,
  publicLongitude: 0,
  acceptedAt: '2026-08-03T00:00:00.000Z',
  updatedAt: '2026-08-03T00:01:00.000Z',
  categoryName: 'Street or footpath',
  supportCount: 1,
};

const timeline: PublicTimelineEvent[] = [
  {
    publicId: report.publicId,
    publicLabel: 'Received by the synthetic pilot fixture',
    newStatus: 'received',
    createdAt: '2026-08-03T00:01:00.000Z',
    actorType: 'integration',
    source: 'integration',
  },
];

async function expectNoAxeViolations(container: HTMLElement) {
  const result = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  });
  expect(result.violations).toEqual([]);
}

describe('Phase 3 citizen-flow accessibility', () => {
  it('keeps the mobile-first location step free of automated violations', async () => {
    const { container } = render(
      <ReportFlow
        adapter={{
          searchLocations: vi.fn(),
          useCurrentLocation: vi.fn(),
          findDuplicates: vi.fn(),
          saveDraft: vi.fn(),
          claimDraft: vi.fn(),
          setRelationship: vi.fn(),
          getSubmissionAttempt: vi.fn(),
          submitReport: vi.fn(),
          navigate: vi.fn(),
        }}
        categories={[
          {
            id: '30000000-0000-4000-8000-000000000001',
            name: 'Street or footpath',
            emergencyExclusion: 'Not for emergencies.',
            publicationPolicyVersion: 1,
          },
        ]}
        initialAuthenticated={false}
        initialDraft={null}
      />,
    );
    await expectNoAxeViolations(container);
  });

  it('keeps public list and detail landmarks free of automated violations', async () => {
    const list = render(<BrowseReports reports={[report]} />);
    await expectNoAxeViolations(list.container);
    list.unmount();

    const detail = render(
      <PublicReportDetail
        initialFollow={{ enabled: false, notificationLevel: 'none' }}
        initialRelationship={{ enabled: false, notificationLevel: 'none' }}
        relationshipAdapter={{ setRelationship: vi.fn(), signIn: vi.fn() }}
        report={report}
        timeline={timeline}
      />,
    );
    await expectNoAxeViolations(detail.container);
  });
});
