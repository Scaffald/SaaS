/**
 * PieChart widget stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { PieChart } from '../../../../components/Widgets/Charts'

const meta = {
  title: 'Widgets/Charts/PieChart',
  component: PieChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof PieChart>

export default meta
type Story = StoryObj<typeof meta>

export const Full: Story = {
  args: {
    half: false,
    data: [
      { value: 30, label: 'A', color: '#3b82f6' },
      { value: 50, label: 'B', color: '#10b981' },
      { value: 20, label: 'C', color: '#f59e0b' },
    ],
    showLabels: true,
  },
}

export const Half: Story = {
  args: {
    half: true,
    data: [
      { value: 30, label: 'A', color: '#3b82f6' },
      { value: 50, label: 'B', color: '#10b981' },
      { value: 20, label: 'C', color: '#f59e0b' },
    ],
    showLabels: false,
  },
}
