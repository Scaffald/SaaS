import { createThemes, defaultComponentThemes } from '@tamagui/theme-builder'
import * as Colors from '@tamagui/colors'

export const lightTransparent = 'hsla(23, 5%, 99%, 0)'
export const darkTransparent = 'hsla(23, 5%, 9%, 0)'

export const lightColor = 'hsl(207, 22%, 9%)'
const lightPalette = [
  lightTransparent,
  'hsla(23, 7%, 93%, 1)',
  'hsla(23, 10%, 67%, 1)',
  'hsla(23, 12%, 58%, 1)',
  'hsla(23, 14%, 48%, 1)',
  'hsla(23, 15%, 39%, 1)',
  'hsla(23, 17%, 29%, 1)',
  'hsla(23, 18%, 20%, 1)',
  'hsla(23, 20%, 15%, 1)',
  'hsla(23, 20%, 5%, 1)',
  lightColor,
  darkTransparent,
]

export const darkColor = 'hsl(23, 20%, 99.0%)'
const darkPalette = [
  darkTransparent,
  'hsla(30, 4%, 33%, 1)',
  'hsla(29, 8%, 45%, 1)',
  'hsla(29, 10%, 51%, 1)',
  'hsla(29, 12%, 56%, 1)',
  'hsla(29, 16%, 68%, 1)',
  'hsla(29, 18%, 74%, 1)',
  'hsla(28, 20%, 80%, 1)',
  'hsla(23, 20%, 75%, 1)',
  'hsla(23, 20%, 90%, 1)',
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
        ...Colors.blue,
        ...Colors.gray,
        ...Colors.green,
        ...Colors.orange,
        ...Colors.pink,
        ...Colors.purple,
        ...Colors.red,
        ...Colors.yellow,
        ...lightShadows,
        shadowColor: lightShadows.shadow1,
      },
      dark: {
        ...Colors.blueDark,
        ...Colors.grayDark,
        ...Colors.greenDark,
        ...Colors.orangeDark,
        ...Colors.pinkDark,
        ...Colors.purpleDark,
        ...Colors.redDark,
        ...Colors.yellowDark,
        ...darkShadows,
        shadowColor: darkShadows.shadow1,
      },
    },
  },

  accent: {
    palette: {
      dark: [
        'hsla(180, 4%, 28%, 1)',
        'hsla(180, 7%, 30%, 1)',
        'hsla(180, 10%, 32%, 1)',
        'hsla(180, 13%, 34%, 1)',
        'hsla(180, 16%, 36%, 1)',
        'hsla(180, 18%, 37%, 1)',
        'hsla(180, 21%, 39%, 1)',
        'hsla(180, 24%, 41%, 1)',
        'hsla(180, 27%, 43%, 1)',
        'hsla(180, 30%, 45%, 1)',
        'hsla(140, 40%, 60%, 1)',
        'hsla(140, 40%, 80%, 1)',
      ],
      light: [
        'hsla(180, 20%, 100%, 1)',
        'hsla(180, 21%, 94%, 1)',
        'hsla(180, 22%, 88%, 1)',
        'hsla(180, 23%, 82%, 1)',
        'hsla(180, 24%, 76%, 1)',
        'hsla(180, 25%, 69%, 1)',
        'hsla(180, 27%, 63%, 1)',
        'hsla(180, 28%, 57%, 1)',
        'hsla(180, 29%, 51%, 1)',
        'hsla(180, 30%, 45%, 1)',
        'hsla(140, 40%, 25%, 1)',
        'hsla(140, 40%, 10%, 1)',
      ],
    },
  },

  childrenThemes: {
    warning: {
      palette: {
        dark: Object.values(Colors.yellowDark),
        light: Object.values(Colors.yellow),
      },
    },

    error: {
      palette: {
        dark: Object.values(Colors.redDark),
        light: Object.values(Colors.red),
      },
    },

    success: {
      palette: {
        dark: Object.values(Colors.greenDark),
        light: Object.values(Colors.green),
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
