/**
 * Spacing tokens mapped from Figma Forsured Design System
 *
 * All spacing primitives follow the complete Figma spacing scale exactly.
 * These values form the foundation for all numerical token values in Beyond UI
 * and are also used as gap values in Figma Auto Layout.
 * All values are in pixels and can be used directly in styles.
 */

/**
 * Spacing primitives scale from Figma
 * Complete set of 27 spacing primitives: 0, 2, 4, 6, 8, 10, 12, 16, 20, 24, 28, 32, 40, 48, 64, 80, 96, 128, 160, 192, 224, 256, 320, 384, 512, 640, 768
 * Uses numeric keys that match the Figma primitive values directly
 */
export const spacing = {
  0: 0, // Figma primitive: 0
  2: 2, // Figma primitive: 2
  4: 4, // Figma primitive: 4
  6: 6, // Figma primitive: 6
  8: 8, // Figma primitive: 8
  10: 10, // Figma primitive: 10
  12: 12, // Figma primitive: 12
  16: 16, // Figma primitive: 16
  20: 20, // Figma primitive: 20
  24: 24, // Figma primitive: 24
  28: 28, // Figma primitive: 28
  32: 32, // Figma primitive: 32
  40: 40, // Figma primitive: 40
  48: 48, // Figma primitive: 48
  64: 64, // Figma primitive: 64
  80: 80, // Figma primitive: 80
  96: 96, // Figma primitive: 96
  128: 128, // Figma primitive: 128
  160: 160, // Figma primitive: 160
  192: 192, // Figma primitive: 192
  224: 224, // Figma primitive: 224
  256: 256, // Figma primitive: 256
  320: 320, // Figma primitive: 320
  384: 384, // Figma primitive: 384
  512: 512, // Figma primitive: 512
  640: 640, // Figma primitive: 640
  768: 768, // Figma primitive: 768
} as const

/**
 * Named spacing tokens for semantic usage
 * Prefer these for component gaps, padding, and margins
 * Maps to common spacing values for easy access while maintaining backward compatibility
 */
export const namedSpacing = {
  none: spacing[0], // 0
  xs: spacing[8], // 8
  sm: spacing[10], // 10
  md: spacing[12], // 12
  lg: spacing[24], // 24
  xl: spacing[32], // 32
  '2xl': spacing[40], // 40
  '3xl': spacing[48], // 48
  '4xl': spacing[160], // 160
} as const

/**
 * Padding tokens from Figma
 * Use these for consistent internal component spacing
 * Matches all Figma padding variables: padding-none, padding-4, padding-6, padding-8, padding-10, padding-12, padding-16, padding-20, padding-32, padding-40, padding-48
 *
 * Supports two access patterns:
 * 1. Semantic names (preferred for readability): padding.none, padding.xs, padding.sm, etc.
 * 2. Numeric keys (matches Figma variable names): padding[0], padding[4], padding[6], etc.
 *
 * @example
 * ```typescript
 * import { padding } from '@scaffald/ui/tokens'
 *
 * // Semantic names (recommended)
 * const containerPadding = padding.xl  // 12px
 *
 * // Numeric keys (matches Figma padding-12)
 * const containerPadding = padding[12] // 12px
 * ```
 */
export const padding = {
  // Semantic names (existing, kept for backward compatibility)
  none: spacing[0], // padding-none (0)
  xs: spacing[4], // padding-4 (4)
  sm: spacing[6], // padding-6 (6)
  md: spacing[8], // padding-8 (8)
  lg: spacing[10], // padding-10 (10)
  xl: spacing[12], // padding-12 (12)
  '2xl': spacing[16], // padding-16 (16)
  '3xl': spacing[20], // padding-20 (20)
  '4xl': spacing[32], // padding-32 (32)
  '5xl': spacing[40], // padding-40 (40)
  '6xl': spacing[48], // padding-48 (48)

  // Numeric keys for direct Figma alignment
  0: spacing[0], // padding-none
  4: spacing[4], // padding-4
  6: spacing[6], // padding-6
  8: spacing[8], // padding-8
  10: spacing[10], // padding-10
  12: spacing[12], // padding-12
  16: spacing[16], // padding-16
  20: spacing[20], // padding-20
  32: spacing[32], // padding-32
  40: spacing[40], // padding-40
  48: spacing[48], // padding-48
} as const

/**
 * Common gap values for flex/grid layouts
 * Derived from spacing primitives for consistent spacing in Auto Layout
 */
export const gap = {
  none: spacing[0], // 0
  xs: spacing[4], // 4
  sm: spacing[6], // 6
  md: spacing[8], // 8
  lg: spacing[12], // 12
  xl: spacing[16], // 16
  '2xl': spacing[24], // 24
  '3xl': spacing[28], // 28
  '4xl': spacing[32], // 32
  '5xl': spacing[40], // 40
  '6xl': spacing[64], // 64
  '7xl': spacing[80], // 80
  '8xl': spacing[96], // 96
  '9xl': spacing[128], // 128
} as const

/**
 * Inset values for consistent positioning
 * Derived from spacing primitives for consistent positioning values
 */
export const inset = {
  none: spacing[0], // 0
  xs: spacing[4], // 4
  sm: spacing[8], // 8
  md: spacing[12], // 12
  lg: spacing[16], // 16
  xl: spacing[20], // 20
  '2xl': spacing[24], // 24
  '3xl': spacing[32], // 32
} as const

export type SpacingToken = keyof typeof spacing
export type NamedSpacingToken = keyof typeof namedSpacing
export type PaddingToken = keyof typeof padding
export type GapToken = keyof typeof gap
export type InsetToken = keyof typeof inset

/**
 * Helper type for spacing values
 */
export type SpacingValue = (typeof spacing)[SpacingToken]
