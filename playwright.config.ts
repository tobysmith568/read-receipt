import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: "html",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  webServer: {
    command: "bun run build && bun run start",
    url: "http://localhost:3000",
    // Always reuse, never just `!process.env.CI`: in CI the e2e job already
    // has the built Docker image running on 3000 before `playwright test`
    // starts, so this must reuse that rather than trying to bind its own.
    reuseExistingServer: true,
    timeout: 120_000,
    env: { PORT: "3000" } // @astrojs/node defaults to 8080 when PORT is unset
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } }
  ]
});
