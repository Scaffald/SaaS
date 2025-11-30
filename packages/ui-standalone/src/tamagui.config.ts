import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui, setupDev } from 'tamagui'
import { animations } from './config/animations'
import { themes } from './themes/scaffald-theme'

// Development setup - only in development
if (process.env.NODE_ENV === 'development') {
  setupDev({
    visualizer: true,
  })
}

export const config = createTamagui({
  ...defaultConfig,
  // Explicitly include tokens to ensure they're available during static extraction
  tokens: defaultConfig.tokens,
  themes,
  disableSSR: true,
  onlyAllowShorthands: false,

  animations,

  // Use defaultConfig.media since custom media export is commented out
  media: defaultConfig.media,
})

export default config

export type Conf = typeof config

declare module 'tamagui' {
  interface TamaguiCustomConfig extends Conf {}
}
