import { useState } from 'react'
import { ScrollView, YStack, XStack, Text, Button, Card, H2, H3, View } from 'tamagui'
import {
  BarChart,
  LineChart,
  PieChart,
  StackedBarChart,
  RadarChart,
  PopulationPyramid,
  SkillsChart,
  type BarChartData,
  type LineChartData,
  type PieChartData,
  type StackedBarChartData,
  type RadarChartData,
  type RadarChartDataset,
  type PopulationPyramidData,
  type SkillsChartDataset,
} from '@app/ui'

export default function ChartsTestPage() {
  const [activeChart, setActiveChart] = useState<
    | 'bar'
    | 'line'
    | 'pie'
    | 'stacked'
    | 'radar'
    | 'pyramid'
    | 'project'
    | 'gradient-bar'
    | 'gradient-pie'
    | 'styled-radar'
    | 'skills'
    | 'all'
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

  const projectOverviewData: PieChartData[] = [
    { value: 50, color: '#1B6B93', text: 'Done' },
    { value: 40, color: '#4FC3F7', text: 'Ongoing' },
    { value: 10, color: '#A8E6CF', text: 'Canceled' },
  ]

  const gradientBarData: BarChartData[] = [
    { value: 50, label: 'Jan', frontColor: '#1B6B93', gradientColor: '#4FC3F7' },
    { value: 80, label: 'Feb', frontColor: '#4FC3F7', gradientColor: '#A8E6CF' },
    { value: 90, label: 'Mar', frontColor: '#A8E6CF', gradientColor: '#FFD93D' },
    { value: 70, label: 'Apr', frontColor: '#FFD93D', gradientColor: '#FF6B6B' },
    { value: 60, label: 'May', frontColor: '#FF6B6B', gradientColor: '#4ECDC4' },
    { value: 85, label: 'Jun', frontColor: '#4ECDC4', gradientColor: '#1B6B93' },
  ]

  const gradientPieData: PieChartData[] = [
    { value: 35, color: '#1B6B93', text: 'Mobile', gradientCenterColor: '#4FC3F7' },
    { value: 30, color: '#4FC3F7', text: 'Web', gradientCenterColor: '#A8E6CF' },
    { value: 25, color: '#A8E6CF', text: 'Desktop', gradientCenterColor: '#FFD93D' },
    { value: 10, color: '#FFD93D', text: 'Tablet', gradientCenterColor: '#FF6B6B' },
  ]

  const styledRadarData: RadarChartDataset[] = [
    {
      data: [
        { value: 85, label: 'Intensity' },
        { value: 70, label: 'Flavour' },
        { value: 60, label: 'Chill' },
        { value: 45, label: 'Excitement' },
        { value: 65, label: 'Good mood' },
        { value: 30, label: 'Anxiety' },
        { value: 25, label: 'Hunger' },
        { value: 80, label: 'Lasting' },
        { value: 75, label: 'Effect' },
      ],
      fillColor: '#F0B2E0',
      strokeColor: '#C0A0D0',
      strokeWidth: 2,
      fillOpacity: 0.6,
      label: 'Dataset 1',
    },
    {
      data: [
        { value: 60, label: 'Intensity' },
        { value: 85, label: 'Flavour' },
        { value: 90, label: 'Chill' },
        { value: 70, label: 'Excitement' },
        { value: 75, label: 'Good mood' },
        { value: 55, label: 'Anxiety' },
        { value: 65, label: 'Hunger' },
        { value: 60, label: 'Lasting' },
        { value: 65, label: 'Effect' },
      ],
      fillColor: '#A0C0E0',
      strokeColor: '#B0B0C0',
      strokeWidth: 2,
      fillOpacity: 0.6,
      label: 'Dataset 2',
    },
  ]

  const skillsData: SkillsChartDataset[] = [
    {
      label: 'Hard Skills',
      data: [
        { label: 'Wood Framing', value: 72 },
        { label: 'Form Work', value: 94 },
        { label: 'Metal Framing', value: 41 },
        { label: 'Load Bearing', value: 64 },
        { label: 'Floor Systems', value: 24 },
      ],
      fillColor: '#4FC3F7',
      strokeColor: '#29B6F6',
      fillOpacity: 0.6,
    },
    {
      label: 'Soft Skills',
      data: [
        { label: 'Communication', value: 12 },
        { label: 'Punctuality', value: 54 },
        { label: 'Reliability', value: 99 },
        { label: 'Work Ethic', value: 74 },
        { label: 'Management', value: 35 },
      ],
      fillColor: '#A8E6CF',
      strokeColor: '#81C784',
      fillOpacity: 0.6,
    },
  ]

  const renderBarChart = () => (
    <Card p="$4" margin="$2">
      <YStack gap="$3">
        <H3>Bar Chart Example</H3>
        <Text fontSize="$3" color="$color10">
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
    <Card p="$4" margin="$2">
      <YStack gap="$3">
        <H3>Line Chart Example</H3>
        <Text fontSize="$3" color="$color10">
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
    <Card p="$4" margin="$2">
      <YStack gap="$3">
        <H3>Area Chart Example</H3>
        <Text fontSize="$3" color="$color10">
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
    <Card p="$4" margin="$2">
      <YStack gap="$3" items="center">
        <H3>Pie Chart Example</H3>
        <Text fontSize="$3" color="$color10">
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
    <Card p="$4" margin="$2">
      <YStack gap="$3" items="center">
        <H3>Donut Chart Example</H3>
        <Text fontSize="$3" color="$color10">
          Same data as donut with center label
        </Text>
        <PieChart
          data={pieData}
          radius={100}
          donut={true}
          showText={true}
          showTextBackground={false}
          centerLabelComponent={() => (
            <YStack items="center">
              <Text fontSize="$6" fontWeight="bold" color="$color12">
                Total
              </Text>
              <Text fontSize="$4" color="$color10">
                100%
              </Text>
            </YStack>
          )}
        />
      </YStack>
    </Card>
  )

  const renderStackedBarChart = () => (
    <Card p="$4" margin="$2">
      <YStack gap="$3">
        <H3>Stacked Bar Chart Example</H3>
        <Text fontSize="$3" color="$color10">
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
    <Card p="$4" margin="$2">
      <YStack gap="$3" items="center">
        <H3>Radar Chart Example</H3>
        <Text fontSize="$3" color="$color10">
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
    <Card p="$4" margin="$2">
      <YStack gap="$3">
        <H3>Population Pyramid Example</H3>
        <Text fontSize="$3" color="$color10">
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

  const renderProjectOverview = () => (
    <Card p="$4" margin="$2">
      <YStack gap="$4">
        {/* Header */}
        <XStack justify="space-between" items="flex-start">
          <YStack gap="$1">
            <H3>Project Overview</H3>
            <Text fontSize="$3" color="$color10">
              12 May - 17 May 2023
            </Text>
          </YStack>
          <Button variant="outlined" size="$2">
            <Text fontSize="$2" color="$blue10">
              See Details
            </Text>
          </Button>
        </XStack>

        {/* Chart and Legend */}
        <XStack gap="$4" items="center">
          {/* Donut Chart */}
          <YStack items="center" flex={1}>
            <PieChart
              data={projectOverviewData}
              radius={80}
              donut={true}
              showText={false}
              showTextBackground={false}
              centerLabelComponent={() => (
                <YStack items="center">
                  <Text fontSize="$8" fontWeight="bold" color="$color12">
                    38
                  </Text>
                </YStack>
              )}
            />
          </YStack>

          {/* Legend */}
          <YStack gap="$3" flex={1}>
            {projectOverviewData.map((item) => (
              <XStack key={item.text} gap="$2" items="center">
                <View width={12} height={12} rounded={6} bg="$color9" />
                <YStack>
                  <Text fontSize="$4" fontWeight="600" color="$color12">
                    {item.value}%
                  </Text>
                  <Text fontSize="$3" color="$color10">
                    {item.text}
                  </Text>
                </YStack>
              </XStack>
            ))}
          </YStack>
        </XStack>
      </YStack>
    </Card>
  )

  const renderGradientBarChart = () => (
    <Card p="$4" margin="$2">
      <YStack gap="$3">
        <H3>Gradient Bar Chart Example</H3>
        <Text fontSize="$3" color="$color10">
          Monthly sales data with beautiful gradient effects
        </Text>
        <BarChart
          data={gradientBarData}
          height={250}
          isAnimated={true}
          animationDuration={1000}
          showGradient={true}
          onPress={(item, index) => {
            console.log('Gradient bar pressed:', item, index)
          }}
        />
      </YStack>
    </Card>
  )

  const renderGradientPieChart = () => (
    <Card p="$4" margin="$2">
      <YStack gap="$3" items="center">
        <H3>Gradient Pie Chart Example</H3>
        <Text fontSize="$3" color="$color10">
          Platform distribution with gradient effects
        </Text>
        <PieChart
          data={gradientPieData}
          radius={100}
          showText={true}
          showTextBackground={false}
          showGradient={true}
          onPress={(item, index) => {
            console.log('Gradient pie segment pressed:', item, index)
          }}
        />
      </YStack>
    </Card>
  )

  const renderGradientDonutChart = () => (
    <Card p="$4" margin="$2">
      <YStack gap="$3" items="center">
        <H3>Gradient Donut Chart Example</H3>
        <Text fontSize="$3" color="$color10">
          Same data with gradient donut and center label
        </Text>
        <PieChart
          data={gradientPieData}
          radius={100}
          donut={true}
          showText={true}
          showTextBackground={false}
          showGradient={true}
          centerLabelComponent={() => (
            <YStack items="center">
              <Text fontSize="$6" fontWeight="bold" color="$color12">
                Total
              </Text>
              <Text fontSize="$4" color="$color10">
                100%
              </Text>
            </YStack>
          )}
        />
      </YStack>
    </Card>
  )

  const renderStyledRadarChart = () => (
    <Card p="$4" margin="$2" bg="$red10">
      <YStack gap="$4" items="center">
        <H3>Styled Radar Chart Example</H3>
        <Text fontSize="$3" text="center">
          Dark theme radar chart with overlapping datasets and gradient fills
        </Text>

        {/* Try single dataset first to debug */}
        <RadarChart
          data={styledRadarData[0].data}
          height={300}
          radius={120}
          backgroundColor="#1A202C"
          gridColor="#E0E0E0"
          labelColor="#E0E0E0"
          labelTextSize={14}
          maxValue={100}
          noOfSections={5}
          isAnimated={true}
          animationDuration={1200}
        />

        {/* Debug info */}
        <Text fontSize="$2" text="center">
          Debug: Using single dataset for now
        </Text>

        {/* Legend */}
        <XStack gap="$4" justify="center">
          {styledRadarData.map((dataset) => (
            <XStack key={dataset.label} gap="$2" items="center">
              <View
                width={16}
                height={16}
                rounded={8}
                bg={dataset.fillColor}
                opacity={dataset.fillOpacity}
              />
              <Text fontSize="$3">{dataset.label}</Text>
            </XStack>
          ))}
        </XStack>
      </YStack>
    </Card>
  )

  const renderSkillsChart = () => (
    <Card p="$4" margin="$2">
      <YStack gap="$4" items="center">
        <H3>Skills Chart Example</H3>
        <Text fontSize="$3" text="center">
          Custom radar chart with animated polygons and gradient fills
        </Text>
        <SkillsChart
          datasets={skillsData}
          showSets={[0, 1]}
          height={300}
          radius={120}
          backgroundColor="#1A202C"
          gridColor="#E0E0E0"
          labelColor="#E0E0E0"
          labelTextSize={14}
          maxValue={100}
          isAnimated={true}
        />

        {/* Legend */}
        <XStack gap="$4" justify="center">
          {skillsData.map((dataset) => (
            <XStack key={dataset.label} gap="$2" items="center">
              <View
                width={16}
                height={16}
                rounded={8}
                bg={dataset.fillColor}
                opacity={dataset.fillOpacity}
              />
              <Text fontSize="$3">{dataset.label}</Text>
            </XStack>
          ))}
        </XStack>
      </YStack>
    </Card>
  )

  const renderAllCharts = () => (
    <YStack gap="$4">
      {renderProjectOverview()}
      {renderBarChart()}
      {renderGradientBarChart()}
      {renderLineChart()}
      {renderAreaChart()}
      {renderPieChart()}
      {renderGradientPieChart()}
      {renderDonutChart()}
      {renderGradientDonutChart()}
      {renderStackedBarChart()}
      {renderRadarChart()}
      {renderStyledRadarChart()}
      {renderSkillsChart()}
      {renderPopulationPyramid()}
    </YStack>
  )

  return (
    <ScrollView flex={1} bg="$background">
      <YStack p="$4" gap="$4">
        <YStack gap="$2">
          <H2>Charts Test Page</H2>
          <Text fontSize="$4" color="$color11">
            Testing react-native-gifted-charts integration with Tamagui styling
          </Text>
        </YStack>

        {/* Chart Type Selector */}
        <Card p="$3">
          <YStack gap="$3">
            <Text fontSize="$4" fontWeight="600">
              Chart Types
            </Text>
            <XStack gap="$2" flexWrap="wrap">
              <Button
                size="$3"
                variant={activeChart === 'all' ? 'outlined' : undefined}
                onPress={() => setActiveChart('all')}
              >
                All Charts
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'bar' ? 'outlined' : undefined}
                onPress={() => setActiveChart('bar')}
              >
                Bar Chart
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'line' ? 'outlined' : undefined}
                onPress={() => setActiveChart('line')}
              >
                Line Chart
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'pie' ? 'outlined' : undefined}
                onPress={() => setActiveChart('pie')}
              >
                Pie Chart
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'stacked' ? 'outlined' : undefined}
                onPress={() => setActiveChart('stacked')}
              >
                Stacked Bar
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'radar' ? 'outlined' : undefined}
                onPress={() => setActiveChart('radar')}
              >
                Radar Chart
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'pyramid' ? 'outlined' : undefined}
                onPress={() => setActiveChart('pyramid')}
              >
                Population Pyramid
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'project' ? 'outlined' : undefined}
                onPress={() => setActiveChart('project')}
              >
                Project Overview
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'gradient-bar' ? 'outlined' : undefined}
                onPress={() => setActiveChart('gradient-bar')}
              >
                Gradient Bar
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'gradient-pie' ? 'outlined' : undefined}
                onPress={() => setActiveChart('gradient-pie')}
              >
                Gradient Pie
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'styled-radar' ? 'outlined' : undefined}
                onPress={() => setActiveChart('styled-radar')}
              >
                Styled Radar
              </Button>
              <Button
                size="$3"
                variant={activeChart === 'skills' ? 'outlined' : undefined}
                onPress={() => setActiveChart('skills')}
              >
                Skills
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
        {activeChart === 'styled-radar' && renderStyledRadarChart()}
        {activeChart === 'skills' && renderSkillsChart()}
        {activeChart === 'stacked' && renderStackedBarChart()}
        {activeChart === 'radar' && renderRadarChart()}
        {activeChart === 'pyramid' && renderPopulationPyramid()}
        {activeChart === 'project' && renderProjectOverview()}
        {activeChart === 'gradient-bar' && renderGradientBarChart()}
        {activeChart === 'gradient-pie' && (
          <YStack gap="$4">
            {renderGradientPieChart()}
            {renderGradientDonutChart()}
          </YStack>
        )}
      </YStack>
    </ScrollView>
  )
}
