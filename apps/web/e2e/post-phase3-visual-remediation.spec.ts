import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

function capturePageErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test('home keeps recovery examples compact and keyboard accessible', async ({
  page,
}) => {
  const errors = capturePageErrors(page);
  await page.goto('/');

  await expect(page.getByRole('link', { name: 'Report an issue' })).toHaveCount(
    1,
  );
  await expect(
    page.getByRole('link', { name: 'Start a report' }),
  ).toBeVisible();

  const disclosure = page.locator('details');
  const summary = page.locator('summary', {
    hasText: 'See recovery examples',
  });
  await expect(disclosure).not.toHaveAttribute('open');
  await expect(
    page.getByRole('heading', { name: 'Loading nearby reports' }),
  ).toBeHidden();

  await summary.focus();
  await page.keyboard.press('Enter');

  await expect(disclosure).toHaveAttribute('open', '');
  await expect(
    page.getByRole('heading', { name: 'Loading nearby reports' }),
  ).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);
  expect(errors).toEqual([]);
});

test('location continuation appears only after the non-map selection', async ({
  page,
}) => {
  const errors = capturePageErrors(page);
  await page.goto('/report/new');

  await expect(
    page.getByRole('button', { name: 'Use this location' }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Enter address without a map' })
    .click();
  await page.getByLabel('Street, place, or landmark').fill('Fixture Lane');
  await page.getByRole('button', { name: 'Search addresses' }).click();
  await page
    .getByRole('button', { name: 'Select Fixture Lane 77 (Synthetic)' })
    .click();

  await expect(
    page.getByRole('button', { name: 'Use this location' }),
  ).toBeEnabled();
  expect(errors).toEqual([]);
});

test('resolved list and detail preserve truthful public hierarchy', async ({
  page,
}) => {
  const errors = capturePageErrors(page);
  await page.goto('/reports');

  await expect(
    page.getByRole('heading', { name: 'Browse public reports' }),
  ).toBeVisible();
  const reportLink = page.getByRole('link', {
    name: 'Synthetic footpath sample',
  });
  await expect(reportLink).toBeVisible();
  await reportLink.click();

  await expect(page.getByText('Current public status')).toBeVisible();
  await expect(
    page.getByText('Acknowledged by the fictional organization'),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Public timeline' }),
  ).toBeVisible();
  await expect(page.getByText('Platform · system evidence')).toBeVisible();

  const publicHtml = await page.content();
  expect(publicHtml).not.toContain('Private Fixture Lane 77');
  expect(publicHtml).not.toContain('service_role');
  expect(publicHtml).not.toContain('storage_path');
  expect(errors).toEqual([]);
});
