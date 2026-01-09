/**
 * CircleChart widget stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { CircleChart } from '../../../../components/Widgets/Charts'

const meta = {
  title: 'Widgets/Charts/CircleChart',
  component: CircleChart,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CircleChart>

export default meta
type Story = StoryObj<typeof meta>

export const Vertical: Story = {
  args: {
    variant: 'vertical',
    value: 75,
  },
}

export const Horizontal: Story = {
  args: {
    variant: 'horizontal',
    value: 60,
  },
}
