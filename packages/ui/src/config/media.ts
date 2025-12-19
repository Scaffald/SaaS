/**
 * Media Queries Configuration for Tamagui
 *
 * Defines responsive breakpoints matching Tamagui v4 defaults
 * These enable responsive props like $gtSm, $gtMd, $gtLg, etc.
 */

export const media = {
  xs: { maxWidth: 660 },
  sm: { maxWidth: 800 },
  md: { maxWidth: 1020 },
  lg: { maxWidth: 1280 },
  xl: { maxWidth: 1420 },
  xxl: { maxWidth: 1600 },
  gtXs: { minWidth: 660 + 1 },
  gtSm: { minWidth: 800 + 1 },
  gtMd: { minWidth: 1020 + 1 },
  gtLg: { minWidth: 1280 + 1 },
  gtXl: { minWidth: 1420 + 1 },
  gtXxl: { minWidth: 1600 + 1 },
  short: { maxHeight: 820 },
  tall: { minHeight: 820 },
  hoverNone: { hover: 'none' },
  pointerCoarse: { pointer: 'coarse' },
}

export type Media = typeof media
