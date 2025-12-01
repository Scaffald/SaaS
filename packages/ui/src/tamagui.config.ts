import { defaultConfig } from "@tamagui/config/v4";
import { createTamagui, setupDev } from "tamagui";
import { animations } from "./config/animations";
import { themes } from "./themes/scaffald-theme";

// Development setup - only in development
if (process.env.NODE_ENV === "development") {
  setupDev({
    visualizer: true,
  });
}

export const tamaguiConfig = createTamagui({
  ...defaultConfig,

  animations,
  disableSSR: true,

  // Use defaultConfig.media since custom media export is commented out
  media: defaultConfig.media,

  onlyAllowShorthands: false,
  shorthands: defaultConfig.shorthands,
  themes,
  // Explicitly include tokens to ensure available during static extraction
  tokens: defaultConfig.tokens,
});
