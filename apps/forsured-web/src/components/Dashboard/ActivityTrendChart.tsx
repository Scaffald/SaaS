/**
 * ActivityTrendChart component
 * Displays activity trends over time using LinearChart with multi-series support
 */

import { useState } from 'react'
import { Stack, Text, Card } from '@unicornlove/beyond-ui'
import { Chart, LinearChart } from '@unicornlove/beyond-ui'
import type { ChartPeriod, ChartSeries } from '@unicornlove/beyond-ui'

export interface ActivityTrendChartProps {
  /**
   * Activity data series
   * Array of series with { name: string, data: Array<{ date: string, value: number }> }
   */
  series: Array<{
    name: string
    data: Array<{ date: string; value: number }>
    color?: string
  }>

  /**
   * Time period for the chart
   * @default 'month'
   */
  period?: ChartPeriod

  /**
   * Chart title
   */
  title?: string

  /**
   * Chart height
   * @default 247
   */
  height?: number
}

export function ActivityTrendChart({
  series,
  period = 'month',
  title = 'Activity Trend',
  height = 247,
}: ActivityTrendChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>(period)

  // Convert series data to chart format
  const chartSeries: ChartSeries[] = series.map((s) => ({
    name: s.name,
    data: s.data.map((item, index) => ({
      x: index,
      y: item.value,
    })),
    color: s.color,
  }))

  // Calculate Y-axis labels based on all series data
  const allValues = series.flatMap((s) => s.data.map((d) => d.value))
  const minValue = Math.min(...allValues, 0)
  const maxValue = Math.max(...allValues, 100)
  const step = Math.ceil((maxValue - minValue) / 5)
  const yAxisLabels: number[] = []
  for (let i = minValue; i <= maxValue; i += step) {
    yAxisLabels.push(i)
  }
  if (yAxisLabels[yAxisLabels.length - 1] !== maxValue) {
    yAxisLabels.push(maxValue)
  }

  return (
    <Card style={{ padding: 'var(--space-6)' }}>
      <Stack gap="var(--space-4)">
        <Text size="lg" weight="semibold">
          {title}
        </Text>
        <Chart
          period={selectedPeriod}
          showGrid
          showXIndicator
          height={height}
          yAxisLabels={yAxisLabels}
        >
          <LinearChart
            series={chartSeries}
            showShadow
          />
        </Chart>
      </Stack>
    </Card>
  )
}
