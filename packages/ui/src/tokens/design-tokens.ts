/**
 * Scaffald Design Tokens
 *
 * Centralized design system tokens for consistent styling across the platform.
 * Use these tokens instead of hardcoded values for maintainability and consistency.
 *
 * @example
 * ```tsx
 * import { cardShadows, spacing, borderRadius } from '@/tokens/design-tokens'
 *
 * <Card
 *   boxShadow={cardShadows.light}
 *   p={spacing.md}
 *   rounded={borderRadius.md}
 * />
 * ```
 */

/**
 * Card Shadow System
 *
 * Professional shadow definitions for cards and elevated surfaces.
 * Use these instead of inline shadow styles for consistency.
 *
 * @example
 * ```tsx
 * // Light theme card
 * <Card boxShadow={isDark ? cardShadows.dark : cardShadows.light} />
 *
 * // Elevated surface
 * <Card boxShadow={isDark ? cardShadows.dark : cardShadows.elevated} />
 * ```
 */
export const cardShadows = {
  // Light theme card shadow - subtle depth
  light: 'rgba(0,0,0,0.02) 0px 1px 2px, rgba(0,0,0,0.04) 0px 2px 8px',
  lightHover: 'rgba(0,0,0,0.04) 0px 2px 4px, rgba(0,0,0,0.06) 0px 4px 12px',
  lightPress: 'rgba(0,0,0,0.02) 0px 1px 1px, rgba(0,0,0,0.03) 0px 1px 4px',

  // Dark theme card shadow - more prominent
  dark: 'rgba(0,0,0,0.3) 0px 2px 4px, rgba(0,0,0,0.2) 0px 4px 12px',
  darkHover: 'rgba(0,0,0,0.4) 0px 4px 8px, rgba(0,0,0,0.3) 0px 8px 16px',
  darkPress: 'rgba(0,0,0,0.2) 0px 1px 2px, rgba(0,0,0,0.15) 0px 2px 6px',

  // Elevated surfaces - more prominent shadows
  elevated: 'rgba(0,0,0,0.08) 0px 4px 12px, rgba(0,0,0,0.04) 0px 2px 4px',
  elevatedHover: 'rgba(0,0,0,0.12) 0px 8px 16px, rgba(0,0,0,0.06) 0px 4px 8px',

  // No shadow - for flat designs
  none: 'none',
} as const

/**
 * Border Radius Scale
 *
 * Consistent border radius values mapped to Tamagui tokens.
 * Use for consistent rounded corners throughout the app.
 *
 * @example
 * ```tsx
 * <Card rounded={borderRadius.md} />  // 8px rounded corners
 * <Button rounded={borderRadius.full} />  // Fully rounded (pill shape)
 * ```
 */
export const borderRadius = {
  xs: '$1', // 2px - minimal rounding
  sm: '$2', // 4px - slight rounding
  md: '$3', // 8px - standard cards
  lg: '$4', // 12px - emphasized cards
  xl: '$5', // 16px - prominent elements
  '2xl': '$6', // 20px - hero elements
  '3xl': '$7', // 24px - dashboard widgets
  full: '$10', // 9999px - fully rounded (pills)
} as const

/**
 * Spacing Scale
 *
 * Consistent spacing values for padding, margins, and gaps.
 * Mapped to Tamagui's spacing tokens for cross-platform compatibility.
 *
 * @example
 * ```tsx
 * <YStack gap={spacing.md} p={spacing.lg}>
 *   <Text>Content with consistent spacing</Text>
 * </YStack>
 * ```
 */
export const spacing = {
  xs: '$2', // 8px - tight spacing
  sm: '$3', // 12px - compact spacing
  md: '$4', // 16px - standard spacing
  lg: '$5', // 20px - comfortable spacing
  xl: '$6', // 24px - generous spacing
  '2xl': '$8', // 32px - section spacing
  '3xl': '$10', // 40px - large section spacing
  '4xl': '$12', // 48px - hero spacing
} as const

/**
 * Typography System
 *
 * Font sizes, line heights, and weights for consistent typography.
 * Use these for all text elements to maintain hierarchy.
 *
 * @example
 * ```tsx
 * <Text fontSize={typography.lg} fontWeight={typography.semibold}>
 *   Heading Text
 * </Text>
 * ```
 */
