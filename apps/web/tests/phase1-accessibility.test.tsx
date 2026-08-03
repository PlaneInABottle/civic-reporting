import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import HomePage from '@/app/page';
import ReportNewPage from '@/app/report/new/page';
import AdminPage from '@/app/admin/page';
import ModerationPage from '@/app/admin/moderation/page';
import PlatformPage from '@/app/platform/page';

async function expectNoAxeViolations(container: HTMLElement) {
  const result = await axe.run(container, {
    rules: {
      'color-contrast': { enabled: false },
      region: { enabled: false },
    },
  });
  expect(result.violations).toEqual([]);
}

describe('Phase 1 accessibility contract', () => {
  it('keeps the mobile report action in a persistent header', () => {
    render(<HomePage />);
    const headerCallToAction = screen
      .getAllByRole('link', { name: 'Report an issue' })
      .find((link) => link.closest('header'));

    expect(headerCallToAction).toBeDefined();
    expect(headerCallToAction?.closest('header')).toHaveClass(
      'sticky',
      'top-0',
    );
  });

  it.each([
    ['home', <HomePage key="home" />],
    ['location', <ReportNewPage key="location" />],
    ['operator', <AdminPage key="operator" />],
    ['moderation', <ModerationPage key="moderation" />],
    ['platform', <PlatformPage key="platform" />],
  ])('has no automated axe violations on the %s shell', async (_name, page) => {
    const { container } = render(page);
    await expectNoAxeViolations(container);
  });

  it('places the skip link first in the keyboard order', async () => {
    const user = userEvent.setup();
    render(<HomePage />);

    await user.tab();

    expect(
      screen.getByRole('link', { name: 'Skip to main content' }),
    ).toHaveFocus();
  });

  it('keeps the expanded recovery disclosure free of automated violations', async () => {
    const user = userEvent.setup();
    const { container } = render(<HomePage />);

    await user.click(screen.getByText('See recovery examples'));

    await expectNoAxeViolations(container);
  });
});
