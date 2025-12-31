/**
 * Web-specific Tamagui configuration for forsured-web
 * Uses CSS animations instead of moti/reanimated to avoid web compatibility issues
 */
import { defaultConfig } from '@tamagui/config/v4';
import { createTamagui, setupDev } from '@unicornlove/ui';
import { animations } from './animations-css';
// Import themes from the UI package
import { themes } from '@unicornlove/ui';

// Development setup - only in development
if (process.env.NODE_ENV === 'development') {
  setupDev({
    visualizer: true,
  });
}

export const tamaguiWebConfig = createTamagui({
  ...defaultConfig,

  // Use CSS animations for web instead of moti
  animations,
  disableSSR: true,

  media: defaultConfig.media,

  onlyAllowShorthands: false,
  themes,
  tokens: defaultConfig.tokens,
});

export type TamaguiWebConfig = typeof tamaguiWebConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends TamaguiWebConfig {}
}
