import { defineConfig, devices } from '@playwright/test';

/**
 * Sphere E2E Playwright config.
 *
 * Target: https://sphere-web-lemon.vercel.app (staging)
 * Set PLAYWRIGHT_BASE_URL env var to override (e.g. http://localhost:3000 for local).
 *
 * Run all E2E:   npx playwright test
 * Run one file:  npx playwright test e2e/auth.spec.ts
 * UI mode:       npx playwright test --ui
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'https://sphere-web-lemon.vercel.app';
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'https://sphere-production-6477.up.railway.app';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,  // Run serially to avoid test data collisions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [['html', { outputFolder: 'playwright-report' }], ['list']],
  timeout: 60_000,

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

export { BASE_URL, API_URL };
