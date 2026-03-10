import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.config";

const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));
const scaffaldRoot = fileURLToPath(new URL(".", import.meta.url));

const expoConfig = {
  resolve: {
    alias: [
      { find: "react-native", replacement: "react-native-web" },
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
    ],
  },
  root: workspaceRoot,
  test: {
    // Override setupFiles to use Scaffald-specific setup (real Supabase, no mocking)
    setupFiles: [resolve(scaffaldRoot, "tests/setup.ts")],
    include: ["apps/scaffald/**/*.{test,spec}.{ts,tsx}"],
    watchExclude: ["**/dist/**", "**/.turbo/**", "apps/scaffald/.expo/**"],
    // Override coverage thresholds for Scaffald (80%)
    coverage: {
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
};

const merged = mergeConfig(baseConfig, expoConfig)
merged.test.include = ['apps/scaffald/**/*.{test,spec}.{ts,tsx}']
// Exclude tests that require live services or a running browser
merged.test.exclude = [
  ...(merged.test.exclude ?? []),
  'apps/scaffald/tests/e2e/**',
  'apps/scaffald/tests/testDb.test.ts',
  'apps/scaffald/tests/integration-*.test.ts',
]
export default merged
