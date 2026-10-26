import { defineConfig } from '@playwright/test';

const PORT = Number(process.env.PLAYWRIGHT_PORT ?? 5199);

// Visual-regression baselines for Travelar (R2).
// Snapshots are OS/browser specific (the file names carry the platform), so
// regenerate with `npm run test:e2e:update` on the platform that runs CI.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0, animations: 'disabled', caret: 'hide' },
  },
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: 'en-US',
    timezoneId: 'Africa/Dar_es_Salaam',
    reducedMotion: 'reduce',
    colorScheme: 'light',
    launchOptions: {
      // Deterministic text rasterisation: avoids run-to-run glyph anti-aliasing noise.
      args: [
        '--font-render-hinting=none',
        '--disable-lcd-text',
        '--disable-font-subpixel-positioning',
        '--disable-gpu',
        '--force-color-profile=srgb',
      ],
    },
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
    { name: 'tablet', use: { browserName: 'chromium', viewport: { width: 993, height: 717 } } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 390, height: 844 } } },
  ],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