export const typography = {
  // Font sizes (mapped to Tamagui tokens)
  xs: '$1', // 11px - tiny text (captions, labels)
  sm: '$2', // 13px - small text (secondary content)
  base: '$3', // 15px - body text (default)
  lg: '$4', // 17px - emphasized text
  xl: '$5', // 19px - subheadings
  '2xl': '$6', // 21px - h4
  '3xl': '$7', // 27px - h3
  '4xl': '$8', // 33px - h2

  // Line heights
  lineHeightTight: 1.25,
  lineHeightSnug: 1.375,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.625,
  lineHeightLoose: 2,

  // Font weights
  fontWeightNormal: '400',
  fontWeightMedium: '500',
  fontWeightSemibold: '600',
  fontWeightBold: '700',
} as const

/**
 * Animation Durations
 *
 * Standard animation timing for consistent motion design.
 * Use with Tamagui's animation system.
 *
 * @example
 * ```tsx
 * <YStack
 *   animation="quick"
 *   enterStyle={{ opacity: 0 }}
 *   opacity={1}
 * />
 * ```
 */
export const animations = {
  fast: 150, // Quick interactions (hover, focus)
  normal: 250, // Standard transitions (most animations)
  slow: 350, // Deliberate transitions (modals)
  slower: 500, // Emphasis transitions (page changes)
} as const

/**
 * Z-Index Scale
 *
 * Layering system for overlapping elements.
 * Use to ensure proper stacking order.
 *
 * @example
 * ```tsx
 * <YStack zIndex={zIndex.modal}>
 *   <Modal />
 * </YStack>
 * ```
 */
export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const

/**
 * Opacity Scale
 *
 * Standard opacity values for consistent transparency.
 * Use for disabled states, overlays, and loading states.
 *
 * @example
 * ```tsx
 * <Button opacity={disabled ? opacity.disabled : 1} />
 * ```
 */
export const opacity = {
  disabled: 0.5,
  hover: 0.8,
  loading: 0.6,
  overlay: 0.7,
} as const

/**
 * Breakpoint Values
 *
 * Screen size breakpoints for responsive design.
 * Use with Tamagui's media queries.
 *
 * @example
 * ```tsx
 * <YStack
 *   $xs={{ flexDirection: 'column' }}
 *   $gtSm={{ flexDirection: 'row' }}
 * />
 * ```
 */
export const breakpoints = {
  xs: 660, // Extra small (mobile)
  sm: 860, // Small (large mobile, small tablet)
  md: 980, // Medium (tablet)
  lg: 1120, // Large (desktop)
} as const

/**
 * Icon Sizes
 *
 * Standard icon sizes for consistent iconography.
 * Use with icon components (Lucide, etc).
 *
 * @example
 * ```tsx
 * <Home size={iconSizes.md} />
 * ```
 */
export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  '2xl': 40,
} as const

/**
 * Card Elevation System
 *
 * Predefined elevation levels for cards and surfaces.
 * Combines shadow and border for consistent depth.
 *
 * @example
 * ```tsx
 * const elevation = cardElevations.raised[isDark ? 'dark' : 'light']
 * <Card {...elevation} />
 * ```
 */
export const cardElevations = {
  flat: {
    light: {
      boxShadow: cardShadows.none,
      borderWidth: 1,
      borderColor: '$borderColor',
    },
    dark: {
      boxShadow: cardShadows.none,
      borderWidth: 1,
      borderColor: '$borderColor',
    },
  },

  raised: {
    light: {
      boxShadow: cardShadows.light,
      borderWidth: 1,
      borderColor: '$borderColor',
    },
    dark: {
      boxShadow: cardShadows.dark,
      borderWidth: 1,
      borderColor: '$borderColor',
    },
  },

  elevated: {
    light: {
      boxShadow: cardShadows.elevated,
      borderWidth: 0,
    },
    dark: {
      boxShadow: cardShadows.dark,
      borderWidth: 1,
      borderColor: '$borderColor',
    },
  },
} as const

/**
 * Type exports for TypeScript support
 */
export type CardShadow = keyof typeof cardShadows
export type BorderRadius = keyof typeof borderRadius
export type Spacing = keyof typeof spacing
export type Typography = keyof typeof typography
export type Animation = keyof typeof animations
export type ZIndex = keyof typeof zIndex
export type Opacity = keyof typeof opacity
export type IconSize = keyof typeof iconSizes
export type CardElevation = keyof typeof cardElevations
