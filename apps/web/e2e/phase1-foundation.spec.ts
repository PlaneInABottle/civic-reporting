import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Locator } from '@playwright/test';

const phase1Routes = [
  '/',
  '/accessibility',
  '/admin',
  '/admin/moderation',
  '/contact',
  '/platform',
  '/privacy',
  '/report/new',
  '/reports',
] as const;

function contrastRatio(first: string, second: string) {
  const luminance = (color: string) => {
    const channels = color
      .match(/[\d.]+/g)
      ?.slice(0, 3)
      .map(Number);
    if (!channels || channels.length !== 3) {
      throw new Error(`Unsupported computed color: ${color}`);
    }
    const [red = 0, green = 0, blue = 0] = channels.map((channel) => {
      const normalized = channel / 255;
      return normalized <= 0.04045
        ? normalized / 12.92
        : ((normalized + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };

  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

async function focusEvidence(locator: Locator) {
  return locator.evaluate((element) => {
    const probe = document.createElement('span');
    document.body.append(probe);
    const tokenColor = (name: string) => {
      probe.style.color = `var(${name})`;
      return getComputedStyle(probe).color;
    };
    const bounds = element.getBoundingClientRect();
    const sampleX = Math.max(0, bounds.left - 2);
    const sampleY = bounds.top + bounds.height / 2;
    const backdrop =
      document
        .elementsFromPoint(sampleX, sampleY)
        .map((candidate) => getComputedStyle(candidate).backgroundColor)
        .find(
          (color) => color !== 'transparent' && color !== 'rgba(0, 0, 0, 0)',
        ) ?? tokenColor('--color-canvas');
    const style = getComputedStyle(element);
    const result = {
      backdrop,
      innerRing: style.outlineColor,
      outerRing: style.boxShadow,
      ink: tokenColor('--color-ink'),
      surface: tokenColor('--color-surface'),
    };
    probe.remove();
    return result;
  });
}

function expectContrastingFocusRing(
  evidence: Awaited<ReturnType<typeof focusEvidence>>,
) {
  expect(evidence.innerRing).toBe(evidence.surface);
  expect(evidence.outerRing).toContain(evidence.ink);
  expect(
    Math.max(
      contrastRatio(evidence.innerRing, evidence.backdrop),
      contrastRatio(evidence.ink, evidence.backdrop),
    ),
  ).toBeGreaterThanOrEqual(3);
}

test('mobile public foundation keeps the safe reporting paths available', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: () => {
          throw new Error('Geolocation must not be requested on load');
        },
      },
    });
  });

  await page.goto('/');
  await expect(page.getByText(/not a real government service/i)).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Tell the right team what needs attention.',
    }),
  ).toBeVisible();

  const headerCta = page.locator('header').getByRole('link', {
    name: 'Report an issue',
  });
  await expect(headerCta).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await expect(headerCta).toBeVisible();

  const homeA11y = await new AxeBuilder({ page }).analyze();
  expect(homeA11y.violations).toEqual([]);

  await headerCta.click();
  await expect(
    page.getByRole('heading', { name: 'Where is the issue?' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Enter address without a map' }),
  ).toBeVisible();
  await expect(page.getByText(/email verification is required/i)).toBeVisible();
});

test('desktop staff and platform shells expose only honest Phase 1 states', async ({
  page,
}) => {
  await page.goto('/admin');
  await expect(
    page.getByRole('heading', { name: 'Triage queue' }),
  ).toBeVisible();
  await expect(page.getByText('Permission denied')).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/,
  );

  await page.goto('/admin/moderation');
  await expect(
    page.getByText(/original media is not shown in this queue/i),
  ).toBeVisible();
  await expect(page.getByText(/public media is disabled/i)).toBeVisible();

  await page.goto('/platform');
  await expect(
    page.getByRole('heading', { name: 'Platform health' }),
  ).toBeVisible();
  await expect(page.getByText(/redacted by default/i)).toBeVisible();
  await expect(page.getByText(/launch blockers/i)).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
    'content',
    /noindex/,
  );

  const platformA11y = await new AxeBuilder({ page }).analyze();
  expect(platformA11y.violations).toEqual([]);
});

for (const route of phase1Routes) {
  test(`full axe scan passes on ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}

test('actual light and dark backdrops use token-driven two-color focus rings', async ({
  page,
}) => {
  await page.goto('/admin');
  await page.keyboard.press('Tab');

  const focused = page.locator(':focus');
  await expect(focused).toHaveText('Skip to main content');
  expectContrastingFocusRing(await focusEvidence(focused));

  await page.keyboard.press('Tab');
  const brand = page.locator(':focus');
  await expect(brand).toHaveText('Civic Reporting');
  expectContrastingFocusRing(await focusEvidence(brand));

  await page.goto('/platform');
  await page.keyboard.press('Tab');
  const platformSkip = page.locator(':focus');
  await expect(platformSkip).toHaveText('Skip to main content');
  expectContrastingFocusRing(await focusEvidence(platformSkip));
});
