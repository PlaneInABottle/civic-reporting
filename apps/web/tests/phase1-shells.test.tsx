import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import HomePage from '@/app/page';
import { ScreenStateGallery } from '@/components/screen-state-gallery';

describe('Phase 1 public foundation', () => {
  it('labels the service as a synthetic non-government pilot and keeps the report CTA visible', () => {
    render(<HomePage />);

    expect(screen.getByText(/synthetic pilot/i)).toBeVisible();
    expect(screen.getByText(/not a real government service/i)).toBeVisible();
    expect(
      screen.getAllByRole('link', { name: /report an issue/i }),
    ).not.toHaveLength(0);
    expect(
      screen.getByRole('link', { name: /skip to main content/i }),
    ).toHaveAttribute('href', '#main-content');
  });

  it('renders concrete recovery-oriented states in the compact disclosure', async () => {
    const user = userEvent.setup();
    render(<ScreenStateGallery />);

    await user.click(screen.getByText('See recovery examples'));

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
    expect(
      screen.getAllByRole('button', {
        name: /retry|use address instead|start a report/i,
      }),
    ).not.toHaveLength(0);
  });
});
