/**
 * ComplianceTrendChart component
 * Displays compliance score trends over time using LinearChart
 */

import { useState } from 'react'
import { Stack, Text, Card } from '@scaffald/ui'
import { Chart, LinearChart } from '@scaffald/ui'
import type { ChartPeriod } from '@scaffald/ui'

export interface ComplianceTrendChartProps {
  /**
   * Compliance scores over time
   * Array of { date: string, score: number }
   */
  data: Array<{ date: string; score: number }>

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

export function ComplianceTrendChart({
  data,
  period = 'month',
  title = 'Compliance Trend',
  height = 247,
}: ComplianceTrendChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>(period)

  // Convert data to chart format
  const chartData = data.map((item, index) => ({
    x: index,
    y: item.score,
  }))

  // Calculate Y-axis labels based on data range
  const scores = data.map((d) => d.score)
  const minScore = Math.min(...scores, 0)
  const maxScore = Math.max(...scores, 100)
  const step = Math.ceil((maxScore - minScore) / 5)
  const yAxisLabels: number[] = []
  for (let i = minScore; i <= maxScore; i += step) {
    yAxisLabels.push(i)
  }
  if (yAxisLabels[yAxisLabels.length - 1] !== maxScore) {
    yAxisLabels.push(maxScore)
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
            data={chartData}
            color="var(--color-primary-600)"
            showShadow
          />
        </Chart>
      </Stack>
    </Card>
  )
}
