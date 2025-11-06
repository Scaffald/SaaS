import type { ReactNode, ComponentProps } from 'react'
import { Card, useWindowDimensions, type CardProps } from 'tamagui'

/**
 * DashboardWidget - A reusable card component for dashboard widgets
 *
 * Provides consistent styling for all dashboard cards with:
 * - Elevation and shadow effects
 * - Consistent padding, gap, and border styling
 * - Theme-aware colors and sizing
 *
 * @param children - Content to be rendered inside the widget
 * @param gap - Gap between child elements (defaults to "$4")
 * @param props - Additional Card props
 * @returns JSX element
 *
 * @example
 * ```tsx
 * <DashboardWidget>
 *   <Text>Widget content</Text>
 * </DashboardWidget>
 *
 * <DashboardWidget gap="$3">
 *   <Text>Widget with custom gap</Text>
 * </DashboardWidget>
 * ```
 */
export const DashboardWidget = ({
  children,
  gap = '$4',
  ...props
}: {
  children?: ReactNode
  gap?: string
} & Omit<CardProps, 'children'>) => {
  const { width } = useWindowDimensions()
  const isSmallScreen = width < 640
  return (
    <Card
      boxShadow="inset 1px 1px .5px #fff8, inset 2px 5px 25px #00000004, inset -1px -1px 0 .5px #ddd2, 2px 2px 25px #0001"
      p={isSmallScreen ? '$4' : '$5'}
      gap={gap}
      rounded="$7"
      bg="$color1"
      {...props}
    >
      {children}
    </Card>
  )
}

export type DashboardWidgetProps = ComponentProps<typeof DashboardWidget>
