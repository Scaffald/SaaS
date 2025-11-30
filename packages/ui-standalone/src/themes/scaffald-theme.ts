import { createThemes, defaultComponentThemes } from '@tamagui/theme-builder'

/**
 * Scaffald Theme - Professional teal-based design system infused with Earth palettes
 *
 * Primary color: #239CB2 (teal) - hsl(191, 67%, 42%)
 * Earth tone palettes supply semantic scales across the system.
 */

// Transparent bases align with Earth background/ink values
export const lightTransparent = 'hsla(42, 28%, 96%, 0)'
export const darkTransparent = 'hsla(30, 9%, 17%, 0)'

// --- Foundational edges (shared) ---
export const paper = 'hsla(45, 12%, 99%, 1)' // eggshell / near-white
export const paperMuted = 'hsla(45, 12%, 97%, 1)'
export const ink = 'hsla(220, 12%, 6%, 1)' // midnight / near-black
export const inkMuted = 'hsla(220, 10%, 12%, 1)'

export const tealLight = {
  teal1: 'hsla(191, 100%, 99%, 1)', // 0: Near white (backgrounds)
  teal2: 'hsla(191, 60%, 95%, 1)', // 1: Lightest teal
  teal3: 'hsla(191, 55%, 89%, 1)', // 2: Very light teal
  teal4: 'hsla(191, 52%, 81%, 1)', // 3: Light teal
  teal5: 'hsla(191, 50%, 72%, 1)', // 4: Soft teal
  teal6: 'hsla(191, 55%, 62%, 1)', // 5: Medium-light teal
  teal7: 'hsla(191, 60%, 52%, 1)', // 6: Mid teal
  teal8: 'hsla(191, 67%, 42%, 1)', // 7: PRIMARY BRAND COLOR (#239CB2)
  teal9: 'hsla(191, 72%, 35%, 1)', // 8: Dark teal
  teal10: 'hsla(191, 77%, 28%, 1)', // 9: Darker teal
  teal11: 'hsla(191, 82%, 22%, 1)', // 10: Very dark teal
  teal12: 'hsla(191, 85%, 15%, 1)', // 11: Deepest teal (text on light bg)
}

export const tealDark = {
  teal1: 'hsla(191, 30%, 8%, 1)', // 0: Dark background
  teal2: 'hsla(191, 35%, 12%, 1)', // 1: Darkest teal bg
  teal3: 'hsla(191, 38%, 18%, 1)', // 2: Very dark teal bg
  teal4: 'hsla(191, 40%, 24%, 1)', // 3: Dark teal bg
  teal5: 'hsla(191, 45%, 32%, 1)', // 4: Medium-dark teal
  teal6: 'hsla(191, 50%, 40%, 1)', // 5: Mid-dark teal
  teal7: 'hsla(191, 60%, 50%, 1)', // 6: Mid teal
  teal8: 'hsla(191, 67%, 58%, 1)', // 7: PRIMARY (lighter for dark bg)
  teal9: 'hsla(191, 70%, 68%, 1)', // 8: Light teal
  teal10: 'hsla(191, 65%, 78%, 1)', // 9: Lighter teal
  teal11: 'hsla(191, 60%, 88%, 1)', // 10: Very light teal
  teal12: 'hsla(191, 55%, 95%, 1)', // 11: Lightest teal (text on dark)
}

export const grayLight = {
  gray1: 'hsla(42, 18%, 99%, 1)',
  gray2: 'hsla(40, 16%, 97%, 1)',
  gray3: 'hsla(38, 14%, 94%, 1)',
  gray4: 'hsla(37, 12%, 89%, 1)',
  gray5: 'hsla(36, 11%, 82%, 1)',
  gray6: 'hsla(34, 10%, 72%, 1)',
  gray7: 'hsla(32, 9%, 60%, 1)',
  gray8: 'hsla(30, 9%, 48%, 1)',
  gray9: 'hsla(30, 9%, 40%, 1)',
  gray10: 'hsla(30, 9%, 32%, 1)',
  gray11: 'hsla(30, 9%, 24%, 1)',
  gray12: 'hsla(28, 9%, 18%, 1)',
}

export const grayDark = {
  gray1: 'hsla(220, 10%, 8%, 1)',
  gray2: 'hsla(215, 10%, 11%, 1)',
  gray3: 'hsla(210, 10%, 14%, 1)',
  gray4: 'hsla(210, 10%, 18%, 1)',
  gray5: 'hsla(210, 10%, 22%, 1)',
  gray6: 'hsla(210, 10%, 28%, 1)',
  gray7: 'hsla(210, 10%, 36%, 1)',
  gray8: 'hsla(210, 10%, 44%, 1)',
  gray9: 'hsla(210, 12%, 58%, 1)',
  gray10: 'hsla(35, 14%, 72%, 1)',
  gray11: 'hsla(40, 20%, 88%, 1)',
  gray12: 'hsla(42, 26%, 96%, 1)',
}

