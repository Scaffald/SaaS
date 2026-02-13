/**
 * Typography tokens mapped from Figma Forsured Design System
 *
 * Font family: Roboto
 * Styles from Figma:
 * - H4, H5, H6 (headings)
 * - Paragraph S, M, L (body text)
 * Weights: Regular (400), Medium (500), Semi Bold (600)
 */

/**
 * Font family definitions
 */
export const fontFamily = {
  heading: 'Roboto',
  body: 'Roboto',
  serif: 'Roboto Serif',
  mono: 'Roboto Mono',
  sans: 'Roboto',
} as const

/**
 * Font size scale
 * Mapped from Figma Forsured Design System
 */
export const fontSize = {
  // Paragraph sizes
  xs: 12, // Extra small
  sm: 14, // Paragraph S
  md: 16, // Paragraph M (base)
  lg: 18, // Paragraph L
  xl: 20, // Extra large
  '2xl': 22,

  // Heading sizes
  h6: 24, // H6
  h5: 28, // H5
  h4: 36, // H4
  h3: 48,
  h2: 60,
  h1: 72,
} as const

/**
 * Font weight scale
 */
export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
} as const

/**
 * Line height scale
 * Mapped from Figma Forsured Design System
 */
export const lineHeight = {
  // Paragraph line heights
  xs: 16,
  sm: 20, // Paragraph S line height
  md: 24, // Paragraph M line height
  lg: 28, // Paragraph L line height
  xl: 32,

  // Heading line heights
  h6: 32, // H6 line height
  h5: 36, // H5 line height
  h4: 44, // H4 line height
  h3: 56,
  h2: 68,
  h1: 80,
} as const

/**
 * Letter spacing
 * Figma uses percentages: -2% for H1-H2, -1% for H3-H6, 0 for body text
 * Converted to numeric values for React Native compatibility
 * Note: React Native uses numbers (pixels), not em units
 */
export const letterSpacing = {
  tighter: -1.5, // -2% approximation for H1-H2 headings
  tight: -0.5, // -1% approximation for H3-H6 headings
  normal: 0, // 0 for body text
  wide: 0.25, // 0.5% approximation for emphasis
  wider: 0.5, // 1% approximation for wider spacing
} as const

/**
 * Text decoration
 */
export const textDecoration = {
  none: 'none',
  underline: 'underline',
  lineThrough: 'line-through',
} as const

/**
 * Text transform
 */
export const textTransform = {
  none: 'none',
  uppercase: 'uppercase',
  lowercase: 'lowercase',
  capitalize: 'capitalize',
} as const

/**
 * Complete typography variants matching Figma definitions
 * All variants from Figma Forsured Design System
 */
