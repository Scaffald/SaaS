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
      boxShadow="inset 1px 1px .5px #fff8, inset 2px 5px 25px #0000000f, inset -1px -1px 0 .5px #ddd2, 2px 2px 25px #0001"
      size="$4"
      padding="$5"
      gap={gap}
      borderRadius="$7"
      backgroundColor="$color1"
      mx="$6"
      my="$3"
      $sm={{
        mx: '$4',
        boxShadow:
          'inset 1px 1px .5px #fff8, inset 2px 5px 25px #0000000f, inset -1px -1px 0 .5px #ddd2',
      }}
      {...props}
    >
      {children}
    </Card>
  )
}

export type DashboardWidgetProps = React.ComponentProps<typeof DashboardWidget>
