/**
 * BalanceWidget component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { BalanceWidget } from '../../../components/Widgets/Finance'

const meta = {
  title: 'Widgets/Finance/BalanceWidget',
  component: BalanceWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof BalanceWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Balance01: Story = {
  args: {
    variant: 'Balance 01',
    title: 'Sales Revenue',
    amount: '$5.632',
    change: '+$23.53 this month',
    changeType: 'positive',
    chartData: [
      { value: 16, label: 'Jun' },
      { value: 36, label: 'Jul' },
      { value: 22, label: 'Aug' },
      { value: 6, label: 'Sep' },
    ],
  },
}

export const Balance02: Story = {
  args: {
    variant: 'Balance 02',
    title: 'Total Revenue',
    amount: '$12,345',
    change: '+$1,234 this month',
    changeType: 'positive',
  },
}
