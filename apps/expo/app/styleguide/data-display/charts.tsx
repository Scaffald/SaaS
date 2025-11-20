// @ts-nocheck

import { AnchorHeading, ExampleCard, StyleguidePage } from '@app/styleguide'
import {
  BarChart,
  type BarChartData,
  LineChart,
  type LineChartData,
  PieChart,
  type PieChartData,
  YStack,
} from '@app/ui'

const barData: BarChartData[] = [
  { value: 50, label: 'Jan', frontColor: '#1B6B93' },
  { value: 80, label: 'Feb', frontColor: '#4FC3F7' },
  { value: 90, label: 'Mar', frontColor: '#A8E6CF' },
  { value: 70, label: 'Apr', frontColor: '#FFD93D' },
]

const lineData: LineChartData[] = [
  { value: 34, label: 'Week 1' },
  { value: 48, label: 'Week 2' },
  { value: 42, label: 'Week 3' },
  { value: 56, label: 'Week 4' },
]

const pieData: PieChartData[] = [
  { value: 40, color: '#1B6B93', text: 'Mobile' },
  { value: 35, color: '#4FC3F7', text: 'Web' },
  { value: 25, color: '#A8E6CF', text: 'Desktop' },
]

export default function ChartsPage() {
  return (
    <StyleguidePage
      title="Charts"
      description="Charts provided by @app/ui for dashboards and reports."
    >
      <YStack gap="$6">
        <AnchorHeading
          id="charts-bar"
          title="Bar chart"
          description="Single-series bar chart with gradient tokens."
        />
        <ExampleCard
          title="Monthly signups"
          description="Bar chart using brand palette colors."
          code={`<BarChart data={barData} width={320} height={220} />`}
        >
          <BarChart data={barData} width={320} height={220} />
        </ExampleCard>
        <AnchorHeading
          id="charts-line"
          title="Line chart"
          description="Line chart for trends over time."
        />
        <ExampleCard
          title="Weekly retention"
          description="Line chart with points enabled."
          code={`<LineChart data={lineData} width={320} height={220} />`}
        >
          <LineChart data={lineData} width={320} height={220} />
        </ExampleCard>
        <AnchorHeading
          id="charts-pie"
          title="Pie chart"
          description="Distribution breakdown using brand colors."
        />
        <ExampleCard
          title="Platform traffic"
          description="Pie chart with legend labels."
          code={`<PieChart data={pieData} />`}
        >
          <PieChart data={pieData} />
        </ExampleCard>
      </YStack>
    </StyleguidePage>
  )
}