export const blueLight = {
  blue1: 'hsla(210, 22%, 99%, 1)',
  blue2: 'hsla(212, 20%, 97%, 1)',
  blue3: 'hsla(213, 19%, 93%, 1)',
  blue4: 'hsla(213, 18%, 88%, 1)',
  blue5: 'hsla(213, 16%, 80%, 1)',
  blue6: 'hsla(213, 15%, 70%, 1)',
  blue7: 'hsla(213, 14%, 60%, 1)',
  blue8: 'hsla(213, 14%, 52%, 1)',
  blue9: 'hsla(213, 16%, 44%, 1)',
  blue10: 'hsla(213, 18%, 36%, 1)',
  blue11: 'hsla(213, 20%, 26%, 1)',
  blue12: 'hsla(213, 22%, 18%, 1)',
}

export const blueDark = {
  blue1: 'hsla(213, 18%, 10%, 1)',
  blue2: 'hsla(213, 16%, 14%, 1)',
  blue3: 'hsla(213, 14%, 18%, 1)',
  blue4: 'hsla(213, 14%, 24%, 1)',
  blue5: 'hsla(213, 14%, 30%, 1)',
  blue6: 'hsla(213, 14%, 36%, 1)',
  blue7: 'hsla(213, 14%, 44%, 1)',
  blue8: 'hsla(213, 14%, 52%, 1)',
  blue9: 'hsla(213, 16%, 60%, 1)',
  blue10: 'hsla(213, 18%, 70%, 1)',
  blue11: 'hsla(213, 20%, 84%, 1)',
  blue12: 'hsla(213, 24%, 96%, 1)',
}

// ===== Forest/Olive “earthGreen” (success) =====
export const greenLight = {
  green1: 'hsla(140, 28%, 99%, 1)',
  green2: 'hsla(140, 26%, 96%, 1)',
  green3: 'hsla(140, 24%, 91%, 1)',
  green4: 'hsla(140, 22%, 84%, 1)',
  green5: 'hsla(140, 21%, 74%, 1)',
  green6: 'hsla(140, 20%, 64%, 1)',
  green7: 'hsla(140, 20%, 56%, 1)',
  green8: 'hsla(140, 20%, 50%, 1)',
  green9: 'hsla(140, 22%, 44%, 1)',
  green10: 'hsla(140, 24%, 36%, 1)',
  green11: 'hsla(140, 26%, 26%, 1)',
  green12: 'hsla(140, 28%, 19%, 1)',
}

export const greenDark = {
  green1: 'hsla(140, 22%, 10%, 1)',
  green2: 'hsla(140, 22%, 13%, 1)',
  green3: 'hsla(140, 22%, 17%, 1)',
  green4: 'hsla(140, 22%, 22%, 1)',
  green5: 'hsla(140, 22%, 28%, 1)',
  green6: 'hsla(140, 22%, 34%, 1)',
  green7: 'hsla(140, 22%, 42%, 1)',
  green8: 'hsla(140, 22%, 50%, 1)',
  green9: 'hsla(140, 24%, 58%, 1)',
  green10: 'hsla(140, 26%, 68%, 1)',
  green11: 'hsla(140, 28%, 82%, 1)',
  green12: 'hsla(140, 30%, 94%, 1)',
}

// ===== Terracotta/Rust “earthRed” (danger) =====
export const redLight = {
  red1: 'hsla(10, 46%, 99%, 1)',
  red2: 'hsla(10, 44%, 96%, 1)',
  red3: 'hsla(10, 42%, 92%, 1)',
  red4: 'hsla(10, 40%, 86%, 1)',
  red5: 'hsla(10, 38%, 78%, 1)',
  red6: 'hsla(10, 36%, 68%, 1)',
  red7: 'hsla(10, 35%, 60%, 1)',
  red8: 'hsla(10, 35%, 54%, 1)',
  red9: 'hsla(10, 36%, 48%, 1)',
  red10: 'hsla(10, 38%, 40%, 1)',
  red11: 'hsla(10, 40%, 30%, 1)',
  red12: 'hsla(10, 42%, 20%, 1)',
}

