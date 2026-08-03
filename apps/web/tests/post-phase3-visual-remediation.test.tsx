import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import HomePage from '@/app/page';
import ReportDetailLoading from '@/app/reports/[publicId]/loading';
import ReportsLoading from '@/app/reports/loading';
import { ReportFlow } from '@/components/report-flow/report-flow';

const syntheticLocation = {
  id: 'fixture-lane-77',
  label: 'Fixture Lane 77 (Synthetic)',
  privateAddress: 'Private Fixture Lane 77',
  publicLabel: 'Harborfield North (Synthetic)',
  exactLocation: { longitude: 0.0042, latitude: 0.0031 },
  publicLocation: { longitude: 0, latitude: 0 },
  publicLocationPrecision: 'neighborhood' as const,
  source: 'synthetic_fixture' as const,
};

describe('post-Phase-3 visual remediation', () => {
  it('keeps one persistent Report an issue CTA and gives the hero action distinct copy', () => {
    render(<HomePage />);

    expect(
      screen.getAllByRole('link', { name: 'Report an issue' }),
    ).toHaveLength(1);
    expect(
      screen.getByRole('link', { name: 'Start a report' }),
    ).toHaveAttribute('href', '/report/new');
  });

  it('keeps every recovery example in a compact disclosure', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    const summary = screen.getByText('See recovery examples');
    const disclosure = summary.closest('details');
    expect(disclosure).not.toHaveAttribute('open');
    expect(
      screen.getByRole('heading', { name: 'Loading nearby reports' }),
    ).not.toBeVisible();

    await user.click(summary);

    expect(disclosure).toHaveAttribute('open');
    for (const label of [
      'Loading nearby reports',
      'No reports found',
      'Location permission denied',
      'You are offline',
      'Results may be stale',
      'Something went wrong',
    ]) {
      expect(screen.getByRole('heading', { name: label })).toBeVisible();
    }
  });

  it('shows continuation only after a location has been selected', async () => {
    const user = userEvent.setup();
    render(
      <ReportFlow
        adapter={{
          searchLocations: vi.fn(),
          useCurrentLocation: vi.fn().mockResolvedValue(syntheticLocation),
          findDuplicates: vi.fn().mockResolvedValue([]),
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

    expect(
      screen.queryByRole('button', { name: 'Use this location' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Use my location' }));

    expect(
      await screen.findByRole('button', { name: 'Use this location' }),
    ).toBeEnabled();
  });

  it('explains list and detail loading with route-aware busy regions', () => {
    const list = render(<ReportsLoading />);
    expect(
      screen.getByRole('status', { name: 'Loading public report list' }),
    ).toHaveTextContent('Fetching public-safe reports for the list');
    expect(screen.getByText(/not a real government service/i)).toBeVisible();
    expect(list.container.querySelector('[aria-busy="true"]')).not.toBeNull();
    list.unmount();

    const detail = render(<ReportDetailLoading />);
    expect(
      screen.getByRole('status', { name: 'Loading public report detail' }),
    ).toHaveTextContent('Loading the public report and its status timeline');
    expect(screen.getByText(/not a real government service/i)).toBeVisible();
    expect(detail.container.querySelector('[aria-busy="true"]')).not.toBeNull();
  });
});
