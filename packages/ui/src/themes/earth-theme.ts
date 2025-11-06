import { createThemes, defaultComponentThemes } from '@tamagui/theme-builder'
import {
  earthBlue,
  earthBlueDark,
  earthGray,
  earthGrayDark,
  earthGreen,
  earthGreenDark,
  earthOrange,
  earthOrangeDark,
  earthPink,
  earthPinkDark,
  earthPurple,
  earthPurpleDark,
  earthRed,
  earthRedDark,
  earthYellow,
  earthYellowDark,
} from './earth-colors'

export const lightTransparent = 'hsla(42, 28%, 96%, 0)' // bg transparent
export const darkTransparent = 'hsla(30, 9%, 17%, 0)' // ink transparent

// Helper to convert HSL to HSLA with alpha=1 for palette values
const hslToHsla = (hsl: string): string => {
  return hsl.replace('hsl(', 'hsla(').replace(')', ', 1)')
}

// Build palette from earthGray colors (removes duplication)
// Tamagui expects: [transparent, color1, color2, ..., color12, transparent]
const lightPalette = [lightTransparent, ...Object.values(earthGray).map(hslToHsla), darkTransparent]

const darkPalette = [
  darkTransparent,
  ...Object.values(earthGrayDark).map(hslToHsla),
  lightTransparent,
]

const lightShadows = {
  shadow1: 'rgba(0,0,0,0.04)',
  shadow2: 'rgba(0,0,0,0.08)',
  shadow3: 'rgba(0,0,0,0.16)',
  shadow4: 'rgba(0,0,0,0.24)',
  shadow5: 'rgba(0,0,0,0.32)',
  shadow6: 'rgba(0,0,0,0.4)',
}

const darkShadows = {
  shadow1: 'rgba(0,0,0,0.2)',
  shadow2: 'rgba(0,0,0,0.3)',
  shadow3: 'rgba(0,0,0,0.4)',
  shadow4: 'rgba(0,0,0,0.5)',
  shadow5: 'rgba(0,0,0,0.6)',
  shadow6: 'rgba(0,0,0,0.7)',
}

// we're adding some example sub-themes for you to show how they are done, "success" "warning", "error":

const builtThemes = createThemes({
  componentThemes: defaultComponentThemes,

  base: {
    palette: {
      dark: darkPalette,
      light: lightPalette,
    },

    extra: {
      light: {
        ...earthBlue,
        ...earthGray,
        ...earthGreen,
        ...earthOrange,
        ...earthPink,
        ...earthPurple,
        ...earthRed,
        ...earthYellow,
        ...lightShadows,
        shadowColor: lightShadows.shadow1,
      },
      dark: {
        ...earthBlueDark,
        ...earthGrayDark,
        ...earthGreenDark,
        ...earthOrangeDark,
        ...earthPinkDark,
        ...earthPurpleDark,
        ...earthRedDark,
        ...earthYellowDark,
        ...darkShadows,
        shadowColor: darkShadows.shadow1,
      },
    },
  },

  accent: {
    palette: {
      dark: Object.values(earthOrangeDark).map(hslToHsla),
      light: Object.values(earthOrange).map(hslToHsla),
    },
  },

  childrenThemes: {
    warning: {
      palette: {
        dark: Object.values(earthYellowDark).map(hslToHsla),
        light: Object.values(earthYellow).map(hslToHsla),
      },
    },

    error: {
      palette: {
        dark: Object.values(earthRedDark).map(hslToHsla),
        light: Object.values(earthRed).map(hslToHsla),
      },
    },

    success: {
      palette: {
        dark: Object.values(earthGreenDark).map(hslToHsla),
        light: Object.values(earthGreen).map(hslToHsla),
      },
    },
  },
  // optionally add more, can pass palette or template

  // grandChildrenThemes: {
  //   alt1: {
  //     template: 'alt1',
  //   },
  //   alt2: {
  //     template: 'alt2',
  //   },
  //   surface1: {
  //     template: 'surface1',
  //   },
  //   surface2: {
  //     template: 'surface2',
  //   },
  //   surface3: {
  //     template: 'surface3',
  //   },
  // },
})

export type Themes = typeof builtThemes

// the process.env conditional here is optional but saves web client-side bundle
// size by leaving out themes JS. tamagui automatically hydrates themes from CSS
// back into JS for you, and the bundler plugins set TAMAGUI_ENVIRONMENT. so
// long as you are using the Vite, Next, Webpack plugins this should just work,
// but if not you can just export builtThemes directly as themes:
export const themes: Themes =
  process.env.TAMAGUI_ENVIRONMENT === 'client' && process.env.NODE_ENV === 'production'
    ? ({} as Themes)
    : (builtThemes as Themes)
