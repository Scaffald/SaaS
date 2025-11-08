import { createThemes, defaultComponentThemes } from '@tamagui/theme-builder'
import * as Colors from '@tamagui/colors'

/**
 * Scaffald Theme - Professional teal-based design system
 *
 * Primary color: #239CB2 (teal) - hsl(191, 67%, 42%)
 * This theme restores the professional polish from the original SCF-Scaffald platform
 */

// Transparent bases
export const lightTransparent = 'hsla(191, 100%, 99%, 0)'
export const darkTransparent = 'hsla(191, 30%, 8%, 0)'

/**
 * Teal Color Palette (Light Theme)
 * 12-step scale from lightest to darkest
 * Step 7 is the primary brand color: #239CB2
 */
const tealLight = [
  'hsla(191, 100%, 99%, 1)', // 0: Near white (backgrounds)
  'hsla(191, 60%, 95%, 1)', // 1: Lightest teal
  'hsla(191, 55%, 89%, 1)', // 2: Very light teal
  'hsla(191, 52%, 81%, 1)', // 3: Light teal
  'hsla(191, 50%, 72%, 1)', // 4: Soft teal
  'hsla(191, 55%, 62%, 1)', // 5: Medium-light teal
  'hsla(191, 60%, 52%, 1)', // 6: Mid teal
  'hsla(191, 67%, 42%, 1)', // 7: PRIMARY BRAND COLOR (#239CB2)
  'hsla(191, 72%, 35%, 1)', // 8: Dark teal
  'hsla(191, 77%, 28%, 1)', // 9: Darker teal
  'hsla(191, 82%, 22%, 1)', // 10: Very dark teal
  'hsla(191, 85%, 15%, 1)', // 11: Deepest teal (text on light bg)
]

/**
 * Teal Color Palette (Dark Theme)
 * Inverted and adjusted for dark backgrounds
 * Step 7 remains visually similar but lighter for dark bg
 */
const tealDark = [
  'hsla(191, 30%, 8%, 1)', // 0: Dark background
  'hsla(191, 35%, 12%, 1)', // 1: Darkest teal bg
  'hsla(191, 38%, 18%, 1)', // 2: Very dark teal bg
  'hsla(191, 40%, 24%, 1)', // 3: Dark teal bg
  'hsla(191, 45%, 32%, 1)', // 4: Medium-dark teal
  'hsla(191, 50%, 40%, 1)', // 5: Mid-dark teal
  'hsla(191, 60%, 50%, 1)', // 6: Mid teal
  'hsla(191, 67%, 58%, 1)', // 7: PRIMARY (lighter for dark bg)
  'hsla(191, 70%, 68%, 1)', // 8: Light teal
  'hsla(191, 65%, 78%, 1)', // 9: Lighter teal
  'hsla(191, 60%, 88%, 1)', // 10: Very light teal
  'hsla(191, 55%, 95%, 1)', // 11: Lightest teal (text on dark)
]

/**
 * Professional Grey Palette (Light Theme)
 * Used for neutral UI elements, text, and backgrounds
 */
const greyLight = [
  'hsla(210, 20%, 99%, 1)', // 0: Near white
  'hsla(210, 20%, 96%, 1)', // 1: Lightest grey
  'hsla(210, 15%, 91%, 1)', // 2: Very light grey
  'hsla(210, 12%, 85%, 1)', // 3: Light grey
  'hsla(210, 10%, 75%, 1)', // 4: Soft grey
  'hsla(210, 8%, 65%, 1)', // 5: Medium grey
  'hsla(210, 7%, 50%, 1)', // 6: Mid grey
  'hsla(210, 8%, 40%, 1)', // 7: Dark-mid grey
  'hsla(210, 10%, 30%, 1)', // 8: Dark grey
  'hsla(210, 12%, 22%, 1)', // 9: Darker grey
  'hsla(210, 15%, 15%, 1)', // 10: Very dark grey
  'hsla(210, 18%, 10%, 1)', // 11: Deepest grey
]

/**
 * Professional Grey Palette (Dark Theme)
 * Inverted for dark mode UI
 */
const greyDark = [
  'hsla(210, 18%, 8%, 1)', // 0: Dark bg
  'hsla(210, 15%, 12%, 1)', // 1: Darkest grey
  'hsla(210, 12%, 18%, 1)', // 2: Very dark grey
  'hsla(210, 10%, 25%, 1)', // 3: Dark grey
  'hsla(210, 8%, 35%, 1)', // 4: Medium-dark grey
  'hsla(210, 7%, 45%, 1)', // 5: Mid-dark grey
  'hsla(210, 8%, 55%, 1)', // 6: Mid grey
  'hsla(210, 10%, 65%, 1)', // 7: Light-mid grey
  'hsla(210, 12%, 75%, 1)', // 8: Light grey
  'hsla(210, 15%, 85%, 1)', // 9: Lighter grey
  'hsla(210, 18%, 92%, 1)', // 10: Very light grey
  'hsla(210, 20%, 97%, 1)', // 11: Lightest grey
]

