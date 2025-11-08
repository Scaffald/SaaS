import { forwardRef } from 'react'
import { Text, type TextProps } from 'tamagui'
import { typography } from '../../tokens/design-tokens'

/**
 * Heading variant types
 */
export type HeadingVariant = 'h1' | 'h2' | 'h3' | 'h4'

/**
 * Heading component props
 */
export interface HeadingProps extends Omit<TextProps, 'children'> {
  /** Heading variant (h1-h4) */
  variant?: HeadingVariant
  /** Heading text content */
  children: React.ReactNode
}

/**
 * Variant configuration for heading styles
 */
const headingVariants: Record<
  HeadingVariant,
  {
    fontSize: string
    fontWeight: string
    lineHeight: number
    tag: 'h1' | 'h2' | 'h3' | 'h4'
  }
> = {
  h1: {
    fontSize: typography['4xl'],
    fontWeight: typography.fontWeightBold,
    lineHeight: typography.lineHeightTight,
    tag: 'h1',
  },
  h2: {
    fontSize: typography['3xl'],
    fontWeight: typography.fontWeightBold,
    lineHeight: typography.lineHeightTight,
    tag: 'h2',
  },
  h3: {
    fontSize: typography['2xl'],
    fontWeight: typography.fontWeightSemibold,
    lineHeight: typography.lineHeightSnug,
    tag: 'h3',
  },
  h4: {
    fontSize: typography.xl,
    fontWeight: typography.fontWeightSemibold,
    lineHeight: typography.lineHeightSnug,
    tag: 'h4',
  },
}

/**
 * Heading - Typography component with consistent heading styles
 *
 * Provides four heading variants (h1-h4) with design token-based styling.
 * Automatically uses semantic HTML tags for accessibility.
 *
 * Design Features:
 * - Design token-based font sizes and weights
 * - Consistent line heights for readability
 * - Semantic HTML tags (h1, h2, h3, h4)
 * - Cross-platform compatibility
 * - Supports all Tamagui Text props for customization
 *
 * Typography Scale:
 * - h1: 33px, bold, tight line height - Page titles
 * - h2: 27px, bold, tight line height - Section headers
 * - h3: 21px, semibold, snug line height - Subsection headers
 * - h4: 19px, semibold, snug line height - Card/component titles
 *
 * @example
 * ```tsx
 * // Page title
 * <Heading variant="h1">Dashboard</Heading>
 *
 * // Section header
 * <Heading variant="h2">Recent Jobs</Heading>
 *
 * // Subsection
 * <Heading variant="h3" color="$teal11">
 *   Skills Required
 * </Heading>
 *
 * // Card title with custom props
 * <Heading variant="h4" mb="$2" numberOfLines={1}>
 *   Job Title
 * </Heading>
 * ```
 */
export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ variant = 'h1', children, ...props }, ref) => {
    const config = headingVariants[variant]

    return (
      <Text
        ref={ref}
        tag={config.tag}
        fontSize={config.fontSize}
        fontWeight={config.fontWeight}
        lineHeight={config.lineHeight}
        color="$color12"
        {...props}
      >
        {children}
      </Text>
    )
  }
)

Heading.displayName = 'Heading'
