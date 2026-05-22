import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import type { PluginOption } from "vite";
import { defineConfig } from "vitest/config";

import { flowRemoveTypesPlugin } from "./tests/infrastructure/vitest/plugins/flow-remove";

const workspaceRoot = fileURLToPath(new URL(".", import.meta.url));
const quietProgressReporterPath = resolve(
  workspaceRoot,
  "tests/infrastructure/vitest/reporters/quiet-progress.ts",
);

const plugins: PluginOption[] = [react(), flowRemoveTypesPlugin()];
const reactNativeMockPath = resolve(
  workspaceRoot,
  "tests/infrastructure/vitest/mocks/react-native.ts",
);
const lucideReactNativeMockPath = resolve(
  workspaceRoot,
  "tests/infrastructure/vitest/mocks/lucide-react-native.ts",
);
const expoUpdatesMockPath = resolve(
  workspaceRoot,
  "tests/infrastructure/vitest/mocks/expo-updates.ts",
);

export default defineConfig({
  plugins,
  resolve: {
    // Metro resolves `.web.ts` / `.web.tsx` (and `.native.*` on device) at
    // build time so platform-specific modules (kvStorage, useUserLocation,
    // pickFile, ...) can ship a shared stub + per-platform implementation.
    // Vitest doesn't run Metro, so without this list the bare `.ts` stub
    // wins and tests either throw or get a no-op implementation. We pin
    // browser-flavored extensions ahead of bare ones to match Metro on web.
    extensions: [
      ".web.mjs",
      ".web.js",
      ".web.ts",
      ".web.jsx",
      ".web.tsx",
      ".mjs",
      ".js",
      ".ts",
      ".jsx",
      ".tsx",
      ".json",
    ],
    alias: [
      // Force single React instance across all packages (pnpm scoped modules workaround)
      { find: /^react$/, replacement: resolve(workspaceRoot, "node_modules/react") },
      { find: /^react\/jsx-runtime$/, replacement: resolve(workspaceRoot, "node_modules/react/jsx-runtime") },
      { find: /^react-dom$/, replacement: resolve(workspaceRoot, "node_modules/react-dom") },
      { find: /^react-dom\/client$/, replacement: resolve(workspaceRoot, "node_modules/react-dom/client") },
      {
        find: "msw/node",
        replacement: resolve(workspaceRoot, "node_modules/msw/node"),
      },
      {
        find: "lucide-react-native",
        replacement: lucideReactNativeMockPath,
      },
      {
        find: "expo-updates",
        replacement: expoUpdatesMockPath,
      },
      {
        find: "expo-router",
        replacement: resolve(
          workspaceRoot,
          "tests/infrastructure/vitest/mocks/expo-router.ts",
        ),
      },
      {
        find: "@react-native-community/netinfo",
        replacement: resolve(
          workspaceRoot,
          "tests/infrastructure/vitest/mocks/react-native-community-netinfo.ts",
        ),
      },
      {
        find: "react-native",
        replacement: reactNativeMockPath,
      },
      {
        find: /^react-native\//,
        replacement: reactNativeMockPath,
      },
      // (Removed) @scf/core/constants/routes mock alias.
      // The real routes module loads fine in jsdom now that lucide-react-native
      // and locales are mocked. Tests that exercise route helpers (drawer
      // isActivePath, navigation/routeHierarchy) need the full tree to pass.
      {
        find: "@scf/core",
        replacement: resolve(workspaceRoot, "packages/scf-core"),
      },
      {
        find: "@unicornlove/ui",
        replacement: resolve(workspaceRoot, "packages/ui/src"),
      },
      {
        find: "@scaffald/ui/tokens",
        replacement: resolve(
          workspaceRoot,
          "tests/infrastructure/vitest/mocks/beyond-ui-tokens.ts",
        ),
      },
      {
        find: "@scaffald/ui",
        replacement: resolve(
          workspaceRoot,
          "tests/infrastructure/vitest/mocks/beyond-ui.tsx",
        ),
      },
      {
        find: "@scf/supabase",
        replacement: resolve(workspaceRoot, "packages/supabase"),
      },
      {
        find: "@scf/schemas",
        replacement: resolve(workspaceRoot, "packages/scf-schemas/src"),
      },
      {
        find: "@scf/trpc",
        replacement: resolve(workspaceRoot, "packages/scf-trpc/src"),
      },
      {
        find: "@testing-library/react-native",
        replacement: resolve(
          workspaceRoot,
          "tests/infrastructure/vitest/mocks/testing-library-react-native.ts",
        ),
      },
      {
        find: "expo-constants",
        replacement: resolve(
          workspaceRoot,
          "tests/infrastructure/vitest/mocks/expo-constants.ts",
        ),
      },
      {
        find: "expo-modules-core",
        replacement: resolve(
          workspaceRoot,
          "tests/infrastructure/vitest/mocks/expo-modules-core.ts",
        ),
      },
      {
        find: "expo-localization",
        replacement: resolve(
          workspaceRoot,
          "tests/infrastructure/vitest/mocks/expo-localization.ts",
        ),
      },
      {
        find: "@test-helpers",
        replacement: resolve(
          workspaceRoot,
          "tests/infrastructure/vitest/helpers",
        ),
      },
    ],
    conditions: ["browser", "module", "import", "default"],
  },
  root: workspaceRoot,
  test: {
    coverage: {
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.test.tsx",
        "**/*.spec.tsx",
        "**/*.d.ts",
        "**/types/**",
        "**/__mocks__/**",
        "**/mocks/**",
      ],
      provider: "v8",
      reporter: ["text", "text-summary", "json", "html"],
      reportsDirectory: "./tests/reports/coverage",
      // Enforce minimum coverage thresholds
      thresholds: {
        branches: 50,
        functions: 60,
        lines: 60,
        statements: 60,
      },
    },
    environment: "jsdom",
    globals: true,
    hookTimeout: 5000, // 5 second timeout for setup/teardown
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.{idea,git,cache,output,temp}/**",
      // Exclude Deno tests - they run separately with Deno
      "packages/supabase/tests/routers/**",
      "packages/supabase/tests/**/*.test.ts",
      // Exclude supabase integration tests that require live services
      "packages/supabase/functions/**",
      "packages/supabase/scripts/**",
      // Exclude ai-pipeline - uses @napi-rs/canvas (native binary, incompatible with jsdom/threads)
      "packages/ai-pipeline/**",
      // Exclude tests that require live API keys / external services (run manually)
      "packages/scf-core/utils/analytics/__tests__/verify-posthog-syncing.test.ts",
      "packages/scf-core/utils/analytics/__tests__/posthog-api-verification.test.ts",
    ],
    include: ["packages/**/*.{test,spec}.{ts,tsx}"],
    // Limit concurrent tests to reduce memory pressure
    maxConcurrency: 3,
    // Using threads pool - shares memory, lower overhead than forks
    pool: "threads",
    // Cap workers to 2 to prevent OOM on 14-CPU machines (InlineConfig uses maxWorkers).
    maxWorkers: 2,
    reporters: [
      quietProgressReporterPath,
      ["json", { outputFile: "tests/reports/coverage/test-results.json" }],
    ],
    // Run test files sequentially to prevent resource exhaustion
    sequence: {
      concurrent: false, // Don't run tests concurrently within a file
    },
    setupFiles: [
      resolve(workspaceRoot, "tests/infrastructure/vitest/setup.ts"),
    ],
    testTimeout: 10000, // 10 second timeout per test - fail fast on hanging tests
  },
});
