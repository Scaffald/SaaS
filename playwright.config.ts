import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Test Configuration
 *
 * Phase 1: Smoke Tests Only
 * - Only critical tests are enabled initially
 * - See tests/docs/TODO.md for full re-enablement strategy
 */
export default defineConfig({
  // Phase 1: Enable E2E tests (previously disabled_tests)
  testDir: "./tests/e2e",

  // Phase 1: Only run smoke tests (critical path tests)
  // Comment out testMatch to enable all tests in Phase 4
  testMatch: [
    "**/test-a001-*.spec.ts", // Root page loads
    "**/test-a002-*.spec.ts", // Auth page renders
    "**/test-r003-*.spec.ts", // Dashboard navigation
    "**/user-journeys.spec.ts", // Basic user flows
    "**/test-office-webhooks.spec.ts", // Webhooks E2E tests
    "**/test-office-api-keys-analytics.spec.ts", // API Keys analytics E2E tests
    "**/console-audit.spec.ts", // Console audit – writes docs/console-audit.md
    "**/profile-audit-magiclink.spec.ts", // Profile audit (magic link + Mailpit)
    "**/test-supabase-hardening-regression.spec.ts", // Supabase hardening regression
    // The 26 specs under tests/e2e/profile/ are NOT here yet, and that is a
    // deliberate two-step (#592).
    //
    // Step one, done: they targeted a URL space the app no longer serves.
    // Seven pointed at /profile/general, /profile/employment,
    // /profile/education and /profile/certifications — all redirect stubs since
    // the nine-screens-to-four consolidation — and asserted
    // `expect(page.url()).toContain(<old path>)`, which the redirect makes
    // false. They now visit the live routes.
    //
    // Step two, outstanding: one verified green run. Turning them on requires
    // Supabase up, the api function served, the dev server warm and the seeded
    // workers present; the environment this was fixed in had no Docker, so they
    // have been corrected but not executed. Adding them unrun would ship the
    // same "known-red selection" this file already warns about below.
    //
    // To finish: `pnpm supa start`, `pnpm supa functions serve api`, `pnpm web`,
    // then `pnpm exec playwright test tests/e2e/profile --project=chromium`.
    // Green run -> add "**/tests/e2e/profile/*.spec.ts" here.

    // Office specs are still absent, but the selector blocker recorded here
    // previously was wrong, and correcting it matters because it was the stated
    // reason not to proceed.
    //
    // It said ApplicationsKanbanBoard "renders no testID, data-testid or
    // nativeID at all". It does. The chain, traced end to end:
    //
    //   StatusColumn            <DroppableColumn id={status}>
    //   DroppableColumn         <KanbanColumn id={id}>
    //   @scaffald/ui            testID={`kanban-column-${id}`}
    //   react-native-web        domProps['data-testid'] = testID
    //                           (createDOMProps/index.js:836)
    //
    // kanban-helpers.ts tries three selectors and only the first two —
    // [data-column] and [data-status] — miss. The third,
    // getByTestId(`kanban-column-${column}`), resolves. The column ids line up
    // exactly too: KANBAN_COLUMNS is new/screen/interview/offer/hired/rejected,
    // all of which are in the board's STATUSES (which also has `inquired`).
    // test-office-jobs-kanban.spec.ts already selects
    // [data-testid="kanban-column-${status}"] directly, on the same component.
    //
    // So what is left is not a code fix but a verified green run, which needs
    // the whole local stack up — Supabase, the api function, a warm dev server
    // and seeded users past onboarding. Adding the spec without that run is
    // still shipping a known-unknown selection, which is why it is still not
    // listed. See #553; the sequencing note there stands.
  ],

  // Exclude debug/exploration/example files permanently
  testIgnore: [
    "**/debug-*.spec.ts",
    "**/explore-*.spec.ts",
    "**/example-*.spec.ts",
    "**/*.js", // Skip JS files (only TS tests)
  ],

  // Phase 3: Optimized timeouts
  globalTimeout: 10 * 60 * 1000, // 10 minutes max (was 30 minutes)
  timeout: 45_000, // 45s per test (reduced from 90s)

  expect: {
    timeout: 10_000, // 10s for assertions (increased from 5s)
  },

  // Limit parallel workers to prevent resource exhaustion
  workers: process.env.CI ? 1 : 4,
  fullyParallel: true,

  // Retry failed tests (helps with flaky tests)
  retries: process.env.CI ? 2 : 1,

  // Reporters: quiet for CI, HTML for local debugging
  reporter: [
    ["./tests/infrastructure/playwright/quiet-reporter.ts"],
    ["html", { outputFolder: "tests/reports/playwright", open: "never" }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:8081",
    trace: "on-first-retry",
    screenshot: "only-on-failure",

    // Improve browser cleanup to prevent hanging processes
    launchOptions: {
      args: [
        "--disable-dev-shm-usage",
        "--disable-extensions",
        "--no-sandbox",
      ],
    },
  },

  // Phase 1: Start with chromium only for stability
  // Expand to multi-viewport in Phase 4
  projects: [
    // Setup project - runs first to create auth state files.
    //
    // `testDir` pointed at ./tests/e2e, but auth.setup.ts lives under
    // tests/infrastructure/playwright/setup/. The project therefore selected
    // nothing and tests/.auth/*.json was never produced, so every spec doing
    // `test.use({ storageState: "tests/.auth/super-admin.json" })` would fail
    // at startup on a fresh checkout (#553). It selected nothing silently,
    // which is why this went unnoticed: a project that matches no files is not
    // an error.
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
      testDir: "./tests/infrastructure/playwright/setup",
    },
    // Primary browser - desktop Chrome
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      timeout: 45_000,
      dependencies: ["setup"],
    },
    // Phase 4: Uncomment to enable multi-viewport testing
    // {
    //   name: 'iPhone SE',
    //   use: {
    //     ...devices['iPhone SE'],
    //     viewport: { width: 375, height: 667 },
    //   },
    //   timeout: 60_000,
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'iPhone 12',
    //   use: {
    //     ...devices['iPhone 12'],
    //     viewport: { width: 390, height: 844 },
    //   },
    //   timeout: 60_000,
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'iPad',
    //   use: {
    //     ...devices['iPad'],
    //     viewport: { width: 768, height: 1024 },
    //   },
    //   timeout: 60_000,
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'Desktop 1080p',
    //   use: {
    //     ...devices['Desktop Chrome'],
    //     viewport: { width: 1920, height: 1080 },
    //   },
    //   timeout: 45_000,
    //   dependencies: ['setup'],
    // },
  ],
});
