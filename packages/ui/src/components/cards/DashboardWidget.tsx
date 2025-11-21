import type { ComponentProps, ReactNode } from 'react'
import { Card, type CardProps, useTheme } from 'tamagui'
import { borderRadius } from '../../config/radii'
import { cardShadows } from '../../config/shadows'
import { spacing } from '../../config/spacing'

/**
 * DashboardWidget - Refined card component with Scaffald design system
 *
 * Professional dashboard card component featuring:
 * - Design token-based shadows for consistent elevation
 * - Theme-aware styling (light/dark mode support)
 * - Responsive padding based on screen size
 * - Smooth hover and press interactions
 * - Optional elevated styling for prominence
 *
 * Design Tokens Used:
 * - Shadows: cardShadows.light, cardShadows.dark, cardShadows.elevated
 * - Spacing: spacing.md, spacing.lg
 * - Border radius: borderRadius['3xl']
 * - Colors: $background, $borderColor
 *
 * States:
 * - Default: Subtle shadow with border
 * - Hover: Enhanced shadow, highlighted border
 * - Press: Reduced scale with pressed shadow
 *
 * @param children - Content to be rendered inside the widget
 * @param gap - Gap between child elements (defaults to spacing.md)
 * @param elevated - Use elevated shadow style for prominence (defaults to false)
 * @param props - Additional Card props
 * @returns JSX element
 *
 * @example
 * ```tsx
 * // Standard dashboard widget
 * <DashboardWidget>
 *   <Text>Widget content</Text>
 * </DashboardWidget>
 *
 * // Elevated widget with custom gap
 * <DashboardWidget gap={spacing.lg} elevated>
 *   <Text>Prominent widget</Text>
 * </DashboardWidget>
 * ```
 */
export const DashboardWidget = ({
  children,
  gap = spacing.md,
  elevated = false,
  ...props
}: {
  children?: ReactNode
  gap?: string
  elevated?: boolean
} & Omit<CardProps, 'children'>) => {
  const theme = useTheme()

  // Determine if we're in dark mode by checking background color
  const isDark = theme.background.val.includes('8%') // Simple dark mode detection

  // Select appropriate shadow based on theme and elevation
  const shadow = elevated
    ? isDark
      ? cardShadows.dark
      : cardShadows.elevated
    : isDark
      ? cardShadows.dark
      : cardShadows.light

  const shadowHover = elevated
    ? isDark
      ? cardShadows.darkHover
      : cardShadows.elevatedHover
    : isDark
      ? cardShadows.darkHover
      : cardShadows.lightHover

  return (
    <Card
      boxShadow={shadow}
      p="$6"
      $md={{ p: '$2' }}
      gap={gap}
      rounded={borderRadius['3xl']}
      bg="$gray1"
      borderWidth={0}
      borderColor="transparent"
      animation="quick"
      hoverStyle={{
        boxShadow: shadowHover,
      }}
      {...props}
    >
      {children}
    </Card>
  )
}

export type DashboardWidgetProps = ComponentProps<typeof DashboardWidget>
