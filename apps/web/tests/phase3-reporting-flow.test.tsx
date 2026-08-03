import type {
  DuplicateCandidate,
  LocationSearchResult,
  PublicReport,
  PublicTimelineEvent,
  ReportSubmissionResult,
} from '@civic-reporting/contracts';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BrowseReports } from '@/components/reports/browse-reports';
import { PublicReportDetail } from '@/components/reports/public-report-detail';
import {
  ReportFlow,
  type ReportingFlowAdapter,
} from '@/components/report-flow/report-flow';

const location: LocationSearchResult = {
  id: 'fixture-lane-77',
  label: 'Fixture Lane 77 (Synthetic)',
  privateAddress: 'Private Fixture Lane 77',
  publicLabel: 'Harborfield North (Synthetic)',
  exactLocation: { longitude: 0.0042, latitude: 0.0031 },
  publicLocation: { longitude: 0, latitude: 0 },
  publicLocationPrecision: 'neighborhood',
  source: 'synthetic_fixture',
};

const candidate: DuplicateCandidate = {
  publicId: 'HBR-SYNTHETIC-1',
  title: 'Synthetic footpath sample',
  publicLabel: 'Harborfield North (Synthetic)',
  categoryName: 'Street or footpath',
  approximateDistanceMeters: 240,
  status: 'received',
  acceptedAt: '2026-08-03T00:00:00.000Z',
  whySuggested: 'Nearby public report in the same category.',
};

const categories = [
  {
    id: '30000000-0000-4000-8000-000000000001',
    name: 'Street or footpath',
    emergencyExclusion:
      'Not for emergencies, active hazards, or immediate danger.',
    publicationPolicyVersion: 1,
  },
];

function createAdapter(overrides: Partial<ReportingFlowAdapter> = {}) {
  return {
    searchLocations: vi.fn().mockResolvedValue([location]),
    useCurrentLocation: vi.fn().mockResolvedValue(location),
    findDuplicates: vi.fn().mockResolvedValue([candidate]),
    saveDraft: vi.fn().mockResolvedValue(undefined),
    claimDraft: vi.fn().mockResolvedValue({ ok: true }),
    setRelationship: vi.fn().mockResolvedValue({
      enabled: true,
      notificationLevel: 'none',
      supportCount: 2,
    }),
    getSubmissionAttempt: vi.fn().mockResolvedValue({
      idempotencyKey: 'a1000000-0000-4000-8000-000000000001',
      correlationId: 'a1000000-0000-4000-8000-000000000002',
    }),
    submitReport: vi.fn(),
    navigate: vi.fn(),
    ...overrides,
  } satisfies ReportingFlowAdapter;
}

async function reachDuplicateStep(
  adapter: ReportingFlowAdapter,
  initialAuthenticated = false,
) {
  const user = userEvent.setup();
  render(
    <ReportFlow
      adapter={adapter}
      categories={categories}
      initialAuthenticated={initialAuthenticated}
      initialDraft={null}
    />,
  );
  await user.click(
    screen.getByRole('button', { name: 'Enter address without a map' }),
  );
  await user.type(
    screen.getByLabelText('Street, place, or landmark'),
    'Fixture',
  );
  await user.click(screen.getByRole('button', { name: 'Search addresses' }));
  await user.click(
    await screen.findByRole('button', {
      name: 'Select Fixture Lane 77 (Synthetic)',
    }),
  );
  await user.click(screen.getByRole('button', { name: 'Use this location' }));
  return user;
}

