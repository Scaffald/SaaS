import { defaultConfig } from '@tamagui/config/v4'
import { shorthands } from '@tamagui/shorthands'
import { createTokens, createTamagui, setupDev } from 'tamagui'

import { animations } from './config/animations'
import { bodyFont, headingFont } from './config/fonts'
import { media, mediaQueryDefaultActive } from './config/media'
import { themes as defaultThemes } from './themes/theme-generated'
import { color } from './themes/token-colors'
import { radius } from './themes/token-radius'
import { size } from './themes/token-size'
import { space } from './themes/token-space'
import { zIndex } from './themes/token-z-index'
import { themes as earthThemes } from './themes/earth-theme'

// Hold down Option for a second to see some helpful visuals
setupDev({
  visualizer: true,
})

/**
 * This avoids shipping themes as JS. Instead, Tamagui will hydrate them from CSS.
 */
export const config = createTamagui({
  ...defaultConfig,
  themes: defaultThemes,
  defaultFont: 'body',
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  mediaQueryDefaultActive,
  selectionStyles: (theme) => ({
    backgroundColor: theme.color5,
    color: theme.color11,
  }),
  onlyAllowShorthands: false,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  tokens: createTokens({
    color,
    radius,
    zIndex,
    space,
    size,
  }),
  media,
  settings: {
    autocompleteSpecificTokens: 'except-special',
    fastSchemeChange: true,
  },
})

export default config
