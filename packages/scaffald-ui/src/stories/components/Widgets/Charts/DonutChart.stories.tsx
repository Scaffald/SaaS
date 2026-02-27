/**
 * DonutChart widget stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { DonutChart } from '../../../../components/Widgets/Charts'

const meta = {
  title: 'Widgets/Charts/DonutChart',
  component: DonutChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof DonutChart>

export default meta
type Story = StoryObj<typeof meta>

export const Vertical: Story = {
  args: {
    variant: 'vertical',
    data: [
      { value: 30, label: 'Product A', color: '#3b82f6' },
      { value: 50, label: 'Product B', color: '#10b981' },
      { value: 20, label: 'Product C', color: '#f59e0b' },
    ],
    showLabels: true,
  },
}

export const Horizontal: Story = {
  args: {
    variant: 'horizontal',
    data: [
      { value: 30, label: 'Product A', color: '#3b82f6' },
      { value: 50, label: 'Product B', color: '#10b981' },
      { value: 20, label: 'Product C', color: '#f59e0b' },
    ],
    showLabels: false,
  },
}
