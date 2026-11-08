// Not ./fixtures: that freezes the browser clock to a fixed date, while the seeded service
// horizon runs from the database's current date. A frozen clock asks for a day that has no
// trips and the journey can never start.
import { expect, test } from '@playwright/test';

/** Dar es Salaam → Arusha on the seeded corridor, dated by the app rather than the test. */
const BUS_ROUTE = '/bus/results?from=Dar%20es%20Salaam&to=Arusha';

test('checkout route does not accept an empty booking', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page.getByText('No booking to check out.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Back to home' })).toBeVisible();
});

test('confirmation route does not issue a ticket without a confirmed booking', async ({ page }) => {
  await page.goto('/confirmation');
  await expect(page.getByText('No confirmed booking found.')).toBeVisible();
  await expect(page.getByText('TRAVELAR', { exact: true })).toHaveCount(0);
});

test('bus booking: cannot continue without selecting the required seats', async ({ page }) => {
  await page.goto(BUS_ROUTE);
  // Results render from the store during SSR now, so wait for hydration before clicking.
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Book Bus' }).first().click();
  await expect(page.getByRole('heading', { name: /seats/i })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByRole('button', { name: 'Review your booking' })).toBeDisabled();
  await expect(page.getByText('Select seats on the left to enter passenger details.')).toBeVisible();
});

test('bus booking: required passenger fields are validated', async ({ page }) => {
  await page.goto(BUS_ROUTE);
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Book Bus' }).first().click();
  await expect(page.getByRole('heading', { name: /seats/i })).toBeVisible({ timeout: 10_000 });
  await page.getByRole('button', { name: /^Seat .* available$/ }).first().click();
  await page.getByRole('button', { name: 'Review your booking' }).click();
  await expect(page.getByText('Required').first()).toBeVisible();
  await expect(page).toHaveURL(/\/bus\/booking$/);
});
