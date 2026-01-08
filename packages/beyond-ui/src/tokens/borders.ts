/**
 * Border tokens mapped from Figma Forsured Design System
 *
 * Border radius values: s(8), m(10), l(12), xl(16), xxl(20)
 * All values are in pixels
 */

/**
 * Border radius scale
 * Mapped from Figma radius tokens exactly
 */
export const borderRadius = {
  none: 0, // radius-none
  xxxs: 2, // radius-xxxs
  xxs: 4, // radius-xxs
  xs: 6, // radius-xs
  s: 8, // radius-s
  m: 10, // radius-m
  l: 12, // radius-l
  xl: 16, // radius-xl
  xxl: 20, // radius-xxl
  xxxl: 32, // radius-xxxl
  xxxxl: 48, // radius-xxxxl
  max: 999, // radius-max (fully rounded/pill shape)
} as const

/**
 * Named border radius for semantic usage
 * Provides convenient aliases matching common naming conventions
 */
export const radius = {
  none: borderRadius.none, // 0
  xxxs: borderRadius.xxxs, // 2
  xxs: borderRadius.xxs, // 4
  xs: borderRadius.xs, // 6
  sm: borderRadius.s, // 8
  md: borderRadius.m, // 10
  lg: borderRadius.l, // 12
  xl: borderRadius.xl, // 16
  '2xl': borderRadius.xxl, // 20
  '3xl': borderRadius.xxxl, // 32
  '4xl': borderRadius.xxxxl, // 48
  full: borderRadius.max, // 999 (pill shape)
} as const

/**
 * Border width scale
 */
export const borderWidth = {
  none: 0,
  thin: 1,
  medium: 2,
  thick: 3,
  heavy: 4,
} as const

/**
 * Border style values
 */
export const borderStyle = {
  solid: 'solid' as const,
  dashed: 'dashed' as const,
  dotted: 'dotted' as const,
  none: 'none' as const,
} as const

/**
 * Common border combinations
 */
export const borders = {
  none: {
    borderWidth: borderWidth.none,
    borderStyle: borderStyle.none,
  },
  thin: {
    borderWidth: borderWidth.thin,
    borderStyle: borderStyle.solid,
  },
  medium: {
    borderWidth: borderWidth.medium,
    borderStyle: borderStyle.solid,
  },
  thick: {
    borderWidth: borderWidth.thick,
    borderStyle: borderStyle.solid,
  },
} as const

export type BorderRadiusToken = keyof typeof borderRadius
export type RadiusToken = keyof typeof radius
export type BorderWidthToken = keyof typeof borderWidth
export type BorderStyleToken = keyof typeof borderStyle
