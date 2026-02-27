/**
 * MetricWidget component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { MetricWidget } from '../../../components/Widgets/Metrics'

const meta = {
  title: 'Widgets/MetricWidget',
  component: MetricWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MetricWidget>

export default meta
type Story = StoryObj<typeof meta>

// Chart variants
export const Chart01: Story = {
  args: {
    type: 'Chart 01',
    title: 'New Subscriptions',
    value: 32,
    change: '+12%',
    changeType: 'positive',
    subtitle: 'vs. last period',
    chartData: [10, 20, 15, 30, 25],
  },
}

export const Chart02: Story = {
  args: {
    type: 'Chart 02',
    title: 'Revenue Growth',
    value: 1250,
    change: '+8%',
    changeType: 'positive',
    subtitle: 'vs. last quarter',
    chartData: [100, 150, 120, 180, 200],
  },
}

export const Chart03: Story = {
  args: {
    type: 'Chart 03',
    title: 'User Engagement',
    value: 892,
    change: '-3%',
    changeType: 'negative',
    subtitle: 'vs. last week',
    chartData: [50, 60, 55, 45, 40],
  },
}

// Blank variants
export const Blank01: Story = {
  args: {
    type: 'Blank 01',
    title: 'Total Users',
    value: 1250,
    change: '+5%',
    changeType: 'positive',
    subtitle: 'vs. last month',
  },
}

export const Blank02: Story = {
  args: {
    type: 'Blank 02',
    title: 'Active Projects',
    value: 42,
    change: '+12%',
    changeType: 'positive',
    subtitle: 'vs. last quarter',
  },
}

export const Blank03: Story = {
  args: {
    type: 'Blank 03',
    title: 'Pending Tasks',
    value: 8,
    change: '-2%',
    changeType: 'negative',
  },
}

// Info variants
export const Info01: Story = {
  args: {
    type: 'Info 01',
    title: 'Active Sessions',
    value: 892,
    change: '-3%',
    changeType: 'negative',
  },
}

export const Info02: Story = {
  args: {
    type: 'Info 02',
    title: 'System Health',
    value: 98,
    change: '+2%',
    changeType: 'positive',
    subtitle: 'uptime this month',
  },
}

// Neutral variant
export const Neutral: Story = {
  args: {
    type: 'Neutral',
    title: 'Average Response Time',
    value: '2.5s',
    change: '0%',
    changeType: 'neutral',
    subtitle: 'vs. last period',
  },
}

// Type10 variant
export const Type10: Story = {
  args: {
    type: 'Type10',
    title: 'Custom Metric',
    value: 456,
    change: '+15%',
    changeType: 'positive',
    subtitle: 'custom comparison',
  },
}
