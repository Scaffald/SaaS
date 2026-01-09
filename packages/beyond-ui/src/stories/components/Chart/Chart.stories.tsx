/**
 * Chart component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { View, Text, StyleSheet } from 'react-native'
import {
  BarChart,
  BarChartBase,
  LinearChart,
  DonutChart,
  CircleChart,
  HalfPieChart,
  MiniLinearChart,
  SmallCircleChart,
  Chart,
} from '../../../components/Chart'
import { spacing } from '../../../tokens/spacing'

const meta = {
  title: 'Components/Chart',
  component: Chart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Chart>

export default meta
type Story = StoryObj<typeof meta>

// Bar Chart variants
export const BarChartVariants: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.title}>Bar Chart Variants</Text>
      <View style={styles.row}>
        <View style={styles.chartContainer}>
          <Text style={styles.subtitle}>Variant 1 (Thin)</Text>
          <BarChart data={[10, 20, 15, 30, 25]} variant="1" />
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.subtitle}>Variant 2 (Medium)</Text>
          <BarChart data={[10, 20, 15, 30, 25]} variant="2" />
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.subtitle}>Variant 3 (Thick)</Text>
          <BarChart data={[10, 20, 15, 30, 25]} variant="3" />
        </View>
      </View>
    </View>
  ),
}

// Linear Chart
export const LinearChartExample: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.title}>Linear Chart</Text>
      <LinearChart
        data={[
          { x: 0, y: 10 },
          { x: 1, y: 20 },
          { x: 2, y: 15 },
          { x: 3, y: 30 },
          { x: 4, y: 25 },
        ]}
        period="month"
        showShadow
      />
    </View>
  ),
}

// Donut Chart sizes
export const DonutChartSizes: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.title}>Donut Chart Sizes</Text>
      <View style={styles.row}>
        <View style={styles.chartContainer}>
          <Text style={styles.subtitle}>Small</Text>
          <DonutChart
            data={[
              { label: 'A', value: 30 },
              { label: 'B', value: 50 },
              { label: 'C', value: 20 },
            ]}
            size="sm"
            colorScheme="primary"
          />
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.subtitle}>Medium</Text>
          <DonutChart
            data={[
              { label: 'A', value: 30 },
              { label: 'B', value: 50 },
              { label: 'C', value: 20 },
            ]}
            size="md"
            colorScheme="primary"
          />
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.subtitle}>Large</Text>
          <DonutChart
            data={[
              { label: 'A', value: 30 },
              { label: 'B', value: 50 },
              { label: 'C', value: 20 },
            ]}
            size="lg"
            colorScheme="colorful"
          />
        </View>
      </View>
    </View>
  ),
}

// Circle Chart
export const CircleChartExample: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.title}>Circle Chart (Progress)</Text>
      <View style={styles.row}>
        <CircleChart value={25} size="sm" showLabel />
        <CircleChart value={50} size="md" showLabel />
        <CircleChart value={75} size="lg" showLabel />
        <CircleChart value={100} size="xl" showLabel />
      </View>
    </View>
  ),
}

// Half Pie Chart
export const HalfPieChartExample: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.title}>Half Pie Chart</Text>
      <View style={styles.row}>
        <HalfPieChart data={[30, 50, 20]} size="sm" />
        <HalfPieChart data={[30, 50, 20]} size="md" />
        <HalfPieChart data={[30, 50, 20]} size="lg" />
      </View>
    </View>
  ),
}

// Mini Linear Chart
export const MiniLinearChartExample: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.title}>Mini Linear Chart</Text>
      <View style={styles.row}>
        <View style={styles.chartContainer}>
          <Text style={styles.subtitle}>With Shadow</Text>
          <MiniLinearChart data={[10, 20, 15, 30, 25]} shadow />
        </View>
        <View style={styles.chartContainer}>
          <Text style={styles.subtitle}>Without Shadow</Text>
          <MiniLinearChart data={[10, 20, 15, 30, 25]} shadow={false} />
        </View>
      </View>
    </View>
  ),
}

// Small Circle Chart
export const SmallCircleChartExample: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.title}>Small Circle Chart</Text>
      <View style={styles.row}>
        <SmallCircleChart value={25} size="xs" />
        <SmallCircleChart value={50} size="sm" />
        <SmallCircleChart value={75} size="md" />
        <SmallCircleChart value={100} size="lg" />
      </View>
    </View>
  ),
}

// Main Chart with grid and axes
export const MainChart: Story = {
  render: () => (
    <View style={styles.container}>
      <Text style={styles.title}>Main Chart with Grid and Axes</Text>
      <Chart
        type="linear"
        xAxisLabels={['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']}
        yAxisLabels={[0, 20, 40, 60, 80, 100]}
        period="month"
        showGrid
      >
        <LinearChart
          data={[
            { x: 0, y: 20 },
            { x: 1, y: 40 },
            { x: 2, y: 30 },
            { x: 3, y: 60 },
            { x: 4, y: 50 },
            { x: 5, y: 80 },
          ]}
        />
      </Chart>
    </View>
  ),
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[16],
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing[16],
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing[8],
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: spacing[16],
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  chartContainer: {
    alignItems: 'center',
    padding: spacing[16],
  },
})
