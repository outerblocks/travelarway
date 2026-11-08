import { expect, test, signIn } from './fixtures';

/**
 * The operator and HQ consoles share one job: sign in, then land in the console
 * without an intermediate screen. These pin the redirect contract.
 */
test('OIMS: signing in lands on the operator console', async ({ page }) => {
  const problems: string[] = [];
  page.on('pageerror', (error) => problems.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(message.text());
  });

  await page.goto('/operator/oims-signin');
  // The form is server-rendered: a spinner here means the page gated on session loading.
  await expect(page.locator('#oims_email')).toBeVisible();
  await page.waitForLoadState('networkidle');

  await page.fill('#oims_email', 'operator@company.com');
  await page.fill('#oims_password', 'demo1234');
  await page.getByRole('button', { name: 'Sign In to Console' }).click();

  await expect(page).toHaveURL(/\/operator\/bus$/, { timeout: 15_000 });
  await expect(page.locator('#oims_email')).toHaveCount(0);
  expect(problems).toEqual([]);
});

test('HIMS: signing in lands on the Travelar HQ console', async ({ page }) => {
  await page.goto('/operator/hims-signin');
  await expect(page.locator('#hims_email')).toBeVisible();
  await page.waitForLoadState('networkidle');

  await page.fill('#hims_email', 'staff@travelar.com');
  await page.fill('#hims_password', 'demo1234');
  await page.getByRole('button', { name: 'Sign In to Console' }).click();

  await expect(page).toHaveURL(/\/hq$/, { timeout: 15_000 });
  await expect(page.getByText(/HIMS.*Travelar HQ/)).toBeVisible();
});

test('a signed-in operator is moved off the sign-in page instead of seeing the form', async ({ page }) => {
  await signIn(page);
  await page.goto('/operator/oims-signin');
  await expect(page).toHaveURL(/\/operator\/bus$/, { timeout: 15_000 });
});
