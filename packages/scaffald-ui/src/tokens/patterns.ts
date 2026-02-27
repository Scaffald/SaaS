/**
 * Background pattern tokens mapped from Figma Forsured Design System
 *
 * Background patterns are decorative visual elements used to add texture and visual interest
 * to backgrounds while maintaining readability. All patterns support opacity settings.
 *
 * Pattern Types:
 * - Blocks: Grid-based block pattern with alternating colors
 * - Net: Mesh/net pattern with intersecting lines
 *
 * @example
 * ```typescript
 * import { patterns } from '@scaffald/ui/tokens'
 *
 * // Use pattern styles
 * <div style={{ backgroundImage: patterns.blocks.css }} />
 * ```
 */

import { colors } from './colors'
import { spacing } from './spacing'
import { borderRadius } from './borders'

/**
 * Pattern opacity
 * Standard opacity for background patterns (60% = 0.6)
 */
export const patternOpacity = {
  default: 0.6, // 60% opacity - standard pattern visibility
  subtle: 0.3, // 30% opacity - very subtle pattern
  medium: 0.5, // 50% opacity - medium visibility
  strong: 0.8, // 80% opacity - strong pattern visibility
} as const

/**
 * Blocks Pattern
 * Grid-based pattern with alternating colored blocks
 * - Block size: 40px × 40px
 * - Gap: 4px between blocks
 * - Border radius: 8px (radius-s)
 * - Colors: Alternating between bg-200 (#e4e7ec) and bg-100 (#f2f4f7)
 * - Opacity: 60% (0.6)
 */
export const blocksPattern = {
  blockSize: 40, // 40px × 40px blocks
  gap: spacing[4], // 4px gap between blocks
  borderRadius: borderRadius.s, // 8px border radius
  colors: {
    primary: colors.bg.light.emphasis, // Base/200: #e4e7ec
    secondary: colors.bg.light.muted, // Base/100: #f2f4f7
  },
  opacity: patternOpacity.default, // 60% opacity
  // CSS gradient pattern for blocks (alternating grid)
  css: `repeating-linear-gradient(
    0deg,
    ${colors.bg.light.emphasis} 0px,
    ${colors.bg.light.emphasis} ${40}px,
    transparent ${40}px,
    transparent ${44}px
  ),
  repeating-linear-gradient(
    90deg,
    ${colors.bg.light.emphasis} 0px,
    ${colors.bg.light.emphasis} ${40}px,
    transparent ${40}px,
    transparent ${44}px
  )`,
} as const

/**
 * Net Pattern
 * Mesh/net pattern with intersecting lines
 * - Stroke color: Base/300 (#ced2da)
 * - Opacity: 60% (0.6)
 * - Creates a grid-like mesh effect
 */
export const netPattern = {
  strokeColor: colors.gray[300], // Base/300: #ced2da
  opacity: patternOpacity.default, // 60% opacity
  strokeWidth: 1, // 1px stroke width
  // CSS pattern for net (crosshatch)
  // Using rgba for opacity: #ced2da with 60% opacity = rgba(206, 210, 218, 0.6)
  css: `repeating-linear-gradient(
    0deg,
    transparent,
    transparent 10px,
    rgba(206, 210, 218, ${patternOpacity.default}) 10px,
    rgba(206, 210, 218, ${patternOpacity.default}) 11px
  ),
  repeating-linear-gradient(
    90deg,
    transparent,
    transparent 10px,
    rgba(206, 210, 218, ${patternOpacity.default}) 10px,
    rgba(206, 210, 218, ${patternOpacity.default}) 11px
  )`,
} as const

/**
 * Background patterns organized by type
 */
export const patterns = {
  blocks: blocksPattern,
  net: netPattern,
} as const

/**
 * Background gradient patterns (from Figma)
 * Radial gradients for background decoration
 * Used in Box 01, Box 02, Box 03, Wide 01 variants
 */
export const backgroundGradients = {
  // Base Gray Radial Gradient
  // Used for subtle background decoration
  grayRadial: {
    type: 'radial' as const,
    // Note: Exact gradient values should be extracted from Figma gradients
    // Placeholder structure for radial gradients
    center: 'center' as const,
    colors: [colors.gray[100], 'transparent'],
    css: `radial-gradient(circle at center, ${colors.gray[100]} 0%, transparent 100%)`,
  },

  // Primary Brand Radial Gradient (Alpha)
  // Used for brand-colored background decoration
  primaryRadial: {
    type: 'radial' as const,
    center: 'center' as const,
    colors: [colors.primary[100], 'transparent'],
    css: `radial-gradient(circle at center, ${colors.primary[100]} 0%, transparent 100%)`,
  },
} as const

export type PatternToken = keyof typeof patterns
export type PatternOpacityToken = keyof typeof patternOpacity
export type BackgroundGradientToken = keyof typeof backgroundGradients
