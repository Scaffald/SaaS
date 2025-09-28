import { ReactNode } from 'react'
import { Card, type CardProps } from 'tamagui'

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
  return (
    <Card
      elevate
      size="$4"
      padding="$5"
      gap={gap}
      borderRadius="$6"
      borderWidth={1}
      borderColor="$borderColor"
      backgroundColor="$color1"
      {...props}
    >
      {children}
    </Card>
  )
}

export type DashboardWidgetProps = React.ComponentProps<typeof DashboardWidget>
