/**
 * Dynamic Type scaling based on Apple iOS/iPadOS 26 HIG
 *
 * Provides font size scaling across 7 standard sizes + 5 accessibility sizes.
 * On iOS, maps to UIContentSizeCategory via PixelRatio.getFontScale().
 * On web, can be driven by user preference or media queries.
 *
 * All values are font sizes in pixels at each Dynamic Type category.
 */

/**
 * Standard Dynamic Type size categories
 */
export type DynamicTypeCategory =
  | 'xSmall'
  | 'small'
  | 'medium'
  | 'large' // Default
  | 'xLarge'
  | 'xxLarge'
  | 'xxxLarge'

/**
 * Accessibility Dynamic Type size categories
 */
export type DynamicTypeAccessibilityCategory =
  | 'ax1'
  | 'ax2'
  | 'ax3'
  | 'ax4'
  | 'ax5'

/**
 * All Dynamic Type size categories
 */
export type DynamicTypeSize = DynamicTypeCategory | DynamicTypeAccessibilityCategory

/**
 * Typography style names that map to our heading/paragraph/caption system
 */
export type TypographyStyleName =
  | 'h1' // Large Title
  | 'h2' // Title 1
  | 'h3' // Title 2
  | 'h4' // Title 3
  | 'h5' // Headline
  | 'h6' // Subheadline
  | 'paragraphL' // Body
  | 'paragraphM' // Callout
  | 'paragraphS' // Footnote
  | 'caption' // Caption 1
  | 'caption2' // Caption 2

type DynamicTypeScaleEntry = Record<DynamicTypeSize, number>

/**
 * Font size for each typography style at each Dynamic Type category.
 * Values from Apple iOS/iPadOS 26 HIG.
 *
 * "large" is the default/base size matching our fontSize tokens.
 */
export const dynamicTypeFontSize: Record<TypographyStyleName, DynamicTypeScaleEntry> = {
  // h1 = Large Title
  h1: {
    xSmall: 31, small: 32, medium: 33, large: 34,
    xLarge: 36, xxLarge: 38, xxxLarge: 40,
    ax1: 44, ax2: 48, ax3: 52, ax4: 56, ax5: 60,
  },
  // h2 = Title 1
  h2: {
    xSmall: 25, small: 26, medium: 27, large: 28,
    xLarge: 30, xxLarge: 32, xxxLarge: 34,
    ax1: 38, ax2: 43, ax3: 48, ax4: 53, ax5: 58,
  },
  // h3 = Title 2
  h3: {
    xSmall: 19, small: 20, medium: 21, large: 22,
    xLarge: 24, xxLarge: 26, xxxLarge: 28,
    ax1: 34, ax2: 39, ax3: 44, ax4: 50, ax5: 56,
  },
  // h4 = Title 3
  h4: {
    xSmall: 17, small: 18, medium: 19, large: 20,
    xLarge: 22, xxLarge: 24, xxxLarge: 26,
    ax1: 31, ax2: 37, ax3: 43, ax4: 44, ax5: 51,
  },
  // h5 = Headline
  h5: {
    xSmall: 14, small: 15, medium: 16, large: 17,
    xLarge: 19, xxLarge: 21, xxxLarge: 23,
    ax1: 28, ax2: 33, ax3: 40, ax4: 47, ax5: 53,
  },
  // h6 = Subheadline (same scale as paragraphM/Callout shifted down)
  h6: {
    xSmall: 12, small: 13, medium: 14, large: 15,
    xLarge: 17, xxLarge: 19, xxxLarge: 21,
    ax1: 25, ax2: 30, ax3: 36, ax4: 42, ax5: 49,
  },
  // paragraphL = Body
  paragraphL: {
    xSmall: 14, small: 15, medium: 16, large: 17,
    xLarge: 19, xxLarge: 21, xxxLarge: 23,
    ax1: 28, ax2: 33, ax3: 40, ax4: 47, ax5: 53,
  },
  // paragraphM = Callout
  paragraphM: {
    xSmall: 13, small: 14, medium: 15, large: 16,
    xLarge: 18, xxLarge: 20, xxxLarge: 22,
    ax1: 26, ax2: 32, ax3: 38, ax4: 44, ax5: 51,
  },
  // paragraphS = Footnote
  paragraphS: {
    xSmall: 12, small: 12, medium: 12, large: 13,
    xLarge: 15, xxLarge: 17, xxxLarge: 19,
    ax1: 23, ax2: 27, ax3: 33, ax4: 38, ax5: 44,
  },
  // caption = Caption 1
  caption: {
    xSmall: 11, small: 11, medium: 11, large: 12,
    xLarge: 14, xxLarge: 16, xxxLarge: 18,
    ax1: 22, ax2: 26, ax3: 32, ax4: 37, ax5: 43,
  },
  // caption2 = Caption 2
  caption2: {
    xSmall: 11, small: 11, medium: 11, large: 11,
    xLarge: 13, xxLarge: 15, xxxLarge: 17,
    ax1: 20, ax2: 25, ax3: 30, ax4: 35, ax5: 40,
  },
} as const

