import { createThemes, defaultComponentThemes } from '@tamagui/theme-builder'
import type { CreateTamaguiProps } from 'tamagui'
import { animations } from '../config/animations'
import {
  blueDark,
  blueLight,
  darkPalette,
  darkTransparent,
  grayDark,
  grayLight,
  greenDark,
  greenLight,
  lightPalette,
  lightTransparent,
  orangeDark,
  orangeLight,
  pinkDark,
  pinkLight,
  purpleDark,
  purpleLight,
  redDark,
  redLight,
  shadows,
  tealDark,
  tealLight,
  yellowDark,
  yellowLight,
} from './scaffald-theme'

/**
 * Theme configuration interface for customizing the UI package theme
 */
export interface ThemeConfig {
  /** Custom color scales to override default scaffald theme */
  colors?: {
    teal?: { light?: Record<string, string>; dark?: Record<string, string> }
    gray?: { light?: Record<string, string>; dark?: Record<string, string> }
    blue?: { light?: Record<string, string>; dark?: Record<string, string> }
    green?: { light?: Record<string, string>; dark?: Record<string, string> }
    red?: { light?: Record<string, string>; dark?: Record<string, string> }
    yellow?: { light?: Record<string, string>; dark?: Record<string, string> }
    purple?: { light?: Record<string, string>; dark?: Record<string, string> }
    pink?: { light?: Record<string, string>; dark?: Record<string, string> }
    orange?: { light?: Record<string, string>; dark?: Record<string, string> }
    [key: string]: { light?: Record<string, string>; dark?: Record<string, string> } | undefined
  }
  /** Custom component theme overrides */
  components?: typeof defaultComponentThemes
}

/**
 * Token configuration interface for customizing design tokens
 */
export interface TokenConfig {
  /** Custom spacing tokens */
  spacing?: Record<string, number>
  /** Custom radius tokens */
  radius?: Record<string, number>
  /** Custom font size tokens */
  fontSize?: Record<string, number>
  /** Custom font weight tokens */
  fontWeight?: Record<string, string>
  /** Custom line height tokens */
  lineHeight?: Record<string, number>
  /** Custom letter spacing tokens */
  letterSpacing?: Record<string, number>
  /** Custom z-index tokens */
  zIndex?: Record<string, number>
}

/**
 * Font configuration interface
 */
export interface FontConfig {
  /** Custom font family tokens */
  fonts?: Record<string, { family: string; size: Record<string, number> }>
}

/**
 * Complete UI configuration interface
 */
export interface UIConfig {
  /** Theme configuration */
  theme?: ThemeConfig
  /** Token configuration */
  tokens?: TokenConfig
  /** Font configuration */
  fonts?: FontConfig
  /** Additional Tamagui configuration options */
  tamaguiOptions?: Partial<CreateTamaguiProps>
}

/**
 * Merge color scales with custom overrides
 */
function mergeColorScale(
  defaultLight: Record<string, string>,
  defaultDark: Record<string, string>,
  custom?: { light?: Record<string, string>; dark?: Record<string, string> }
): { light: Record<string, string>; dark: Record<string, string> } {
  return {
    light: custom?.light ? { ...defaultLight, ...custom.light } : defaultLight,
    dark: custom?.dark ? { ...defaultDark, ...custom.dark } : defaultDark,
  }
}

/**
 * Create a custom theme from the scaffald theme with optional overrides
 */
