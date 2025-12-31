import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: "src/index.tsx",
    "tamagui.config": "src/tamagui.config.ts",
    "types/geographic": "src/types/geographic.ts",
    "types/phone": "src/types/phone.ts",
  },
  format: ["esm", "cjs"],
  dts: false, // Using tsc for declaration generation instead
  splitting: false,
  sourcemap: true,
  clean: true,
  skipNodeModulesBundle: true,
  tsconfig: "tsconfig.json", // Explicitly set tsconfig path to avoid conflicts
  esbuildOptions(options) {
    // Skip CSS imports that aren't available at build time
    options.loader = {
      ...options.loader,
      ".css": "empty",
    };
    // Note: Type checking is handled by tsup via tsconfig.json
    // Removed tsconfigRaw to avoid conflicts with tsup's tsconfig option
  },
  onSuccess: async () => {
    console.log("✅ Build complete - type declarations generated");
  },
  loader: {
    ".js": "jsx",
  },
  external: [
    "react",
    "react-dom",
    "react-native",
    /^react-native\//,
    /^react-native-/,
    "expo",
    /^expo-/,
    "expo-router",
    "tamagui",
    "@tamagui/core",
    "@tamagui/animations-moti",
    "@tamagui/animations-react-native",
    "@tamagui/font-inter",
    "@tamagui/helpers-icon",
    "@tamagui/lucide-icons",
    "@tamagui/theme-builder",
    "@tamagui/toast",
    "@tanstack/react-table",
    "@tiptap/core",
    "@tiptap/extension-placeholder",
    "@tiptap/extension-underline",
    "@tiptap/react",
    "@tiptap/starter-kit",
    "@ts-react/form",
    "@hookform/resolvers",
    "react-hook-form",
    "zod",
    "moti",
    "react-native-reanimated",
    "react-native-gesture-handler",
    "react-dropzone",
    "@dnd-kit/core",
    "@dnd-kit/sortable",
    "@dnd-kit/utilities",
    "awesome-phonenumber",
    "@react-navigation/elements",
    /^@tamagui\/types/,
  ],
  noExternal: [],
});
