/**
 * Spacing utilities
 * Re-exports spacing tokens from beyond-ui with app-specific defaults
 */

import { spacing, gap, padding } from '@unicornlove/beyond-ui/tokens'

// Re-export all spacing tokens
export { spacing, gap, padding }

/**
 * Common spacing values used throughout the app
 * These provide semantic names for frequently used spacing values
 */
export const appSpacing = {
  /** Tiny spacing - 4px */
  tiny: spacing.xs,
  /** Small spacing - 8px */
  small: spacing.sm,
  /** Medium spacing - 16px */
  medium: spacing.lg,
  /** Large spacing - 24px */
  large: spacing['2xl'],
  /** Extra large spacing - 32px */
  xlarge: spacing['4xl'],

  /** Page padding (responsive) */
  page: {
    base: 16,
    md: 24,
    lg: 32,
  },

  /** Section gap (responsive) */
  section: {
    base: 16,
    md: 20,
    lg: 24,
  },

  /** Card padding (responsive) */
  card: {
    base: 16,
    md: 20,
    lg: 24,
  },

  /** Form field gap (responsive) */
  formField: {
    base: 12,
    md: 16,
  },
} as const

/**
 * Common gap values
 */
export const appGap = {
  /** Tiny gap - 4px */
  tiny: gap.xs,
  /** Small gap - 8px */
  small: gap.sm,
  /** Medium gap - 16px */
  medium: gap.lg,
  /** Large gap - 24px */
  large: gap['2xl'],
} as const

/**
 * Common padding values
 */
export const appPadding = {
  /** Tiny padding - 4px */
  tiny: padding.xs,
  /** Small padding - 8px */
  small: padding.sm,
  /** Medium padding - 16px */
  medium: padding.lg,
  /** Large padding - 24px */
  large: padding['2xl'],
} as const
