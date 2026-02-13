/**
 * TaskBreakdownChart component
 * Displays task breakdown using DonutChart
 */

import { Stack, Text, Card } from '@scaffald/ui'
import { DonutChart } from '@scaffald/ui'
import type { DonutChartData } from '@scaffald/ui'

export interface TaskBreakdownChartProps {
  /**
   * Task breakdown data
   * Array of { label: string, value: number, color?: string }
   */
  data: DonutChartData[]

  /**
   * Chart title
   */
  title?: string

  /**
   * Chart size
   * @default 'lg'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2x-large'

  /**
   * Color scheme
   * @default 'colorful'
   */
  colorScheme?: 'primary' | 'colorful'

  /**
   * Show labels
   * @default true
   */
  showLabels?: boolean
}

export function TaskBreakdownChart({
  data,
  title = 'Task Breakdown',
  size = 'lg',
  colorScheme = 'colorful',
  showLabels = true,
}: TaskBreakdownChartProps) {
  return (
    <Card style={{ padding: 'var(--space-6)' }}>
      <Stack gap="var(--space-4)" alignItems="center">
        <Text size="lg" weight="semibold">
          {title}
        </Text>
        <DonutChart
          data={data}
          size={size}
          colorScheme={colorScheme}
          showLabel={showLabels}
          showPercentage={showLabels}
        />
      </Stack>
    </Card>
  )
}
