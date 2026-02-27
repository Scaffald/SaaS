/**
 * LegendIndicator component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { LegendIndicator } from '../../../components/Widgets/LegendIndicator'

const meta = {
  title: 'Widgets/LegendIndicator',
  component: LegendIndicator,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LegendIndicator>

export default meta
type Story = StoryObj<typeof meta>

export const Horizontal: Story = {
  args: {
    items: [
      { label: 'Current Period', color: '#10b981' },
      { label: 'Previous Period', color: '#af92d9' },
    ],
    orientation: 'horizontal',
  },
}

export const Vertical: Story = {
  args: {
    items: [
      { label: 'Series 1', color: '#6366f1' },
      { label: 'Series 2', color: '#36bffa' },
      { label: 'Series 3', color: '#3b82f6' },
      { label: 'Series 4', color: '#10b981' },
      { label: 'Series 5', color: '#afe556' },
    ],
    orientation: 'vertical',
  },
}
