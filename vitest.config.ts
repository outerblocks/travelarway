import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

// Pin the timezone so date-formatting characterization tests are deterministic.
// Africa/Dar_es_Salaam (UTC+3, no DST) is Travelar's primary market.
process.env.TZ = 'Africa/Dar_es_Salaam';

const resolvedViteConfig =
  typeof viteConfig === 'function'
    ? await viteConfig({
        command: 'serve',
        mode: 'test',
        isSsrBuild: false,
        isPreview: false,
      })
    : viteConfig;

export default mergeConfig(
  resolvedViteConfig,
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
