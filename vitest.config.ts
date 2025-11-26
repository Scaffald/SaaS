import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

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
        find: "@app/styleguide",
        replacement: resolve(workspaceRoot, "packages/ui/src/styleguide"),
      },
    ],
    conditions: ["browser", "module", "import", "default"],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['disabled_tests/**/*.{test,spec}.{ts,tsx}'],
  },
});