/**
 * Shadow definitions for light theme
 * Subtle shadows for professional depth
 */
const lightShadows = {
  shadowColor: 'rgba(0,0,0,0.04)',
  shadowColorHover: 'rgba(0,0,0,0.08)',
  shadowColorPress: 'rgba(0,0,0,0.16)',

  // Card shadows (use with cardShadows design token)
  shadow1: 'rgba(0,0,0,0.02)',
  shadow2: 'rgba(0,0,0,0.04)',
  shadow3: 'rgba(0,0,0,0.08)',
  shadow4: 'rgba(0,0,0,0.12)',
  shadow5: 'rgba(0,0,0,0.16)',
  shadow6: 'rgba(0,0,0,0.20)',
}

/**
 * Shadow definitions for dark theme
 * Darker, more prominent shadows
 */
const darkShadows = {
  shadowColor: 'rgba(0,0,0,0.3)',
  shadowColorHover: 'rgba(0,0,0,0.4)',
  shadowColorPress: 'rgba(0,0,0,0.5)',

  shadow1: 'rgba(0,0,0,0.2)',
  shadow2: 'rgba(0,0,0,0.3)',
  shadow3: 'rgba(0,0,0,0.4)',
  shadow4: 'rgba(0,0,0,0.5)',
  shadow5: 'rgba(0,0,0,0.6)',
  shadow6: 'rgba(0,0,0,0.7)',
}

/**
 * Create Scaffald themes using Tamagui theme builder
 */
const builtThemes = createThemes({
  componentThemes: defaultComponentThemes,

  /**
   * Base theme - uses grey as neutral foundation
   * This is the default theme for most UI elements
   */
  base: {
    palette: {
      dark: greyDark,
      light: greyLight,
    },

    extra: {
      light: {
        // Add Tamagui's semantic colors
        ...Colors.blue,
        ...Colors.teal,
        ...Colors.gray,
        ...Colors.green,
        ...Colors.orange,
        ...Colors.pink,
        ...Colors.purple,
        ...Colors.red,
        ...Colors.yellow,
        // Add our custom shadows
        ...lightShadows,
      },
      dark: {
        ...Colors.blueDark,
        ...Colors.tealDark,
        ...Colors.grayDark,
        ...Colors.greenDark,
        ...Colors.orangeDark,
        ...Colors.pinkDark,
        ...Colors.purpleDark,
        ...Colors.redDark,
        ...Colors.yellowDark,
        ...darkShadows,
      },
    },
  },

  /**
   * Accent theme - uses teal for primary brand color
   * Applied to primary buttons and key actions
   */
  accent: {
    palette: {
      dark: tealDark,
      light: tealLight,
    },
  },

  /**
   * Child themes for semantic states
   * These provide specialized color palettes for different UI states
   */
  childrenThemes: {
    /**
     * Primary theme - teal for main actions
     * Use: <Button theme="primary">...</Button>
     */
    primary: {
      palette: {
        dark: tealDark,
        light: tealLight,
      },
    },

    /**
     * Warning theme - yellow for warnings
     */
    warning: {
      palette: {
        dark: Object.values(Colors.yellowDark),
        light: Object.values(Colors.yellow),
      },
    },

    /**
     * Error theme - red for errors and destructive actions
     */
    error: {
      palette: {
        dark: Object.values(Colors.redDark),
        light: Object.values(Colors.red),
      },
    },

    /**
     * Success theme - green for success states
     */
    success: {
      palette: {
        dark: Object.values(Colors.greenDark),
        light: Object.values(Colors.green),
      },
    },

    /**
     * Info theme - blue for informational content
     */
    info: {
      palette: {
        dark: Object.values(Colors.blueDark),
        light: Object.values(Colors.blue),
      },
    },
  },
})

export type Themes = typeof builtThemes

/**
 * Export themes with client-side optimization
 * In production, themes are hydrated from CSS to save bundle size
 */
export const themes: Themes =
  process.env.TAMAGUI_ENVIRONMENT === 'client' && process.env.NODE_ENV === 'production'
    ? ({} as Themes)
    : (builtThemes as Themes)
