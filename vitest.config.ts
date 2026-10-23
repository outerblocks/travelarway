import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

// Pin the timezone so date-formatting characterization tests are deterministic.
// Africa/Dar_es_Salaam (UTC+3, no DST) is Travelar's primary market.
process.env.TZ = 'Africa/Dar_es_Salaam';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      css: false,
    },
  }),
);