export const typographyVariants = {
  // H1 - Heading (Size: 72 / Line-height: 80 / Letter spacing: -2%)
  h1Bold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h1,
    letterSpacing: letterSpacing.tighter, // -2%
  },
  h1SemiBold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h1,
    letterSpacing: letterSpacing.tighter, // -2%
  },
  h1Medium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.h1,
    letterSpacing: letterSpacing.tighter, // -2%
  },
  h1Regular: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h1,
    letterSpacing: letterSpacing.tighter, // -2%
  },
  h1Serif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h1,
    letterSpacing: letterSpacing.tighter, // -2%
  },

  // H2 - Heading (Size: 60 / Line-height: 72 / Letter spacing: -2%)
  h2Bold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacing.tighter, // -2%
  },
  h2SemiBold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacing.tighter, // -2%
  },
  h2Medium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacing.tighter, // -2%
  },
  h2Regular: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacing.tighter, // -2%
  },
  h2Serif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacing.tighter, // -2%
  },

  // H3 - Heading (Size: 48 / Line-height: 60 / Letter spacing: -1%)
  h3Bold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h3,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h3SemiBold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h3,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h3Medium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.h3,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h3Regular: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h3,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h3Serif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h3,
    letterSpacing: letterSpacing.tight, // -1%
  },

  // H4 - Heading (Size: 36 / Line-height: 44 / Letter spacing: -1%)
  h4Bold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h4,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h4SemiBold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h4,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h4Medium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.h4,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h4Regular: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h4,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h4Serif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h4,
    letterSpacing: letterSpacing.tight, // -1%
  },

  // H5 - Heading (Size: 28 / Line-height: 36 / Letter spacing: -1%)
  h5Bold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h5,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h5,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h5SemiBold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h5,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h5,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h5Medium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h5,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.h5,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h5Regular: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h5,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h5,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h5Serif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h5,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h5,
    letterSpacing: letterSpacing.tight, // -1%
  },

  // H6 - Heading (Size: 24 / Line-height: 32 / Letter spacing: -1%)
  h6Bold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h6,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h6,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h6SemiBold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h6,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h6,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h6Medium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h6,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.h6,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h6Regular: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h6,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h6,
    letterSpacing: letterSpacing.tight, // -1%
  },
  h6Serif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h6,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h6,
    letterSpacing: letterSpacing.tight, // -1%
  },

  // Subtitle (Size: 20 / Line-height: 28 / Letter spacing: 0)
  subtitleBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xl, // 20
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.lg, // 28
    letterSpacing: letterSpacing.normal, // 0
  },
  subtitleSemiBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xl, // 20
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.lg, // 28
    letterSpacing: letterSpacing.normal, // 0
  },
  subtitleMedium: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xl, // 20
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.lg, // 28
    letterSpacing: letterSpacing.normal, // 0
  },
  subtitleRegular: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xl, // 20
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.lg, // 28
    letterSpacing: letterSpacing.normal, // 0
  },
  subtitleSerif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.xl, // 20
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.lg, // 28
    letterSpacing: letterSpacing.normal, // 0
  },

  // Paragraph L (Size: 18 / Line-height: 28 / Letter spacing: 0)
  paragraphLBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.lg,
    letterSpacing: letterSpacing.normal,
  },
  paragraphLSemiBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.lg,
    letterSpacing: letterSpacing.normal,
  },
  paragraphLMedium: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.lg,
    letterSpacing: letterSpacing.normal,
  },
  paragraphLRegular: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.lg,
    letterSpacing: letterSpacing.normal,
  },
  paragraphLSerif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.lg,
    letterSpacing: letterSpacing.normal,
  },

  // Paragraph M (Size: 16 / Line-height: 24 / Letter spacing: 0)
  paragraphMBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.md,
    letterSpacing: letterSpacing.normal,
  },
  paragraphMSemiBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.md,
    letterSpacing: letterSpacing.normal,
  },
  paragraphMMedium: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.md,
    letterSpacing: letterSpacing.normal,
  },
  paragraphMRegular: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.md,
    letterSpacing: letterSpacing.normal,
  },
  paragraphMSerif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.md,
    letterSpacing: letterSpacing.normal,
  },

  // Paragraph S (Size: 14 / Line-height: 20 / Letter spacing: 0)
  paragraphSBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.sm,
    letterSpacing: letterSpacing.normal,
  },
  paragraphSSemiBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.sm,
    letterSpacing: letterSpacing.normal,
  },
  paragraphSMedium: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.sm,
    letterSpacing: letterSpacing.normal,
  },
  paragraphSRegular: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.sm,
    letterSpacing: letterSpacing.normal,
  },
  paragraphSSerif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.sm,
    letterSpacing: letterSpacing.normal,
  },

  // Caption (Size: 12 / Line-height: 16 / Letter spacing: 0)
  captionBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.xs, // 16
    letterSpacing: letterSpacing.normal,
  },
  captionSemiBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.xs, // 16
    letterSpacing: letterSpacing.normal,
  },
  captionMedium: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.xs, // 16
    letterSpacing: letterSpacing.normal,
  },
  captionRegular: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xs, // 16
    letterSpacing: letterSpacing.normal,
  },
  captionSerif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xs, // 16
    letterSpacing: letterSpacing.normal,
  },
} as const

/**
 * Simplified typography scale for common use
 */
export const typography = {
  // Heading shortcuts
  h1: typographyVariants.h1Bold,
  h2: typographyVariants.h2Bold,
  h3: typographyVariants.h3SemiBold,
  h4: typographyVariants.h4SemiBold,
  h5: typographyVariants.h5SemiBold,
  h6: typographyVariants.h6Medium,

  // Subtitle text
  subtitle: typographyVariants.subtitleRegular,
  subtitleMedium: typographyVariants.subtitleMedium,
  subtitleBold: typographyVariants.subtitleSemiBold,

  // Body shortcuts
  body: typographyVariants.paragraphMRegular,
  bodyMedium: typographyVariants.paragraphMMedium,
  bodyBold: typographyVariants.paragraphMSemiBold,

  // Small text
  small: typographyVariants.paragraphSRegular,
  smallMedium: typographyVariants.paragraphSMedium,
  smallBold: typographyVariants.paragraphSSemiBold,

  // Large text
  large: typographyVariants.paragraphLRegular,
  largeMedium: typographyVariants.paragraphLMedium,
  largeBold: typographyVariants.paragraphLSemiBold,

  // Caption text
  caption: typographyVariants.captionRegular,
  captionMedium: typographyVariants.captionMedium,
  captionBold: typographyVariants.captionBold,

  // Aliases for direct variant access (for backward compatibility)
  paragraphLMedium: typographyVariants.paragraphLMedium,
  paragraphLSemiBold: typographyVariants.paragraphLSemiBold,
  paragraphMMedium: typographyVariants.paragraphMMedium,
  paragraphSMedium: typographyVariants.paragraphSMedium,
  paragraphSRegular: typographyVariants.paragraphSRegular,
  captionRegular: typographyVariants.captionRegular,
  h6Medium: typographyVariants.h6Medium,
} as const

export type FontFamilyToken = keyof typeof fontFamily
export type FontSizeToken = keyof typeof fontSize
export type FontWeightToken = keyof typeof fontWeight
export type LineHeightToken = keyof typeof lineHeight
export type LetterSpacingToken = keyof typeof letterSpacing
export type TypographyVariant = keyof typeof typographyVariants
