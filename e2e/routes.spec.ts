import { expect, settle, signIn, test } from './fixtures';

// Visual baselines for routes that render without prior booking state.

const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/register',
  '/manage-booking',
  '/parcels',
  '/help',
  '/partners',
  '/about',
  '/contact',
  '/cancellation-policy',
  '/terms',
  '/privacy',
  '/cookies',
  '/api-enquiries',
];

for (const route of PUBLIC_ROUTES) {
  test(`public ${route}`, async ({ page }, info) => {
    await page.goto(route);
    await settle(page);
    await expect(page).toHaveScreenshot(`public-${route.replace(/\W+/g, '_') || 'home'}.png`, {
      fullPage: true,
    });
    expect(info.project.name).toBeTruthy();
  });
}

const AUTH_ROUTES = ['/dashboard', '/operator/bus', '/operator/ferry'];

for (const route of AUTH_ROUTES) {
  test(`signed-in ${route}`, async ({ page }) => {
    await signIn(page);
    await page.goto(route);
    await settle(page);
    await expect(page).toHaveScreenshot(`auth-${route.replace(/\W+/g, '_')}.png`, { fullPage: true });
  });
}

test('guard: signed-out users are redirected from protected routes to /signin', async ({ page }) => {
  // The account area uses the shared sign-in; both operator consoles share the OIMS gate.
  const guards = [
    { route: '/dashboard', landing: /\/signin$/ },
    { route: '/operator/bus', landing: /\/operator\/oims-signin$/ },
    { route: '/operator/ferry', landing: /\/operator\/oims-signin$/ },
  ];

  for (const { route, landing } of guards) {
    await page.goto(route);
    await expect(page).toHaveURL(landing, { timeout: 15_000 });
  }
});

test('checkout with no booking shows the empty state', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page.getByText('No booking to check out.')).toBeVisible();
  await expect(page).toHaveScreenshot('checkout-empty.png', { fullPage: true });
});

test('manage booking: PNR validation and not-found state', async ({ page }) => {
  await page.goto('/manage-booking');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Find booking' }).click();
  await expect(page.getByText('Enter your PNR or tracking number.')).toBeVisible();

  await page.getByLabel('PNR').fill('TRV-123456');
  await page.getByRole('button', { name: 'Find booking' }).click();
  await expect(page.getByText(/No booking found with PNR "TRV-123456"/)).toBeVisible();
  await expect(page).toHaveScreenshot('manage-booking-not-found.png', { fullPage: true });
});

test('parcel tracking: validation and an honest empty result', async ({ page }) => {
  await page.goto('/parcels');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Find parcel' }).click();
  await expect(page.getByText('Enter your PNR or tracking number.')).toBeVisible();

  await page.getByLabel('PNR or tracking number').fill('TRV-ABC123');
  await page.getByRole('button', { name: 'Find parcel' }).click();
  await expect(page.getByText(/No parcel movement is recorded under TRV-ABC123/)).toBeVisible();
});
