import { defaultConfig } from '@tamagui/config/v4'
import { createTamagui, setupDev } from 'tamagui'
import { animations } from './config/animations'
import { bodyFont, headingFont } from './config/fonts'
import { themes } from './themes/scaffald-theme'

// Development setup - only in development
if (process.env.NODE_ENV === 'development') {
  setupDev({
    visualizer: true,
  })
}

export const tamaguiConfig = createTamagui({
  ...defaultConfig,

  animations,
  disableSSR: true,

  // Custom fonts configuration
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },

  // Use default media for now - custom media can cause type issues
  // TODO: Re-enable custom media after verifying it doesn't break types
  media: defaultConfig.media,

  onlyAllowShorthands: false,
  shorthands: defaultConfig.shorthands,
  themes,
  // Explicitly include tokens to ensure available during static extraction
  tokens: defaultConfig.tokens,
})

// Export as 'config' for Tamagui babel/metro plugins
export const config = tamaguiConfig

// Export as default for Tamagui babel/metro plugins
export default tamaguiConfig
