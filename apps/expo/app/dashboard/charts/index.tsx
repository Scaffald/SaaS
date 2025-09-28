import { useState } from 'react'
import { ScrollView, YStack, XStack, Text, Button, Card, H2, H3 } from '@app/ui'
import {
  BarChart,
  LineChart,
  PieChart,
  StackedBarChart,
  RadarChart,
  PopulationPyramid,
  type BarChartData,
  type LineChartData,
  type PieChartData,
  type StackedBarChartData,
  type RadarChartData,
  type PopulationPyramidData,
} from '@app/ui'

export default function ChartsTestPage() {
  const [activeChart, setActiveChart] = useState<
    'bar' | 'line' | 'pie' | 'stacked' | 'radar' | 'pyramid' | 'all'
  >('all')

  // Sample data for different chart types
  const barData: BarChartData[] = [
    { value: 50, label: 'Jan', frontColor: '#1B6B93' },
    { value: 80, label: 'Feb', frontColor: '#4FC3F7' },
    { value: 90, label: 'Mar', frontColor: '#A8E6CF' },
    { value: 70, label: 'Apr', frontColor: '#FFD93D' },
    { value: 60, label: 'May', frontColor: '#FF6B6B' },
    { value: 85, label: 'Jun', frontColor: '#4ECDC4' },
  ]

  const lineData: LineChartData[] = [
    { value: 50, label: 'Jan' },
    { value: 80, label: 'Feb' },
    { value: 90, label: 'Mar' },
    { value: 70, label: 'Apr' },
    { value: 60, label: 'May' },
    { value: 85, label: 'Jun' },
  ]

  const pieData: PieChartData[] = [
    { value: 40, color: '#1B6B93', text: 'Mobile' },
    { value: 35, color: '#4FC3F7', text: 'Web' },
    { value: 25, color: '#A8E6CF', text: 'Desktop' },
  ]

  const stackedBarData: StackedBarChartData[] = [
    {
      stacks: [
        { value: 20, color: '#1B6B93', label: 'Q1' },
        { value: 30, color: '#4FC3F7', label: 'Q2' },
        { value: 25, color: '#A8E6CF', label: 'Q3' },
      ],
      label: 'Product A',
    },
    {
      stacks: [
        { value: 15, color: '#1B6B93', label: 'Q1' },
        { value: 35, color: '#4FC3F7', label: 'Q2' },
        { value: 20, color: '#A8E6CF', label: 'Q3' },
      ],
      label: 'Product B',
    },
    {
      stacks: [
        { value: 25, color: '#1B6B93', label: 'Q1' },
        { value: 25, color: '#4FC3F7', label: 'Q2' },
        { value: 30, color: '#A8E6CF', label: 'Q3' },
      ],
      label: 'Product C',
    },
  ]

  const radarData: RadarChartData[] = [
    { value: 80, label: 'Speed' },
    { value: 60, label: 'Power' },
    { value: 90, label: 'Control' },
    { value: 70, label: 'Endurance' },
    { value: 85, label: 'Accuracy' },
  ]

  const populationData: PopulationPyramidData[] = [
    { left: 10, right: 12, label: '0-4' },
    { left: 8, right: 9, label: '5-9' },
    { left: 6, right: 7, label: '10-14' },
    { left: 5, right: 6, label: '15-19' },
    { left: 4, right: 5, label: '20-24' },
    { left: 3, right: 4, label: '25-29' },
  ]

  const renderBarChart = () => (
    <Card padding="$4" margin="$2">
      <YStack gap="$3">
        <H3>Bar Chart Example</H3>
        <Text fontSize="$3" color="$gray10">
          Monthly sales data with custom colors and animations
        </Text>
        <BarChart
          data={barData}
          height={250}
          isAnimated={true}
          animationDuration={1000}
          onPress={(item, index) => {
            console.log('Bar pressed:', item, index)
          }}
        />
      </YStack>
    </Card>
  )

  const renderLineChart = () => (
    <Card padding="$4" margin="$2">
      <YStack gap="$3">
        <H3>Line Chart Example</H3>
        <Text fontSize="$3" color="$gray10">
          Trend data with curved lines and area fill
        </Text>
        <LineChart
          data={lineData}
          height={250}
          curved={true}
          isAnimated={true}
          animationDuration={1000}
          onPress={(item, index) => {
            console.log('Line point pressed:', item, index)
          }}
        />
      </YStack>
    </Card>
  )

  const renderAreaChart = () => (
    <Card padding="$4" margin="$2">
      <YStack gap="$3">
        <H3>Area Chart Example</H3>
        <Text fontSize="$3" color="$gray10">
          Same data with area fill and gradient
        </Text>
        <LineChart
          data={lineData}
          height={250}
          areaChart={true}
          curved={true}
          startFillColor="#1B6B93"
          endFillColor="#4FC3F7"
          startOpacity={0.4}
          endOpacity={0.1}
          isAnimated={true}
          animationDuration={1000}
        />
      </YStack>
    </Card>
  )

  const renderPieChart = () => (
    <Card padding="$4" margin="$2">
      <YStack gap="$3" alignItems="center">
        <H3>Pie Chart Example</H3>
        <Text fontSize="$3" color="$gray10">
          Platform distribution with transparent labels
        </Text>
        <PieChart
          data={pieData}
          radius={100}
          showText={true}
          showTextBackground={false}
          onPress={(item, index) => {
            console.log('Pie segment pressed:', item, index)
          }}
        />
      </YStack>
    </Card>
  )

  const renderDonutChart = () => (
    <Card padding="$4" margin="$2">
      <YStack gap="$3" alignItems="center">
        <H3>Donut Chart Example</H3>
        <Text fontSize="$3" color="$gray10">
          Same data as donut with center label
        </Text>
        <PieChart
          data={pieData}
          radius={100}
          donut={true}
          showText={true}
          showTextBackground={false}
          centerLabelComponent={() => (
            <YStack alignItems="center">
              <Text fontSize="$6" fontWeight="bold" color="$gray12">
                Total
              </Text>
              <Text fontSize="$4" color="$gray10">
                100%
              </Text>
            </YStack>
          )}
        />
      </YStack>
    </Card>
  )

  const renderStackedBarChart = () => (
    <Card padding="$4" margin="$2">
      <YStack gap="$3">
        <H3>Stacked Bar Chart Example</H3>
        <Text fontSize="$3" color="$gray10">
          Quarterly sales breakdown by product
        </Text>
        <StackedBarChart
          data={stackedBarData}
          height={250}
          isAnimated={true}
          animationDuration={1000}
          onPress={(item, index) => {
            console.log('Stacked bar pressed:', item, index)
          }}
        />
      </YStack>
    </Card>
  )

  const renderRadarChart = () => (
    <Card padding="$4" margin="$2">
      <YStack gap="$3" alignItems="center">
        <H3>Radar Chart Example</H3>
        <Text fontSize="$3" color="$gray10">
          Performance metrics across different skills
        </Text>
        <RadarChart
          data={radarData}
          height={250}
          radius={80}
          isAnimated={true}
          animationDuration={1000}
          onPress={(item, index) => {
            console.log('Radar point pressed:', item, index)
          }}
        />
      </YStack>
    </Card>
  )

  const renderPopulationPyramid = () => (
    <Card padding="$4" margin="$2">
      <YStack gap="$3">
        <H3>Population Pyramid Example</H3>
        <Text fontSize="$3" color="$gray10">
          Age distribution comparison (Male vs Female)
        </Text>
        <PopulationPyramid
          data={populationData}
          height={250}
          isAnimated={true}
          animationDuration={1000}
          onPress={(item, index) => {
            console.log('Population bar pressed:', item, index)
          }}
        />
      </YStack>
    </Card>
  )

  const renderAllCharts = () => (
    <YStack gap="$4">
      {renderBarChart()}
      {renderLineChart()}
      {renderAreaChart()}
      {renderPieChart()}
      {renderDonutChart()}
      {renderStackedBarChart()}
      {renderRadarChart()}
      {renderPopulationPyramid()}
    </YStack>
  )

  return (
    <ScrollView flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$4">
        <YStack gap="$2">
          <H2>Charts Test Page</H2>
          <Text fontSize="$4" color="$gray11">
            Testing react-native-gifted-charts integration with Tamagui styling
          </Text>
        </YStack>

        {/* Chart Type Selector */}
        <Card padding="$3">
          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="600">
              Chart Types
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              <Button
                size="$3"
                variant={activeChart === 'all' ? 'outlined' : 'outline'}
                onPress={() => setActiveChart('all')}
              >
                All Charts
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'bar' ? 'outlined' : 'outline'}
                onPress={() => setActiveChart('bar')}
              >
                Bar Chart
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'line' ? 'outlined' : 'outline'}
                onPress={() => setActiveChart('line')}
              >
                Line Chart
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'pie' ? 'outlined' : 'outline'}
                onPress={() => setActiveChart('pie')}
              >
                Pie Chart
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'stacked' ? 'outlined' : 'outline'}
                onPress={() => setActiveChart('stacked')}
              >
                Stacked Bar
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'radar' ? 'outlined' : 'outline'}
                onPress={() => setActiveChart('radar')}
              >
                Radar Chart
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'pyramid' ? 'outlined' : 'outline'}
                onPress={() => setActiveChart('pyramid')}
              >
                Population Pyramid
              </Button>
            </XStack>
          </YStack>
        </Card>

        {/* Chart Content */}
        {activeChart === 'all' && renderAllCharts()}
        {activeChart === 'bar' && renderBarChart()}
        {activeChart === 'line' && (
          <YStack gap="$4">
            {renderLineChart()}
            {renderAreaChart()}
          </YStack>
        )}
        {activeChart === 'pie' && (
          <YStack gap="$4">
            {renderPieChart()}
            {renderDonutChart()}
          </YStack>
        )}
        {activeChart === 'stacked' && renderStackedBarChart()}
        {activeChart === 'radar' && renderRadarChart()}
        {activeChart === 'pyramid' && renderPopulationPyramid()}
      </YStack>
    </ScrollView>
  )
}
