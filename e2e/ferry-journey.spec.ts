import { expect, test } from './fixtures';

/**
 * Ferry inventory is not modelled yet. Results and booking steps must stay empty
 * rather than filling the funnel from a fixture catalogue.
 */

test('ferry: results with no inventory show an empty state', async ({ page }) => {
  await page.goto('/ferry/results');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /0 sailings found/i })).toBeVisible();
  await expect(page.getByText(/no sailings found/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /business/i })).toHaveCount(0);
});

test('ferry: a deep link with no booking in progress recovers instead of an empty form', async ({ page }) => {
  await page.goto('/ferry/booking');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText(/unable to load this sailing/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
});
