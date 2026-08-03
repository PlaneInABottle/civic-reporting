import {
  expect,
  test,
  type APIRequestContext,
  type Page,
} from '@playwright/test';

const mailpitUrl = 'http://127.0.0.1:54324';

async function readOtp(request: APIRequestContext, email: string) {
  let messageId: string | undefined;
  await expect
    .poll(async () => {
      const response = await request.get(
        `${mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
      );
      const result = (await response.json()) as {
        messages: Array<{ ID: string }>;
      };
      messageId = result.messages[0]?.ID;
      return messageId;
    })
    .toBeTruthy();
  const message = (await (
    await request.get(`${mailpitUrl}/api/v1/message/${messageId}`)
  ).json()) as { HTML: string; Text: string };
  const token = `${message.Text} ${message.HTML}`.match(/\b\d{6}\b/)?.[0];
  expect(token).toMatch(/^\d{6}$/);
  return token!;
}

async function completeNonMapLocation(page: Page) {
  await page
    .getByRole('button', { name: 'Enter address without a map' })
    .click();
  await page.getByLabel('Street, place, or landmark').fill('Fixture Lane');
  await page.getByRole('button', { name: 'Search addresses' }).click();
  await page
    .getByRole('button', { name: 'Select Fixture Lane 77 (Synthetic)' })
    .click();
  await page.getByRole('button', { name: 'Use this location' }).click();
  await expect(
    page.getByRole('heading', { name: 'Is it already reported?' }),
  ).toBeVisible();
}

test('text-first report survives OTP, provider outage, refresh, and retry once', async ({
  page,
  request,
}, testInfo) => {
  const browserErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') browserErrors.push(message.text());
  });
  page.on('pageerror', (error) => browserErrors.push(error.message));

  const suffix = `${testInfo.project.name}-${Date.now()}`;
  const email = `phase3.${suffix}@example.test`;
  const description = `Synthetic provider retry fixture for ${suffix}.`;

  await page.goto('/report/new');
  await completeNonMapLocation(page);
  await page.getByRole('button', { name: 'None of these' }).click();
  await page
    .getByLabel('What happened, and what should the responsible team know?')
    .fill(description);
  await page
    .getByRole('button', { name: 'Save details and verify email' })
    .click();
  await expect(page).toHaveURL(/\/sign-in\?next=/);
  await expect(
    page.getByText(/draft is still saved on this device/i),
  ).toBeVisible();

  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await page.getByLabel('Six-digit code').fill(await readOtp(request, email));
  await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(page).toHaveURL(/\/report\/new\?verified=1$/);
  await expect(
    page.getByRole('heading', { name: 'Review and submit' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Submit report' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'safety check' }),
  ).toContainText(/safety check is temporarily unavailable/i);
  await page.reload();
  await page.getByRole('button', { name: 'Submit report' }).click();
  await expect(
    page.getByRole('heading', { name: 'Report published safely' }),
  ).toBeVisible();

  const publicLink = page.getByRole('link', { name: 'View public report' });
  const href = await publicLink.getAttribute('href');
  expect(href).toMatch(/^\/reports\/HBR-/);
  await Promise.all([
    page.waitForURL((url) => url.pathname === href),
    publicLink.click(),
  ]);
  await page.reload();
  await expect(page.getByText('Platform · system evidence')).toBeVisible();
  const publicHtml = await page.content();
  expect(publicHtml).not.toContain('Private Fixture Lane 77');
  expect(publicHtml).not.toContain(email);
  expect(publicHtml).not.toContain('service_role');
  expect(publicHtml).not.toContain('storage_path');

  await page.goto('/account/reports');
  await expect(
    page.getByRole('heading', { name: 'Your reports' }),
  ).toBeVisible();
  await expect(page.getByText(description)).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test('public browse remains list-first offline and strict CSP is request-scoped', async ({
  page,
  request,
}) => {
  await page.goto('/reports');
  await expect(
    page.getByRole('list', { name: 'Public reports' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: 'Synthetic report map' }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Show on optional map' })
    .first()
    .click();
  await expect(
    page.getByRole('region', { name: 'Synthetic report map' }),
  ).toBeVisible();

  await page.context().setOffline(true);
  await expect(
    page.getByText(/Offline — showing the last server-rendered/i),
  ).toBeVisible();
  await expect(
    page.getByRole('list', { name: 'Public reports' }),
  ).toBeVisible();
  await page.context().setOffline(false);

  const first = await request.get('/reports');
  const second = await request.get('/reports');
  const firstCsp = first.headers()['content-security-policy'];
  const secondCsp = second.headers()['content-security-policy'];
  expect(firstCsp).toContain("'strict-dynamic'");
  expect(firstCsp).toContain("media-src 'none'");
  expect(firstCsp).not.toContain("'unsafe-inline'");
  expect(firstCsp).not.toContain("'unsafe-eval'");
  expect(firstCsp).not.toBe(secondCsp);
});
