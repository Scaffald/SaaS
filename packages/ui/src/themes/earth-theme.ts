import { createThemes, defaultComponentThemes } from '@tamagui/theme-builder'
import {
  earthBlue,
  earthBlueDark,
  earthGreen,
  earthGreenDark,
  earthRed,
  earthRedDark,
  earthOrange,
  earthOrangeDark,
  earthYellow,
  earthYellowDark,
  earthPurple,
  earthPurpleDark,
  earthPink,
  earthPinkDark,
  earthGray,
  earthGrayDark,
} from './earth-colors'

export const lightTransparent = 'hsla(42, 28%, 96%, 0)' // bg transparent
export const darkTransparent = 'hsla(30, 9%, 17%, 0)' // ink transparent

export const lightColor = 'hsl(30, 9%, 17%)' // ink: #2F2A26
const lightPalette = [
  lightTransparent,
  'hsla(42, 28%, 96%, 1)', // bg: #F7F4EF
  'hsla(42, 25%, 94%, 1)',
  'hsla(38, 20%, 91%, 1)', // bgWeak: #EFEAE2
  'hsla(45, 33%, 89%, 1)',
  'hsla(45, 30%, 85%, 1)',
  'hsla(30, 9%, 50%, 1)',
  'hsla(30, 9%, 38%, 1)', // inkMuted: #6F665F
  'hsla(30, 9%, 30%, 1)',
  'hsla(30, 9%, 25%, 1)',
  'hsla(30, 9%, 20%, 1)',
  lightColor, // ink: #2F2A26
  darkTransparent,
]

export const darkColor = 'hsl(42, 28%, 96%)' // bg for dark mode
const darkPalette = [
  darkTransparent,
  'hsla(30, 9%, 12%, 1)',
  'hsla(30, 9%, 16%, 1)',
  'hsla(30, 9%, 20%, 1)',
  'hsla(30, 9%, 25%, 1)',
  'hsla(30, 9%, 30%, 1)',
  'hsla(30, 9%, 42%, 1)',
  'hsla(30, 9%, 50%, 1)',
  'hsla(35, 12%, 70%, 1)',
  'hsla(40, 18%, 85%, 1)',
  'hsla(42, 25%, 92%, 1)',
  darkColor,
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
      dark: [
        'hsla(30, 34%, 12%, 1)',
        'hsla(30, 34%, 16%, 1)',
        'hsla(30, 34%, 20%, 1)',
        'hsla(30, 34%, 25%, 1)',
        'hsla(30, 34%, 30%, 1)',
        'hsla(30, 34%, 36%, 1)',
        'hsla(30, 34%, 40%, 1)',
        'hsla(30, 34%, 42%, 1)', // primary: #8C6A43
        'hsla(30, 35%, 48%, 1)',
        'hsla(30, 36%, 55%, 1)',
        'hsla(30, 38%, 70%, 1)',
        'hsla(30, 42%, 88%, 1)',
      ],
      light: [
        'hsla(30, 45%, 97%, 1)',
        'hsla(30, 42%, 94%, 1)',
        'hsla(30, 38%, 88%, 1)',
        'hsla(30, 36%, 80%, 1)',
        'hsla(30, 35%, 70%, 1)',
        'hsla(30, 34%, 60%, 1)',
        'hsla(30, 34%, 51%, 1)',
        'hsla(30, 34%, 42%, 1)', // primary: #8C6A43
        'hsla(30, 35%, 36%, 1)',
        'hsla(30, 36%, 30%, 1)',
        'hsla(30, 38%, 22%, 1)',
        'hsla(30, 42%, 16%, 1)',
      ],
    },
  },

  childrenThemes: {
    warning: {
      palette: {
        dark: Object.values(earthYellowDark),
        light: Object.values(earthYellow),
      },
    },

    error: {
      palette: {
        dark: Object.values(earthRedDark),
        light: Object.values(earthRed),
      },
    },

    success: {
      palette: {
        dark: Object.values(earthGreenDark),
        light: Object.values(earthGreen),
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