/**
 * Line height for each typography style at each Dynamic Type category.
 * Derived from Apple HIG line height ratios.
 */
export const dynamicTypeLineHeight: Record<TypographyStyleName, DynamicTypeScaleEntry> = {
  h1: {
    xSmall: 38, small: 39, medium: 40, large: 41,
    xLarge: 43, xxLarge: 46, xxxLarge: 48,
    ax1: 52, ax2: 57, ax3: 61, ax4: 66, ax5: 70,
  },
  h2: {
    xSmall: 31, small: 32, medium: 33, large: 34,
    xLarge: 36, xxLarge: 39, xxxLarge: 41,
    ax1: 46, ax2: 51, ax3: 57, ax4: 62, ax5: 68,
  },
  h3: {
    xSmall: 24, small: 25, medium: 26, large: 28,
    xLarge: 30, xxLarge: 32, xxxLarge: 34,
    ax1: 41, ax2: 47, ax3: 52, ax4: 59, ax5: 66,
  },
  h4: {
    xSmall: 22, small: 23, medium: 24, large: 25,
    xLarge: 28, xxLarge: 30, xxxLarge: 32,
    ax1: 38, ax2: 44, ax3: 51, ax4: 51, ax5: 60,
  },
  h5: {
    xSmall: 19, small: 20, medium: 21, large: 22,
    xLarge: 24, xxLarge: 26, xxxLarge: 29,
    ax1: 34, ax2: 40, ax3: 48, ax4: 56, ax5: 62,
  },
  h6: {
    xSmall: 16, small: 18, medium: 19, large: 20,
    xLarge: 22, xxLarge: 24, xxxLarge: 28,
    ax1: 30, ax2: 36, ax3: 43, ax4: 50, ax5: 58,
  },
  paragraphL: {
    xSmall: 19, small: 20, medium: 21, large: 22,
    xLarge: 24, xxLarge: 26, xxxLarge: 29,
    ax1: 34, ax2: 40, ax3: 48, ax4: 56, ax5: 62,
  },
  paragraphM: {
    xSmall: 18, small: 19, medium: 20, large: 21,
    xLarge: 23, xxLarge: 24, xxxLarge: 28,
    ax1: 32, ax2: 38, ax3: 46, ax4: 52, ax5: 60,
  },
  paragraphS: {
    xSmall: 16, small: 16, medium: 16, large: 18,
    xLarge: 20, xxLarge: 22, xxxLarge: 24,
    ax1: 29, ax2: 33, ax3: 40, ax4: 46, ax5: 52,
  },
  caption: {
    xSmall: 13, small: 13, medium: 13, large: 16,
    xLarge: 19, xxLarge: 21, xxxLarge: 23,
    ax1: 28, ax2: 32, ax3: 39, ax4: 44, ax5: 51,
  },
  caption2: {
    xSmall: 13, small: 13, medium: 13, large: 13,
    xLarge: 18, xxLarge: 20, xxxLarge: 22,
    ax1: 25, ax2: 30, ax3: 36, ax4: 42, ax5: 48,
  },
} as const

/**
 * Map iOS font scale factor to a Dynamic Type category.
 *
 * On iOS, `PixelRatio.getFontScale()` returns a multiplier:
 *   0.823 = xSmall, 0.882 = Small, 0.941 = Medium, 1.0 = Large (default),
 *   1.118 = xLarge, 1.235 = xxLarge, 1.353 = xxxLarge,
 *   then AX sizes go higher.
 */
export function fontScaleToCategory(scale: number): DynamicTypeSize {
  if (scale <= 0.85) return 'xSmall'
  if (scale <= 0.91) return 'small'
  if (scale <= 0.97) return 'medium'
  if (scale <= 1.06) return 'large'
  if (scale <= 1.18) return 'xLarge'
  if (scale <= 1.29) return 'xxLarge'
  if (scale <= 1.40) return 'xxxLarge'
  if (scale <= 1.55) return 'ax1'
  if (scale <= 1.75) return 'ax2'
  if (scale <= 2.00) return 'ax3'
  if (scale <= 2.35) return 'ax4'
  return 'ax5'
}

/**
 * Get scaled font size for a typography style at a given Dynamic Type category.
 */
export function getScaledFontSize(
  style: TypographyStyleName,
  category: DynamicTypeSize = 'large'
): number {
  return dynamicTypeFontSize[style][category]
}

/**
 * Get scaled line height for a typography style at a given Dynamic Type category.
 */
export function getScaledLineHeight(
  style: TypographyStyleName,
  category: DynamicTypeSize = 'large'
): number {
  return dynamicTypeLineHeight[style][category]
}
