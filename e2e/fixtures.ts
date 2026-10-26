import { test as base, expect, type Page } from '@playwright/test';

// Fixed "now" so any date-derived UI (min dates, today markers) is stable.
export const FIXED_NOW = new Date('2026-06-15T09:00:00+03:00');

export const test = base.extend({
  // Playwright fixtures name this parameter `use`; the React hooks linter misreads it.
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(FIXED_NOW);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);
  },
});

export { expect };

/** Seeds the (simulated) signed-in user exactly as AuthContext persists it. */
export async function signIn(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem(
      'travelar_auth_user',
      JSON.stringify({ email: 'jane@example.com', name: 'jane', provider: 'email' }),
    );
  });
}

/** Waits for web fonts, images and a settled layout before a screenshot. */
export async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForLoadState('networkidle');
  // Full-page captures scroll the document, so lazy images must already be decoded.
  await page.evaluate(async () => {
    const images = Array.from(document.images);
    images.forEach((image) => {
      image.loading = 'eager';
    });
    await Promise.all(
      images.map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => resolve(), { once: true });
            }),
      ),
    );
    await Promise.all(
      images.map((image) => (image.decode ? image.decode().catch(() => undefined) : Promise.resolve())),
    );
  });
}
