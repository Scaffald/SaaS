import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vitest/config";
import baseConfig from "../../vitest.config";

const workspaceRoot = fileURLToPath(new URL("../..", import.meta.url));

const packageConfig = {
  root: workspaceRoot,
  test: {
    include: ["packages/neue-ui/**/*.{test,spec}.{ts,tsx}"],
    watchExclude: ["**/dist/**", "**/.turbo/**"],
  },
  resolve: {
    alias: [
      { find: "react-native", replacement: "react-native-web" },
      {
        find: "@scaffald/neue-ui",
        replacement: resolve(workspaceRoot, "packages/neue-ui"),
      },
    ],
  },
};

export default mergeConfig(baseConfig, packageConfig);
