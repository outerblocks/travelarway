// Not ./fixtures: that freezes the browser clock to a fixed date, while the seeded service
// horizon runs from the database's current date. A frozen clock asks for a day that has no
// trips, and a ticket that was never bought cannot be retrieved by its PNR.
import { expect, test } from '@playwright/test';

const PNR_PATTERN = /TRV-[A-Z2-9]{6}/;

/**
 * The PNR is the traveller's key: issued at payment, printed on the ticket, and enough
 * on its own to find the booking afterwards.
 */
test('a purchased ticket can be retrieved by its PNR', async ({ page }) => {
  // A searched route, not a bare /bus/results: the results page lists the trips that match a
  // search, so arriving with no query is an empty state rather than a catalogue of everything.
  await page.goto('/bus/results?from=Dar%20es%20Salaam&to=Arusha');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Book Bus' }).first().click();
  await expect(page.getByRole('heading', { name: /seats/i })).toBeVisible({ timeout: 15_000 });

  await page.getByRole('button', { name: /^Seat .* available$/ }).first().click();
  await page.locator('[id^="name_"]').fill('Amina Juma');
  await page.locator('[id^="email_"]').fill('amina@example.com');
  await page.locator('[id^="phone_"]:not([id^="phone_cc_"])').fill('712345678');

  // Nothing is pre-selected any more: a ticket type prices the seat, and the boarding and
  // drop-off points decide the segment, so the traveller has to state all three.
  await page.locator('[id^="category_"]').first().click();
  await page.locator('[role="listbox"] li', { hasText: /adult/i }).first().click();
  // The custom listbox renders plain `li` items. It is scoped to the visible one because the
  // fare-type listbox stays mounted after its selection, so an unscoped first match would
  // click the fare list again and leave the boarding point unset.
  await page.locator('#boarding_point').click();
  await page.locator('[role="listbox"]:visible li').first().click();
  await page.locator('#dropoff_point').click();
  await page.locator('[role="listbox"]:visible li').last().click();

  await page.getByRole('button', { name: 'Review your booking' }).click();
  await expect(page).toHaveURL(/\/bus\/review$/);

  await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
  await expect(page).toHaveURL(/\/checkout$/);
  await page.getByLabel('Phone Number').fill('712345678');
  await page.getByRole('button', { name: /Simulate payment request/ }).click();
  await expect(page).toHaveURL(/\/confirmation$/, { timeout: 20_000 });

  const ticketLine = await page.getByText(/BOOKING PNR:/).innerText();
  const pnr = PNR_PATTERN.exec(ticketLine)?.[0];
  expect(pnr, `no PNR printed on the ticket: ${ticketLine}`).toBeTruthy();

  // In-session navigation: the store is in memory, so a reload would drop the booking.
  const manageLink = page.locator('header').getByRole('link', { name: 'Manage Booking' });
  if (!(await manageLink.isVisible())) {
    // Tablet and mobile keep the header links behind the menu toggle.
    await page.locator('header').getByRole('button', { name: 'Toggle menu' }).click();
  }
  await manageLink.click();
  await expect(page).toHaveURL(/\/manage-booking$/);

  // Typed the way people type it: lower case, without the prefix.
  await page.getByLabel('PNR').fill((pnr as string).replace('TRV-', '').toLowerCase());
  await page.getByRole('button', { name: 'Find booking' }).click();
  await expect(page.getByText(`Booking found for ${pnr}`)).toBeVisible();
});
