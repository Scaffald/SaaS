/**
 * Border tokens mapped from Figma Forsured Design System
 *
 * Border radius values: s(5), m(6), l(8), xl(10), xxl(12)
 * All values are in pixels
 */

/**
 * Border radius scale
 * Reduced to ~4-5px range for primary sizes (s/m)
 */
export const borderRadius = {
  none: 0, // radius-none
  xxxs: 2, // radius-xxxs
  xxs: 3, // radius-xxs
  xs: 4, // radius-xs
  s: 5, // radius-s
  m: 6, // radius-m
  l: 8, // radius-l
  xl: 10, // radius-xl
  xxl: 12, // radius-xxl
  xxxl: 16, // radius-xxxl
  xxxxl: 24, // radius-xxxxl
  max: 999, // radius-max (fully rounded/pill shape)
} as const

/**
 * Named border radius for semantic usage
 * Provides convenient aliases matching common naming conventions
 */
export const radius = {
  none: borderRadius.none, // 0
  xxxs: borderRadius.xxxs, // 2
  xxs: borderRadius.xxs, // 3
  xs: borderRadius.xs, // 4
  sm: borderRadius.s, // 5
  md: borderRadius.m, // 6
  lg: borderRadius.l, // 8
  xl: borderRadius.xl, // 10
  '2xl': borderRadius.xxl, // 12
  '3xl': borderRadius.xxxl, // 16
  '4xl': borderRadius.xxxxl, // 24
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
