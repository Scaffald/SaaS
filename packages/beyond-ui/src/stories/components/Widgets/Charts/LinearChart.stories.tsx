/**
 * LinearChart widget stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { LinearChart } from '../../../../components/Widgets/Charts'

const meta = {
  title: 'Widgets/Charts/LinearChart',
  component: LinearChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LinearChart>

export default meta
type Story = StoryObj<typeof meta>

export const Small: Story = {
  args: {
    variant: 'small',
    data: [10, 20, 15, 30, 25, 40, 35],
    showLegend: false,
  },
}

export const Large: Story = {
  args: {
    variant: 'large',
    data: [
      { value: 20, label: 'Jan' },
      { value: 35, label: 'Feb' },
      { value: 28, label: 'Mar' },
      { value: 45, label: 'Apr' },
    ],
    showLegend: true,
  },
}
