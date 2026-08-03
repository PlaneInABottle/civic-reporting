import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AccessibilityPage from '@/app/accessibility/page';
import PrivacyPage from '@/app/privacy/page';
import ContactPage from '@/app/contact/page';

describe('Phase 1 public information routes', () => {
  it('documents the complete non-map accessibility path and support channel', () => {
    render(<AccessibilityPage />);

    expect(
      screen.getByRole('heading', { name: 'Accessibility' }),
    ).toBeVisible();
    expect(screen.getByText(/complete non-map reporting path/i)).toBeVisible();
    expect(screen.getByText(/keyboard/i)).toBeVisible();
  });

  it('states exact/public location separation without claiming legal approval', () => {
    render(<PrivacyPage />);

    expect(screen.getByRole('heading', { name: 'Privacy' })).toBeVisible();
    expect(screen.getByText(/exact location is restricted/i)).toBeVisible();
    expect(screen.getByText(/not a legally approved policy/i)).toBeVisible();
  });

  it('provides non-emergency, verification, and privacy support guidance', () => {
    render(<ContactPage />);

    expect(screen.getByRole('heading', { name: 'Contact' })).toBeVisible();
    expect(screen.getByText(/not monitored for emergencies/i)).toBeVisible();
    expect(screen.getByText(/verification help/i)).toBeVisible();
    expect(screen.getByText(/privacy or content concern/i)).toBeVisible();
  });
});
