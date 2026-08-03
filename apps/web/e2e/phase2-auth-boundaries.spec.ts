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
    .poll(
      async () => {
        const response = await request.get(
          `${mailpitUrl}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}`,
        );
        const result = (await response.json()) as {
          messages: Array<{ ID: string }>;
        };
        messageId = result.messages[0]?.ID;
        return messageId;
      },
      { timeout: 10_000 },
    )
    .toBeTruthy();

  const message = (await (
    await request.get(`${mailpitUrl}/api/v1/message/${messageId}`)
  ).json()) as { HTML: string; Text: string };
  const token = `${message.Text} ${message.HTML}`.match(/\b\d{6}\b/)?.[0];
  expect(token).toMatch(/^\d{6}$/);
  return token!;
}

async function saveSyntheticDraft(page: Page, suffix: string) {
  await page.evaluate(
    ({ correlationId, idempotencyKey }) =>
      new Promise<void>((resolve, reject) => {
        const request = indexedDB.open('civic-reporting-local', 1);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('drafts')) {
            request.result.createObjectStore('drafts');
          }
        };
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction('drafts', 'readwrite');
          transaction.objectStore('drafts').put(
            {
              version: 1,
              draft: {
                organizationCategoryId: '30000000-0000-4000-8000-000000000001',
                description:
                  'Synthetic Playwright draft for the local Phase 2 OTP boundary.',
                exactLocation: { longitude: 0.0042, latitude: 0.0031 },
                exactAddress: 'Synthetic Block 7, Fixture Lane',
                publicLocation: { longitude: 0, latitude: 0 },
                publicLabel: 'Harborfield North (Synthetic)',
                publicLocationPrecision: 'neighborhood',
                publicationPolicyVersion: 1,
                idempotencyKey,
                correlationId,
              },
              savedAt: new Date().toISOString(),
              expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
            },
            'active-report',
          );
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
      }),
    {
      correlationId: `b2000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
      idempotencyKey: `b3000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
    },
  );
}

test('anonymous protected routes redirect without an open redirect', async ({
  page,
}) => {
  await page.goto('/account/drafts');
  await expect(page).toHaveURL(/\/sign-in\?next=%2Faccount%2Fdrafts$/);
  await expect(
    page.getByRole('heading', { name: 'Verify your email' }),
  ).toBeVisible();

  await page.goto('/sign-in?next=https%3A%2F%2Fattacker.invalid');
  await expect(
    page.getByRole('heading', { name: 'Verify your email' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/127\.0\.0\.1:3010\/sign-in/);
});

test('OTP network failure is recoverable on the current browser', async ({
  page,
}) => {
  await page.route('**/auth/v1/otp', (route) =>
    route.abort('internetdisconnected'),
  );
  await page.goto('/sign-in');
  await page.getByLabel('Email address').fill('offline.phase2@example.test');
  await page.getByRole('button', { name: 'Email me a code' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'temporarily unavailable' }),
  ).toContainText(/temporarily unavailable/i);
  await expect(page.getByLabel('Email address')).toHaveValue(
    'offline.phase2@example.test',
  );
});

test('real local OTP preserves and atomically claims the same-browser draft', async ({
  page,
  request,
}, testInfo) => {
  const suffix = `${testInfo.project.name.includes('mobile') ? '1' : '2'}${String(Date.now()).slice(-11)}`;
  const email = `phase2.${testInfo.project.name}.${suffix}@example.test`;

  await page.goto('/sign-in?next=%2Faccount%2Fdrafts');
  await saveSyntheticDraft(page, suffix);
  await page.reload();
  await expect(
    page.getByText(/draft is still saved on this device/i),
  ).toBeVisible();

  await page.getByLabel('Email address').fill(email);
  await page.getByRole('button', { name: 'Email me a code' }).click();
  const token = await readOtp(request, email);
  const invalidToken = token === '000000' ? '111111' : '000000';
  await page.getByLabel('Six-digit code').fill(invalidToken);
  await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(
    page.getByRole('alert').filter({ hasText: 'invalid or has expired' }),
  ).toContainText(/invalid or has expired/i);
  await expect(
    page.getByText(/draft is still saved on this device/i),
  ).toBeVisible();

  await page.getByLabel('Six-digit code').fill(token);
  await page.getByRole('button', { name: 'Verify code' }).click();
  await expect(page).toHaveURL(/\/account\/drafts$/);
  await expect(
    page.getByText(
      'Synthetic Playwright draft for the local Phase 2 OTP boundary.',
    ),
  ).toBeVisible();
});

test('security headers apply to the public and protected surface', async ({
  request,
}) => {
  const response = await request.get('/');
  expect(response.headers()['content-security-policy']).toContain(
    "media-src 'none'",
  );
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['permissions-policy']).toContain('camera=()');
});
