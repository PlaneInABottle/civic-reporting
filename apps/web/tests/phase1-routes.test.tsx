import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ReportsPageContent } from '@/app/reports/page';
import { ReportNewPageContent } from '@/app/report/new/page';
import { AdminPageContent as AdminPage } from '@/app/admin/page';
import { ModerationPageContent as ModerationPage } from '@/app/admin/moderation/page';
import { PlatformPageContent as PlatformPage } from '@/app/platform/page';
import { metadata as adminMetadata } from '@/app/admin/layout';
import { metadata as platformMetadata } from '@/app/platform/layout';

describe('Phase 1 representative route shells', () => {
  it('makes the public reports view list-first and explicit about stale recovery', () => {
    render(<ReportsPageContent loadError reports={[]} />);

    expect(
      screen.getByRole('heading', { name: 'Browse public reports' }),
    ).toBeVisible();
    expect(screen.getByText(/list is available before the map/i)).toBeVisible();
    expect(screen.getByText(/last refreshed/i)).toBeVisible();
    expect(screen.getByRole('button', { name: /retry/i })).toBeVisible();
  });

  it('offers location and non-map paths without requesting permission on load', () => {
    render(
      <ReportNewPageContent
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
      screen.getByRole('heading', { name: 'Where is the issue?' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Use my location' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Enter address without a map' }),
    ).toBeVisible();
    expect(screen.getByText(/email verification is required/i)).toBeVisible();
  });

  it('shows work-focused staff and metadata-first moderation shells', () => {
    render(<AdminPage />);
    expect(screen.getByRole('heading', { name: 'Triage queue' })).toBeVisible();
    expect(screen.getByText(/assigned to me/i)).toBeVisible();
    expect(screen.getByText(/permission denied/i)).toBeVisible();

    render(<ModerationPage />);
    expect(
      screen.getByRole('heading', { name: 'Moderation queue' }),
    ).toBeVisible();
    expect(
      screen.getByText(/original media is not shown in this queue/i),
    ).toBeVisible();
    expect(screen.getByText(/public media is disabled/i)).toBeVisible();
  });

  it('keeps the platform backstop redacted and all privileged shells noindex', () => {
    render(<PlatformPage />);

    expect(
      screen.getByRole('heading', { name: 'Platform health' }),
    ).toBeVisible();
    expect(screen.getByText(/redacted by default/i)).toBeVisible();
    expect(screen.getByText(/launch blockers/i)).toBeVisible();
    expect(adminMetadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
    expect(platformMetadata.robots).toMatchObject({
      index: false,
      follow: false,
    });
  });
});
