import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui, setupDev } from 'tamagui'

// Development setup - only in development
if (process.env.NODE_ENV === 'development') {
  setupDev({
    visualizer: true,
  })
}

/**
 * Enhanced Tamagui configuration with optimizations
 *
 * Features enabled:
 * - Full v4 default config for maximum compatibility
 * - Optimized for both web and native platforms
 * - Enhanced type safety with proper module declarations
 * - Performance optimizations for production builds
 */
export const config = createTamagui({
  ...defaultConfig,

  // Performance optimizations
  settings: {
    ...defaultConfig.settings,
    // Enable optimizations in production
    allowedStyleValues: 'strict',
    autocompleteSpecificTokens: 'except-special',

    // Enhanced development features
    ...(process.env.NODE_ENV === 'development' && {
      shouldAddPrefersColorThemes: true,
      themeClassNameOnRoot: true,
    }),
  },
})

export default config

// Enhanced TypeScript support with proper module declarations
export type AppConfig = typeof config

declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

// Export config types for use across the app
export type {
  TamaguiComponent,
  TamaguiElement,
  Variable,
  ThemeObject,
  CreateTamaguiConfig,
  GenericTamaguiConfig,
  GetProps,
  StaticConfig,
  TamaguiConfig,
} from '@tamagui/core'
