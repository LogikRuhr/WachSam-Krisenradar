import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_WATCHLIST_PORT ?? 3110);
const baseURL = `http://127.0.0.1:${port}`;
const databaseUrl = process.env.WATCHLIST_E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /watchlist-auth\.spec\.ts/,
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `corepack pnpm exec next dev web --hostname 127.0.0.1 --port ${port}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      AUTH_SECRET: "watchlist-e2e-local-secret",
      AUTH_URL: baseURL,
      DATABASE_URL: databaseUrl,
      RESEND_API_KEY: "watchlist-e2e-no-send",
    },
  },
  projects: [
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"], viewport: { width: 393, height: 852 } },
    },
  ],
});