export function createTheme(config?: ThemeConfig) {
  if (!config || !config.colors) {
    // Return default scaffald theme
    const { themes } = require('./scaffald-theme')
    return themes
  }

  // Merge custom colors with default scaffald theme
  const mergedTeal = mergeColorScale(tealLight, tealDark, config.colors.teal)
  const mergedGray = mergeColorScale(grayLight, grayDark, config.colors.gray)
  const mergedBlue = mergeColorScale(blueLight, blueDark, config.colors.blue)
  const mergedGreen = mergeColorScale(greenLight, greenDark, config.colors.green)
  const mergedRed = mergeColorScale(redLight, redDark, config.colors.red)
  const mergedYellow = mergeColorScale(yellowLight, yellowDark, config.colors.yellow)
  const mergedPurple = mergeColorScale(purpleLight, purpleDark, config.colors.purple)
  const mergedPink = mergeColorScale(pinkLight, pinkDark, config.colors.pink)
  const mergedOrange = mergeColorScale(orangeLight, orangeDark, config.colors.orange)

  // Create new palette with merged colors
  const newLightPalette = [lightTransparent, ...Object.values(mergedGray.light), darkTransparent]
  const newDarkPalette = [darkTransparent, ...Object.values(mergedGray.dark), lightTransparent]

  // Build themes with merged colors
  return createThemes({
    componentThemes: config.components || defaultComponentThemes,
    base: {
      palette: {
        dark: newDarkPalette,
        light: newLightPalette,
      },
      extra: {
        light: {
          ...mergedBlue.light,
          ...mergedGray.light,
          ...mergedGreen.light,
          ...mergedOrange.light,
          ...mergedPink.light,
          ...mergedPurple.light,
          ...mergedRed.light,
          ...mergedYellow.light,
          ...shadows,
        },
        dark: {
          ...mergedBlue.dark,
          ...mergedGray.dark,
          ...mergedGreen.dark,
          ...mergedOrange.dark,
          ...mergedPink.dark,
          ...mergedPurple.dark,
          ...mergedRed.dark,
          ...mergedYellow.dark,
          ...shadows,
        },
      },
    },
    accent: {
      palette: {
        dark: Object.values(mergedTeal.dark),
        light: Object.values(mergedTeal.light),
      },
    },
    childrenThemes: {
      primary: {
        palette: {
          dark: Object.values(mergedTeal.dark),
          light: Object.values(mergedTeal.light),
        },
      },
      warning: {
        palette: {
          dark: Object.values(mergedYellow.dark),
          light: Object.values(mergedYellow.light),
        },
      },
      error: {
        palette: {
          dark: Object.values(mergedRed.dark),
          light: Object.values(mergedRed.light),
        },
      },
      success: {
        palette: {
          dark: Object.values(mergedGreen.dark),
          light: Object.values(mergedGreen.light),
        },
      },
      info: {
        palette: {
          dark: Object.values(mergedBlue.dark),
          light: Object.values(mergedBlue.light),
        },
      },
      blue: {
        palette: {
          dark: Object.values(mergedBlue.dark),
          light: Object.values(mergedBlue.light),
        },
      },
      gray: {
        palette: {
          dark: Object.values(mergedGray.dark),
          light: Object.values(mergedGray.light),
        },
      },
    },
  })
}

/**
 * Create custom tokens with optional overrides
 */
export function createTokens(config?: TokenConfig) {
  if (!config) {
    return undefined
  }

  // Return merged tokens - full implementation would merge with default tokens
  // For now, return undefined to use default tokens
  return undefined
}

/**
 * Create a complete Tamagui configuration from UI config
 */
export function createUIConfig(uiConfig?: UIConfig) {
  const { defaultConfig } = require('@tamagui/config/v4')
  const { createTamagui } = require('tamagui')

  const themes = uiConfig?.theme ? createTheme(uiConfig.theme) : require('./scaffald-theme').themes
  const tokens = uiConfig?.tokens ? createTokens(uiConfig.tokens) : defaultConfig.tokens

  return createTamagui({
    ...defaultConfig,
    tokens: tokens || defaultConfig.tokens,
    themes,
    disableSSR: true,
    onlyAllowShorthands: false,
    animations,
    media: defaultConfig.media,
    ...uiConfig?.tamaguiOptions,
  })
}

/**
 * Export default scaffald theme as example
 */
export { themes as defaultTheme } from './scaffald-theme'
