import { createMedia } from '@tamagui/react-native-media-driver'

export const breakpoints = {
  xs: 660,
  sm: 860,
  md: 980,
  lg: 1120,
} as const

export const media = createMedia({
  xxs: { maxWidth: 390 },
  xs: { maxWidth: breakpoints.xs },
  sm: { maxWidth: 800 },
  md: { maxWidth: breakpoints.md },
  lg: { maxWidth: 1280 },
  xl: { maxWidth: 1650 },

  gtXs: { minWidth: breakpoints.xs + 1 },
  gtSm: { minWidth: 800 + 1 },
  gtMd: { minWidth: breakpoints.md + 1 },
  gtLg: { minWidth: 1280 + 1 },
  gtXl: { minWidth: 1650 + 1 },

  short: { maxHeight: 820 },
  tall: { minHeight: 820 },
  hoverNone: { hover: 'none' },
  pointerCoarse: { pointer: 'coarse' },
})

// note all the non "gt" ones should be true to start to match mobile-first
// we're aiming for "xs" to be the default to "gtXs" true too
export const mediaQueryDefaultActive = {
  xxs: false,
  xs: true,
  sm: true,
  md: true,
  lg: true,
  xl: true,

  gtXs: false,
  gtSm: false,
  gtMd: false,
  gtLg: false,
  gtXl: false,
}

export type BreakpointName = keyof typeof breakpoints
