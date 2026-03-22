/**
 * Typography tokens aligned with Apple iOS/iPadOS 26 HIG type scale
 *
 * Font family: Roboto (cross-platform)
 * Type scale based on Apple's SF Pro "Large (Default)" Dynamic Type size
 *
 * Mapping:
 *   h1 = Large Title (34), h2 = Title 1 (28), h3 = Title 2 (22),
 *   h4 = Title 3 (20), h5 = Headline (17), h6 = Subheadline (15)
 *   paragraphL = Body (17), paragraphM = Callout (16),
 *   paragraphS = Footnote (13), caption = Caption 1 (12)
 *
 * Weights: Regular (400), Medium (500), Semi Bold (600), Bold (700)
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
 * Based on Apple iOS/iPadOS 26 HIG "Large (Default)" Dynamic Type
 */
export const fontSize = {
  // Text sizes (Apple equivalents)
  xxs: 11, // Caption 2
  xs: 12, // Caption 1
  sm: 13, // Footnote
  md: 16, // Callout (body base)
  lg: 17, // Body
  xl: 20, // Title 3
  '2xl': 22, // Title 2

  // Heading sizes (Apple equivalents)
  h6: 15, // Subheadline
  h5: 17, // Headline
  h4: 20, // Title 3
  h3: 22, // Title 2
  h2: 28, // Title 1
  h1: 34, // Large Title
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
 * Based on Apple iOS/iPadOS 26 HIG
 */
export const lineHeight = {
  // Text line heights (Apple equivalents)
  xxs: 13, // Caption 2
  xs: 16, // Caption 1
  sm: 18, // Footnote
  md: 21, // Callout
  lg: 22, // Body
  xl: 25, // Title 3

  // Heading line heights (Apple equivalents)
  h6: 20, // Subheadline
  h5: 22, // Headline
  h4: 25, // Title 3
  h3: 28, // Title 2
  h2: 34, // Title 1
  h1: 41, // Large Title
} as const

/**
 * Letter spacing
 * Per-size values from Apple iOS/iPadOS 26 HIG (exact pixel values)
 * React Native uses numbers (pixels), not em units
 */
export const letterSpacing = {
  // Per-size values (Apple HIG exact)
  largeTitle: 0.4,
  title1: 0.38,
  title2: -0.26,
  title3: -0.45,
  headline: -0.43,
  body: -0.43,
  callout: -0.31,
  subheadline: -0.23,
  footnote: -0.08,
  caption1: 0,
  caption2: 0.06,

  // Legacy aliases (backward compat)
  tighter: -0.45,
  tight: -0.26,
  normal: 0,
  wide: 0.38,
  wider: 0.4,
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
 * Complete typography variants aligned with Apple iOS/iPadOS 26 HIG
 */
export const typographyVariants = {
  // H1 - Large Title (Size: 34 / Line-height: 41 / Letter spacing: 0.4)
  h1Bold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h1,
    letterSpacing: letterSpacing.largeTitle,
  },
  h1SemiBold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h1,
    letterSpacing: letterSpacing.largeTitle,
  },
  h1Medium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.h1,
    letterSpacing: letterSpacing.largeTitle,
  },
  h1Regular: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h1,
    letterSpacing: letterSpacing.largeTitle,
  },
  h1Serif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h1,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h1,
    letterSpacing: letterSpacing.largeTitle,
  },

  // H2 - Title 1 (Size: 28 / Line-height: 34 / Letter spacing: 0.38)
  h2Bold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacing.title1,
  },
  h2SemiBold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacing.title1,
  },
  h2Medium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacing.title1,
  },
  h2Regular: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacing.title1,
  },
  h2Serif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h2,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h2,
    letterSpacing: letterSpacing.title1,
  },

  // H3 - Title 2 (Size: 22 / Line-height: 28 / Letter spacing: -0.26)
  h3Bold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h3,
    letterSpacing: letterSpacing.title2,
  },
  h3SemiBold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h3,
    letterSpacing: letterSpacing.title2,
  },
  h3Medium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.h3,
    letterSpacing: letterSpacing.title2,
  },
  h3Regular: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h3,
    letterSpacing: letterSpacing.title2,
  },
  h3Serif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h3,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h3,
    letterSpacing: letterSpacing.title2,
  },

  // H4 - Title 3 (Size: 20 / Line-height: 25 / Letter spacing: -0.45)
  h4Bold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h4,
    letterSpacing: letterSpacing.title3,
  },
  h4SemiBold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h4,
    letterSpacing: letterSpacing.title3,
  },
  h4Medium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.h4,
    letterSpacing: letterSpacing.title3,
  },
  h4Regular: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h4,
    letterSpacing: letterSpacing.title3,
  },
  h4Serif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h4,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h4,
    letterSpacing: letterSpacing.title3,
  },

  // H5 - Headline (Size: 17 / Line-height: 22 / Letter spacing: -0.43)
  h5Bold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h5,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h5,
    letterSpacing: letterSpacing.headline,
  },
  h5SemiBold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h5,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h5,
    letterSpacing: letterSpacing.headline,
  },
  h5Medium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h5,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.h5,
    letterSpacing: letterSpacing.headline,
  },
  h5Regular: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h5,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h5,
    letterSpacing: letterSpacing.headline,
  },
  h5Serif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h5,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h5,
    letterSpacing: letterSpacing.headline,
  },

  // H6 - Subheadline (Size: 15 / Line-height: 20 / Letter spacing: -0.23)
  h6Bold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h6,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.h6,
    letterSpacing: letterSpacing.subheadline,
  },
  h6SemiBold: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h6,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.h6,
    letterSpacing: letterSpacing.subheadline,
  },
  h6Medium: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h6,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.h6,
    letterSpacing: letterSpacing.subheadline,
  },
  h6Regular: {
    fontFamily: fontFamily.heading,
    fontSize: fontSize.h6,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h6,
    letterSpacing: letterSpacing.subheadline,
  },
  h6Serif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.h6,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.h6,
    letterSpacing: letterSpacing.subheadline,
  },

  // Subtitle - Title 3 size (Size: 20 / Line-height: 25 / Letter spacing: -0.45)
  subtitleBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.xl,
    letterSpacing: letterSpacing.title3,
  },
  subtitleSemiBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.xl,
    letterSpacing: letterSpacing.title3,
  },
  subtitleMedium: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.xl,
    letterSpacing: letterSpacing.title3,
  },
  subtitleRegular: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xl,
    letterSpacing: letterSpacing.title3,
  },
  subtitleSerif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xl,
    letterSpacing: letterSpacing.title3,
  },

  // Paragraph L - Body (Size: 17 / Line-height: 22 / Letter spacing: -0.43)
  paragraphLBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.lg,
    letterSpacing: letterSpacing.body,
  },
  paragraphLSemiBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.lg,
    letterSpacing: letterSpacing.body,
  },
  paragraphLMedium: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.lg,
    letterSpacing: letterSpacing.body,
  },
  paragraphLRegular: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.lg,
    letterSpacing: letterSpacing.body,
  },
  paragraphLSerif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.lg,
    letterSpacing: letterSpacing.body,
  },

  // Paragraph M - Callout (Size: 16 / Line-height: 21 / Letter spacing: -0.31)
  paragraphMBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.md,
    letterSpacing: letterSpacing.callout,
  },
  paragraphMSemiBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.md,
    letterSpacing: letterSpacing.callout,
  },
  paragraphMMedium: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.md,
    letterSpacing: letterSpacing.callout,
  },
  paragraphMRegular: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.md,
    letterSpacing: letterSpacing.callout,
  },
  paragraphMSerif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.md,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.md,
    letterSpacing: letterSpacing.callout,
  },

  // Paragraph S - Footnote (Size: 13 / Line-height: 18 / Letter spacing: -0.08)
  paragraphSBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.sm,
    letterSpacing: letterSpacing.footnote,
  },
  paragraphSSemiBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.sm,
    letterSpacing: letterSpacing.footnote,
  },
  paragraphSMedium: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.sm,
    letterSpacing: letterSpacing.footnote,
  },
  paragraphSRegular: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.sm,
    letterSpacing: letterSpacing.footnote,
  },
  paragraphSSerif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.sm,
    letterSpacing: letterSpacing.footnote,
  },

  // Caption - Caption 1 (Size: 12 / Line-height: 16 / Letter spacing: 0)
  captionBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    lineHeight: lineHeight.xs,
    letterSpacing: letterSpacing.caption1,
  },
  captionSemiBold: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
    lineHeight: lineHeight.xs,
    letterSpacing: letterSpacing.caption1,
  },
  captionMedium: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    lineHeight: lineHeight.xs,
    letterSpacing: letterSpacing.caption1,
  },
  captionRegular: {
    fontFamily: fontFamily.body,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xs,
    letterSpacing: letterSpacing.caption1,
  },
  captionSerif: {
    fontFamily: fontFamily.serif,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.regular,
    lineHeight: lineHeight.xs,
    letterSpacing: letterSpacing.caption1,
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
