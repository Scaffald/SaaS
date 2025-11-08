import { defaultConfig } from "@tamagui/config/v4";
import { createTamagui, setupDev } from "tamagui";
import { animations } from "./config/animations";
import { media } from "./config/media";
import { themes } from "./themes/scaffald-theme";

// Development setup - only in development
if (process.env.NODE_ENV === "development") {
  setupDev({
    visualizer: true,
  });
}

export const config = createTamagui({
  ...defaultConfig,
  themes,
  disableSSR: true,
  onlyAllowShorthands: false,

  animations,

  media,
});

export default config;

export type Conf = typeof config;

declare module "tamagui" {
  interface TamaguiCustomConfig extends Conf {}
}
