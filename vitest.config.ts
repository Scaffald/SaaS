import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cpus } from "node:os";

import react from "@vitejs/plugin-react";
import type { PluginOption } from "vite";
import { defineConfig } from "vitest/config";

import { flowRemoveTypesPlugin } from "./tests/infrastructure/vitest/plugins/flow-remove";

const workspaceRoot = fileURLToPath(new URL(".", import.meta.url));
const coverageReportsDirectory = resolve(workspaceRoot, "coverage");
const summaryReporterPath = resolve(
  workspaceRoot,
  "tests/infrastructure/vitest/reporters/summary-reporter.ts",
);
const errorReporterPath = resolve(
  workspaceRoot,
  "tests/infrastructure/vitest/reporters/error-reporter.ts",
);
const hangingTestReporterPath = resolve(
  workspaceRoot,
  "tests/infrastructure/vitest/reporters/hanging-test-reporter.ts",
);

const plugins: PluginOption[] = [react(), flowRemoveTypesPlugin()];
const reactNativeMockPath = resolve(
  workspaceRoot,
  "tests/infrastructure/vitest/mocks/react-native.ts",
);
const jsonReporterPath = resolve(
  workspaceRoot,
  "tests/infrastructure/vitest/reporters/json-reporter.ts",
);
const junitReporterPath = resolve(
  workspaceRoot,
  "tests/infrastructure/vitest/reporters/junit-reporter.ts",
);
const asyncErrorReporterPath = resolve(
  workspaceRoot,
  "tests/infrastructure/vitest/reporters/async-error-reporter.ts",
);
const coverageReporterPath = resolve(
  workspaceRoot,
  "tests/infrastructure/vitest/reporters/coverage-reporter.ts",
);

// Calculate worker pool size: auto-detect from CPU cores with bounds (min 4, max 8)
const cpuCount = cpus().length;
const workerPoolSize = Math.min(Math.max(cpuCount - 1, 4), 8);

export default defineConfig({
  root: workspaceRoot,
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
        find: "@app/ui",
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
    ],
    conditions: ["browser", "module", "import", "default"],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['packages/**/*.{test,spec}.{ts,tsx}'],
    setupFiles: [resolve(workspaceRoot, 'tests/infrastructure/vitest/setup.ts')],
    testTimeout: 60000, // 60 second timeout per test
    hookTimeout: 30000, // 30 second timeout for setup/teardown
    pool: 'forks',
    poolSize: workerPoolSize,
    reporters: [
      'default',
      summaryReporterPath,
      errorReporterPath,
      hangingTestReporterPath,
      jsonReporterPath,
      junitReporterPath,
      asyncErrorReporterPath,
      coverageReporterPath,
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.test.tsx',
        '**/*.spec.tsx',
      ],
    },
  },
});
