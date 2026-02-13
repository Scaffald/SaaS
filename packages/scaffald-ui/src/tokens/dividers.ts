/**
 * Divider tokens mapped from Figma Forsured Design System
 *
 * Dividers are visual separators used to organize content and create visual hierarchy.
 * All dividers use border color from the design system for consistency.
 *
 * Variants:
 * - Default: Simple horizontal line divider
 * - Text: Divider with text label in the middle
 * - Action: Divider with action button in the middle
 * - Group Button: Divider with group buttons in the middle
 *
 * @example
 * ```typescript
 * import { dividers } from '@scaffald/ui/tokens'
 *
 * // Use divider styles
 * <div style={{ borderTop: `1px solid ${dividers.color}` }} />
 * ```
 */

import { colors } from './colors'
import { spacing } from './spacing'

/**
 * Divider color
 * Uses border-200 color from Figma: #e4e7ec
 */
export const dividerColor = colors.border.light.default // Base/200 - #e4e7ec

/**
 * Divider width/thickness
 * Standard divider is 1px
 */
export const dividerWidth = {
  thin: 1, // Standard divider width
  medium: 2, // Thicker divider for emphasis
  thick: 3, // Extra thick divider
} as const

/**
 * Divider spacing
 * Gap between divider segments and content (e.g., text, buttons)
 */
export const dividerGap = spacing[8] // 8px gap between divider and content

/**
 * Divider variants
 * Different divider configurations based on usage
 */
export const dividers = {
  // Default horizontal divider
  default: {
    color: dividerColor,
    width: dividerWidth.thin,
    orientation: 'horizontal' as const,
  },

  // Divider with text label
  text: {
    color: dividerColor,
    width: dividerWidth.thin,
    orientation: 'horizontal' as const,
    gap: dividerGap, // 8px gap between divider segments and text
    textColor: colors.text.light.tertiary, // Text/text-tertiary: #637083
  },

  // Divider with action button
  action: {
    color: dividerColor,
    width: dividerWidth.thin,
    orientation: 'horizontal' as const,
    gap: dividerGap, // 8px gap between divider segments and button
  },

  // Divider with group buttons
  groupButton: {
    color: dividerColor,
    width: dividerWidth.thin,
    orientation: 'horizontal' as const,
    gap: dividerGap, // 8px gap between divider segments and button group
  },

  // Vertical divider (for vertical layouts)
  vertical: {
    color: dividerColor,
    width: dividerWidth.thin,
    orientation: 'vertical' as const,
  },
} as const

/**
 * Divider styles for CSS/styled components
 * Ready-to-use styles for different divider variants
 */
export const dividerStyles = {
  // Default horizontal divider style
  horizontal: {
    borderTop: `1px solid ${dividerColor}`,
    borderBottom: 'none',
    borderLeft: 'none',
    borderRight: 'none',
  },

  // Vertical divider style
  vertical: {
    borderLeft: `1px solid ${dividerColor}`,
    borderRight: 'none',
    borderTop: 'none',
    borderBottom: 'none',
  },

  // Thick horizontal divider
  horizontalThick: {
    borderTop: `2px solid ${dividerColor}`,
    borderBottom: 'none',
    borderLeft: 'none',
    borderRight: 'none',
  },

  // Thick vertical divider
  verticalThick: {
    borderLeft: `2px solid ${dividerColor}`,
    borderRight: 'none',
    borderTop: 'none',
    borderBottom: 'none',
  },
} as const

export type DividerToken = keyof typeof dividers
export type DividerWidthToken = keyof typeof dividerWidth
export type DividerStyleToken = keyof typeof dividerStyles
