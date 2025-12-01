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

export default defineConfig({
  plugins,
  resolve: {
    alias: [
      {
        find: "msw/node",
        replacement: resolve(workspaceRoot, "node_modules/msw/node"),
      },
      {
        find: "react-native",
        replacement: reactNativeMockPath,
      },
      {
        find: /^react-native\//,
        replacement: reactNativeMockPath,
      },
      {
        find: "@app/core",
        replacement: resolve(workspaceRoot, "packages/core"),
      },
      {
        find: "@unicornlove/ui",
        replacement: resolve(workspaceRoot, "packages/ui/src"),
      },
      {
        find: "@app/supabase",
        replacement: resolve(workspaceRoot, "packages/supabase"),
      },
      {
        find: "@app/schemas",
        replacement: resolve(workspaceRoot, "packages/schemas/src"),
      },
      {
        find: "@app/trpc",
        replacement: resolve(workspaceRoot, "packages/trpc/src"),
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
        find: "@app/core/constants/routes",
        replacement: resolve(
          workspaceRoot,
          "tests/infrastructure/vitest/mocks/routes.ts",
        ),
      },
      {
        find: "@app/styleguide",
        replacement: resolve(workspaceRoot, "packages/ui/src/styleguide"),
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
    ],
    include: ["packages/**/*.{test,spec}.{ts,tsx}"],
    // Limit concurrent tests to reduce memory pressure
    maxConcurrency: 3,
    // Using threads pool - shares memory, lower overhead than forks
    pool: "threads",
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
