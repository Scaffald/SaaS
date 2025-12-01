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
    environment: "jsdom",
    include: ["packages/**/*.{test,spec}.{ts,tsx}"],
    setupFiles: [
      resolve(workspaceRoot, "tests/infrastructure/vitest/setup.ts"),
    ],
    testTimeout: 10000, // 10 second timeout per test - fail fast on hanging tests
    hookTimeout: 5000, // 5 second timeout for setup/teardown
    pool: "forks",
    // Note: poolSize was removed in newer Vitest versions
    // Use minWorkers/maxWorkers in poolOptions.forks if needed
    reporters: [quietProgressReporterPath],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "tests/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.test.tsx",
        "**/*.spec.tsx",
      ],
    },
  },
});
