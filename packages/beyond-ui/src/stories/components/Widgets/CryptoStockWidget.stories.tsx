/**
 * CryptoStockWidget component stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import { CryptoStockWidget } from '../../../components/Widgets/Crypto'

const meta = {
  title: 'Widgets/Crypto/CryptoStockWidget',
  component: CryptoStockWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CryptoStockWidget>

export default meta
type Story = StoryObj<typeof meta>

export const Stock01: Story = {
  args: {
    variant: 'Crypto Stock 01',
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 45000,
    change: '+5.2%',
    changeType: 'positive',
    chartData: [40000, 41000, 42000, 43000, 45000],
  },
}

export const Stock02: Story = {
  args: {
    variant: 'Crypto Stock 02',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2500,
    change: '-2.1%',
    changeType: 'negative',
  },
}
