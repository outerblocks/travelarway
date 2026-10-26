import { expect, settle, signIn, test } from './fixtures';

// Visual baselines for routes that render without prior booking state.

const PUBLIC_ROUTES = [
  '/',
  '/signin',
  '/register',
  '/manage-booking',
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

test('manage booking: validation and not-found states', async ({ page }) => {
  await page.goto('/manage-booking');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Find booking' }).click();
  await expect(page.getByText('Please enter your booking reference.')).toBeVisible();
  await page.getByLabel('Booking reference').fill('TRV-123456');
  await page.getByRole('button', { name: 'Find booking' }).click();
  await expect(page.getByText('Please enter the email used for the booking.')).toBeVisible();
  await page.getByLabel('Email used for booking').fill('jane@example.com');
  await page.getByRole('button', { name: 'Find booking' }).click();
  await expect(page.getByText(/No booking found with reference "TRV-123456"/)).toBeVisible({ timeout: 5000 });
  await expect(page).toHaveScreenshot('manage-booking-not-found.png', { fullPage: true });
});