export const redDark = {
  red1: 'hsla(10, 34%, 10%, 1)',
  red2: 'hsla(10, 35%, 14%, 1)',
  red3: 'hsla(10, 35%, 18%, 1)',
  red4: 'hsla(10, 35%, 23%, 1)',
  red5: 'hsla(10, 35%, 29%, 1)',
  red6: 'hsla(10, 35%, 35%, 1)',
  red7: 'hsla(10, 35%, 43%, 1)',
  red8: 'hsla(10, 35%, 50%, 1)',
  red9: 'hsla(10, 36%, 58%, 1)',
  red10: 'hsla(10, 38%, 68%, 1)',
  red11: 'hsla(10, 40%, 82%, 1)',
  red12: 'hsla(10, 42%, 93%, 1)',
}

// ===== Primary Warm Brown “earthOrange” =====
export const orangeLight = {
  orange1: 'hsla(30, 44%, 99%, 1)',
  orange2: 'hsla(30, 42%, 96%, 1)',
  orange3: 'hsla(30, 38%, 91%, 1)',
  orange4: 'hsla(30, 36%, 84%, 1)',
  orange5: 'hsla(30, 35%, 74%, 1)',
  orange6: 'hsla(30, 34%, 64%, 1)',
  orange7: 'hsla(30, 34%, 54%, 1)',
  orange8: 'hsla(30, 34%, 44%, 1)',
  orange9: 'hsla(30, 35%, 38%, 1)',
  orange10: 'hsla(30, 36%, 31%, 1)',
  orange11: 'hsla(30, 38%, 23%, 1)',
  orange12: 'hsla(30, 42%, 16%, 1)',
}

export const orangeDark = {
  orange1: 'hsla(30, 34%, 10%, 1)',
  orange2: 'hsla(30, 34%, 14%, 1)',
  orange3: 'hsla(30, 34%, 18%, 1)',
  orange4: 'hsla(30, 34%, 23%, 1)',
  orange5: 'hsla(30, 34%, 28%, 1)',
  orange6: 'hsla(30, 34%, 34%, 1)',
  orange7: 'hsla(30, 34%, 40%, 1)',
  orange8: 'hsla(30, 34%, 44%, 1)',
  orange9: 'hsla(30, 35%, 52%, 1)',
  orange10: 'hsla(30, 36%, 60%, 1)',
  orange11: 'hsla(30, 38%, 74%, 1)',
  orange12: 'hsla(30, 42%, 90%, 1)',
}

// ===== Sand/Terracotta “earthYellow” (warning) =====
export const yellowLight = {
  yellow1: 'hsla(45, 50%, 99%, 1)',
  yellow2: 'hsla(45, 46%, 96%, 1)',
  yellow3: 'hsla(45, 42%, 92%, 1)',
  yellow4: 'hsla(45, 38%, 86%, 1)',
  yellow5: 'hsla(45, 36%, 78%, 1)',
  yellow6: 'hsla(45, 34%, 68%, 1)',
  yellow7: 'hsla(45, 32%, 60%, 1)',
  yellow8: 'hsla(45, 31%, 54%, 1)',
  yellow9: 'hsla(45, 32%, 48%, 1)',
  yellow10: 'hsla(45, 34%, 42%, 1)',
  yellow11: 'hsla(45, 36%, 32%, 1)',
  yellow12: 'hsla(45, 40%, 24%, 1)',
}

export const yellowDark = {
  yellow1: 'hsla(45, 30%, 10%, 1)',
  yellow2: 'hsla(45, 31%, 14%, 1)',
  yellow3: 'hsla(45, 31%, 18%, 1)',
  yellow4: 'hsla(45, 31%, 22%, 1)',
  yellow5: 'hsla(45, 31%, 28%, 1)',
  yellow6: 'hsla(45, 31%, 34%, 1)',
  yellow7: 'hsla(45, 31%, 40%, 1)',
  yellow8: 'hsla(45, 32%, 48%, 1)',
  yellow9: 'hsla(45, 34%, 56%, 1)',
  yellow10: 'hsla(45, 36%, 66%, 1)',
  yellow11: 'hsla(45, 40%, 80%, 1)',
  yellow12: 'hsla(45, 44%, 94%, 1)',
}

// ===== Muted Violet “earthPurple” =====
export const purpleLight = {
  purple1: 'hsla(280, 18%, 99%, 1)',
  purple2: 'hsla(280, 16%, 96%, 1)',
  purple3: 'hsla(280, 14%, 92%, 1)',
  purple4: 'hsla(280, 12%, 85%, 1)',
  purple5: 'hsla(280, 11%, 76%, 1)',
  purple6: 'hsla(280, 10%, 66%, 1)',
  purple7: 'hsla(280, 9%, 56%, 1)',
  purple8: 'hsla(280, 9%, 46%, 1)',
  purple9: 'hsla(280, 10%, 38%, 1)',
  purple10: 'hsla(280, 11%, 32%, 1)',
  purple11: 'hsla(280, 12%, 24%, 1)',
  purple12: 'hsla(280, 14%, 18%, 1)',
}