describe('Phase 3 reporting journey', () => {
  it('completes the non-map path with keyboard-operable validation and saved recovery', async () => {
    const adapter = createAdapter();
    const user = await reachDuplicateStep(adapter);
    expect(screen.getByText(/Harborfield North \(Synthetic\)/)).toBeVisible();
    expect(
      screen.queryByText('Private Fixture Lane 77'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'None of these' }));
    await user.selectOptions(
      screen.getByLabelText('Issue category'),
      categories[0]!.id,
    );
    await user.click(
      screen.getByRole('button', { name: 'Save details and verify email' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Describe the issue in at least 10 characters.',
    );
    expect(
      screen.getByLabelText(
        'What happened, and what should the responsible team know?',
      ),
    ).toHaveFocus();

    await user.type(
      screen.getByLabelText(
        'What happened, and what should the responsible team know?',
      ),
      'A safe synthetic loose paving report entered without a map.',
    );
    await user.click(
      screen.getByRole('button', { name: 'Save details and verify email' }),
    );
    expect(adapter.saveDraft).toHaveBeenCalled();
    expect(adapter.navigate).toHaveBeenCalledWith(
      '/sign-in?next=%2Freport%2Fnew%3Fverified%3D1',
    );
  }, 15_000);

  it('turns a duplicate choice into one private support intent', async () => {
    const adapter = createAdapter();
    const user = await reachDuplicateStep(adapter);
    const suggestion = screen.getByRole('article', {
      name: 'Synthetic footpath sample',
    });
    await user.click(
      within(suggestion).getByRole('button', {
        name: 'This is the same issue',
      }),
    );
    expect(adapter.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({
        draft: expect.objectContaining({
          intentKind: 'support_existing',
          duplicateTargetPublicId: 'HBR-SYNTHETIC-1',
          notificationLevel: 'none',
        }),
      }),
    );
    expect(adapter.navigate).toHaveBeenCalledWith(
      '/sign-in?next=%2Freports%2FHBR-SYNTHETIC-1%3Fsupported%3D1',
    );
  });

  it('does not retain a recovery draft after authenticated duplicate support', async () => {
    const adapter = createAdapter();
    const user = await reachDuplicateStep(adapter, true);
    await user.click(
      within(
        screen.getByRole('article', { name: 'Synthetic footpath sample' }),
      ).getByRole('button', { name: 'This is the same issue' }),
    );

    expect(adapter.saveDraft).not.toHaveBeenCalled();
    expect(adapter.setRelationship).toHaveBeenCalledWith(
      expect.objectContaining({
        publicId: 'HBR-SYNTHETIC-1',
        kind: 'support',
        enabled: true,
      }),
    );
    expect(screen.getByText('Private support recorded')).toBeVisible();
  });

  it('retries a provider outage with the same submission identifiers', async () => {
    const unavailable: ReportSubmissionResult = {
      reportId: 'a1000000-0000-4000-8000-000000000004',
      publicId: 'HBR-ABC123DEF456',
      reportStatus: 'pending_moderation',
      publicationState: 'pending',
      moderation: { state: 'temporarily_unavailable', retryable: true },
    };
    const published: ReportSubmissionResult = {
      ...unavailable,
      reportStatus: 'submitted',
      publicationState: 'published',
      moderation: { state: 'published', retryable: false },
    };
    const adapter = createAdapter({
      submitReport: vi
        .fn()
        .mockResolvedValueOnce(unavailable)
        .mockResolvedValueOnce(published),
    });
    const user = userEvent.setup();
    render(
      <ReportFlow
        adapter={adapter}
        categories={categories}
        initialAuthenticated
        initialDraft={{
          id: 'a1000000-0000-4000-8000-000000000003',
          version: 1,
          description: 'Synthetic provider retry fixture for local recovery.',
          exactAddress: 'Private Fixture Lane 77',
          publicLabel: 'Harborfield North (Synthetic)',
          categoryName: 'Street or footpath',
          publicLocationPrecision: 'neighborhood',
        }}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Submit report' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'safety check is temporarily unavailable',
    );
    await user.click(
      screen.getByRole('button', { name: 'Retry publication check' }),
    );
    expect(await screen.findByText('Report published safely')).toBeVisible();
    expect(adapter.submitReport).toHaveBeenCalledTimes(2);
    expect(adapter.submitReport).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        idempotencyKey: 'a1000000-0000-4000-8000-000000000001',
        correlationId: 'a1000000-0000-4000-8000-000000000002',
      }),
    );
  });
});

const publicReport: PublicReport = {
  publicId: 'HBR-SYNTHETIC-1',
  title: 'Synthetic footpath sample',
  description: 'Approved safe synthetic public description.',
  status: 'submitted',
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
    publicId: publicReport.publicId,
    publicLabel: 'Accepted by the platform',
    newStatus: 'submitted',
    createdAt: '2026-08-03T00:01:00.000Z',
    actorType: 'system',
    source: 'system',
  },
];

describe('Phase 3 public browse and detail', () => {
  it('renders the low-bandwidth list before the optional synchronized map', async () => {
    const user = userEvent.setup();
    render(<BrowseReports reports={[publicReport]} />);
    expect(screen.getByRole('list', { name: 'Public reports' })).toBeVisible();
    expect(
      screen.queryByRole('region', { name: 'Synthetic report map' }),
    ).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Show optional map' }));
    expect(
      screen.getByRole('region', { name: 'Synthetic report map' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: /Synthetic footpath sample/ }),
    ).toBeVisible();
  });

  it('renders approved text and a truthful actor-qualified timeline only', () => {
    render(
      <PublicReportDetail
        initialRelationship={{ enabled: false, notificationLevel: 'none' }}
        report={publicReport}
        relationshipAdapter={{
          setRelationship: vi.fn(),
          signIn: vi.fn(),
        }}
        timeline={timeline}
      />,
    );
    expect(
      screen.getByRole('heading', { name: publicReport.title }),
    ).toBeVisible();
    expect(screen.getByText('Platform · system evidence')).toBeVisible();
    expect(screen.getAllByText('Accepted by the platform')).toHaveLength(2);
    expect(screen.queryByText(/reporter/i)).toBeNull();
    expect(screen.queryByText(/Private Fixture Lane/i)).toBeNull();
  });

  it('keeps follow preferences private and explicitly opt-in', async () => {
    const user = userEvent.setup();
    const setRelationship = vi.fn().mockResolvedValue({
      enabled: true,
      notificationLevel: 'status_only',
      supportCount: 1,
    });
    render(
      <PublicReportDetail
        initialFollow={{ enabled: false, notificationLevel: 'none' }}
        initialRelationship={{ enabled: false, notificationLevel: 'none' }}
        report={publicReport}
        relationshipAdapter={{ setRelationship, signIn: vi.fn() }}
        timeline={timeline}
      />,
    );

    expect(screen.getByText(/following is off/i)).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'Follow status updates privately' }),
    );
    expect(setRelationship).toHaveBeenCalledWith(
      expect.objectContaining({
        publicId: publicReport.publicId,
        kind: 'follow',
        enabled: true,
        notificationLevel: 'status_only',
      }),
    );
    expect(await screen.findByText(/private follow enabled/i)).toBeVisible();
  });
});
