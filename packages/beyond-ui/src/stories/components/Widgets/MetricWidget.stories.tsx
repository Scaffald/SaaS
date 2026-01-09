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

export const Info01: Story = {
  args: {
    type: 'Info 01',
    title: 'Active Sessions',
    value: 892,
    change: '-3%',
    changeType: 'negative',
  },
}
