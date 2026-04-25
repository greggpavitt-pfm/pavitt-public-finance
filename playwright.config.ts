// Playwright config for critical-path E2E tests.
//
// Tests target the local dev server unless E2E_BASE_URL is set.
// Run:  npx playwright install   (one time, downloads browsers)
//       npm run e2e               (runs all tests)
//
// Test plan:
//   tests/training-flow.spec.ts  — register, take a module, see result
//   tests/advisor-flow.spec.ts   — set context, ask question, verify citation

import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  fullyParallel: false,  // sequential — tests share a Supabase project
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
})