export const purpleDark = {
  purple1: 'hsla(280, 10%, 10%, 1)',
  purple2: 'hsla(280, 10%, 14%, 1)',
  purple3: 'hsla(280, 10%, 18%, 1)',
  purple4: 'hsla(280, 10%, 22%, 1)',
  purple5: 'hsla(280, 10%, 28%, 1)',
  purple6: 'hsla(280, 10%, 34%, 1)',
  purple7: 'hsla(280, 10%, 40%, 1)',
  purple8: 'hsla(280, 10%, 46%, 1)',
  purple9: 'hsla(280, 12%, 54%, 1)',
  purple10: 'hsla(280, 14%, 64%, 1)',
  purple11: 'hsla(280, 16%, 80%, 1)',
  purple12: 'hsla(280, 18%, 92%, 1)',
}

export const pinkLight = {
  pink1: 'hsla(25, 44%, 99%, 1)',
  pink2: 'hsla(25, 42%, 96%, 1)',
  pink3: 'hsla(25, 40%, 92%, 1)',
  pink4: 'hsla(25, 38%, 86%, 1)',
  pink5: 'hsla(25, 37%, 78%, 1)',
  pink6: 'hsla(25, 36%, 68%, 1)',
  pink7: 'hsla(25, 36%, 62%, 1)',
  pink8: 'hsla(25, 36%, 58%, 1)',
  pink9: 'hsla(25, 37%, 52%, 1)',
  pink10: 'hsla(25, 38%, 46%, 1)',
  pink11: 'hsla(25, 40%, 34%, 1)',
  pink12: 'hsla(25, 42%, 24%, 1)',
}

export const pinkDark = {
  pink1: 'hsla(25, 36%, 10%, 1)',
  pink2: 'hsla(25, 36%, 14%, 1)',
  pink3: 'hsla(25, 36%, 18%, 1)',
  pink4: 'hsla(25, 36%, 22%, 1)',
  pink5: 'hsla(25, 36%, 28%, 1)',
  pink6: 'hsla(25, 36%, 34%, 1)',
  pink7: 'hsla(25, 36%, 42%, 1)',
  pink8: 'hsla(25, 36%, 48%, 1)',
  pink9: 'hsla(25, 36%, 56%, 1)',
  pink10: 'hsla(25, 36%, 62%, 1)',
  pink11: 'hsla(25, 38%, 78%, 1)',
  pink12: 'hsla(25, 42%, 92%, 1)',
}

export const lightPalette = [lightTransparent, ...Object.values(grayLight), darkTransparent]
export const darkPalette = [darkTransparent, ...Object.values(grayDark), lightTransparent]

export const shadows = {
  shadowColor: 'rgba(0,0,0,0.3)',
  shadowColorHover: 'rgba(0,0,0,0.4)',
  shadowColorPress: 'rgba(0,0,0,0.5)',
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
      dark: darkPalette,
      light: lightPalette,
    },

    extra: {
      light: {
        ...blueLight,
        ...grayLight,
        ...greenLight,
        ...orangeLight,
        ...pinkLight,
        ...purpleLight,
        ...redLight,
        ...yellowLight,
        ...shadows,
      },
      dark: {
        ...blueDark,
        ...grayDark,
        ...greenDark,
        ...orangeDark,
        ...pinkDark,
        ...purpleDark,
        ...redDark,
        ...yellowDark,
        ...shadows,
      },
    },
  },

  /**
   * Accent theme - uses teal for primary brand color
   * Applied to primary buttons and key actions
   */
  accent: {
    palette: {
      dark: Object.values(tealDark),
      light: Object.values(tealLight),
    },
  },

  /**
   * Child themes for semantic states
   * These provide specialized color palettes for different UI states
   */
  childrenThemes: {
    primary: {
      palette: {
        dark: Object.values(tealDark),
        light: Object.values(tealLight),
      },
    },
    warning: {
      palette: {
        dark: Object.values(yellowDark),
        light: Object.values(yellowLight),
      },
    },
    error: {
      palette: {
        dark: Object.values(redDark),
        light: Object.values(redLight),
      },
    },
    success: {
      palette: {
        dark: Object.values(greenDark),
        light: Object.values(greenLight),
      },
    },
    info: {
      palette: {
        dark: Object.values(blueDark),
        light: Object.values(blueLight),
      },
    },
    blue: {
      palette: {
        dark: Object.values(blueDark),
        light: Object.values(blueLight),
      },
    },
    gray: {
      palette: {
        dark: Object.values(grayDark),
        light: Object.values(grayLight),
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

/**
 * Export scaffald theme as default theme for convenience
 */
export const scaffaldTheme = themes
