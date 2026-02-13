/**
 * Design Tokens
 *
 * All design tokens mapped from Figma Forsured Design System.
 * Import tokens individually or use the complete tokens object.
 *
 * @example
 * ```typescript
 * import { colors, spacing, typography } from '@scaffald/ui/tokens'
 *
 * // Use individual tokens
 * const primaryColor = colors.primary[600]
 * const mediumSpacing = spacing[4] // Use numeric keys for spacing primitives
 *
 * // Or use the complete tokens object
 * import { tokens } from '@scaffald/ui/tokens'
 * const primaryColor = tokens.colors.primary[600]
 * ```
 */

// Re-export all tokens
export * from './colors'
export * from './spacing'
export * from './typography'
export * from './borders'
export * from './shadows'
export * from './animations'
export * from './breakpoints'
export * from './columns'
export * from './gradients'
export * from './dividers'
export * from './patterns'

// Import all for the complete tokens object
import { colors } from './colors'
import { spacing, namedSpacing, padding, gap, inset } from './spacing'
import {
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  typography,
  typographyVariants,
} from './typography'
import { borderRadius, radius, borderWidth, borderStyle, borders } from './borders'
import { shadows, boxShadows, elevation } from './shadows'
import { duration, easing, transitions, delay, animations, springs } from './animations'
import {
  breakpoints,
  mediaQueries,
  mediaQueriesMax,
  mediaQueriesRange,
  devices,
  containerMaxWidths,
} from './breakpoints'
import { columns } from './columns'
import { gradients } from './gradients'
import { dividers, dividerStyles, dividerColor, dividerWidth, dividerGap } from './dividers'
import {
  patterns,
  backgroundGradients,
  blocksPattern,
  netPattern,
  patternOpacity,
} from './patterns'

/**
 * Complete design tokens object
 * Contains all design tokens organized by category
 */
export const tokens = {
  // Colors
  colors,

  // Spacing
  spacing,
  namedSpacing,
  padding,
  gap,
  inset,

  // Typography
  fontFamily,
  fontSize,
  fontWeight,
  lineHeight,
  letterSpacing,
  typography,
  typographyVariants,

  // Borders
  borderRadius,
  radius,
  borderWidth,
  borderStyle,
  borders,

  // Shadows & Elevation
  shadows,
  boxShadows,
  elevation,

  // Animations
  duration,
  easing,
  transitions,
  delay,
  animations,
  springs,

  // Breakpoints
  breakpoints,
  mediaQueries,
  mediaQueriesMax,
  mediaQueriesRange,
  devices,
  containerMaxWidths,

  // Columns & Grid System
  columns,

  // Gradients
  gradients,

  // Dividers
  dividers,
  dividerStyles,
  dividerColor,
  dividerWidth,
  dividerGap,

  // Background Patterns
  patterns,
  backgroundGradients,
  blocksPattern,
  netPattern,
  patternOpacity,
} as const

export type Tokens = typeof tokens
