/**
 * Crypto Widget components stories
 */

import type { Meta, StoryObj } from '@storybook/react'
import {
  CryptoStockWidget,
  CryptoBalanceWidget,
  CryptoSinglePriceWidget,
  CryptoConverterWidget,
  MarketTrendingWidget,
  FearGreedIndexWidget,
} from '../../../components/Widgets/Crypto'

const CryptoStockWidgetMeta = {
  title: 'Widgets/Crypto/CryptoStockWidget',
  component: CryptoStockWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CryptoStockWidget>

export default CryptoStockWidgetMeta
type CryptoStockWidgetStory = StoryObj<typeof CryptoStockWidget>

export const Stock01: CryptoStockWidgetStory = {
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

export const Stock02: CryptoStockWidgetStory = {
  args: {
    variant: 'Crypto Stock 02',
    symbol: 'ETH',
    name: 'Ethereum',
    price: 2500,
    change: '-2.1%',
    changeType: 'negative',
  },
}

const _CryptoBalanceWidgetMeta = {
  title: 'Widgets/Crypto/CryptoBalanceWidget',
  component: CryptoBalanceWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CryptoBalanceWidget>

export const CryptoBalance: StoryObj<typeof CryptoBalanceWidget> = {
  args: {
    symbol: 'BTC',
    balance: 0.5,
    balanceUSD: 22500,
  },
}

const _CryptoSinglePriceWidgetMeta = {
  title: 'Widgets/Crypto/CryptoSinglePriceWidget',
  component: CryptoSinglePriceWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CryptoSinglePriceWidget>

export const CryptoSinglePrice: StoryObj<typeof CryptoSinglePriceWidget> = {
  args: {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 45000,
    change: '+5.2%',
    changeType: 'positive',
    chartData: [40000, 41000, 42000, 43000, 44000, 45000],
  },
}

const _CryptoConverterWidgetMeta = {
  title: 'Widgets/Crypto/CryptoConverterWidget',
  component: CryptoConverterWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CryptoConverterWidget>

export const CryptoConverter: StoryObj<typeof CryptoConverterWidget> = {
  args: {
    fromSymbol: 'BTC',
    toSymbol: 'ETH',
    amount: '1',
    convertedAmount: '15.5',
    exchangeRate: 15.5,
  },
}

const _MarketTrendingWidgetMeta = {
  title: 'Widgets/Crypto/MarketTrendingWidget',
  component: MarketTrendingWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MarketTrendingWidget>

export const MarketTrending: StoryObj<typeof MarketTrendingWidget> = {
  args: {
    cryptocurrencies: [
      { symbol: 'BTC', name: 'Bitcoin', price: 45000, change: '+5.2%', changeType: 'positive' },
      { symbol: 'ETH', name: 'Ethereum', price: 2500, change: '+2.1%', changeType: 'positive' },
      { symbol: 'SOL', name: 'Solana', price: 100, change: '-1.5%', changeType: 'negative' },
    ],
  },
}

const _FearGreedIndexWidgetMeta = {
  title: 'Widgets/Crypto/FearGreedIndexWidget',
  component: FearGreedIndexWidget,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FearGreedIndexWidget>

export const FearGreedIndex: StoryObj<typeof FearGreedIndexWidget> = {
  args: {
    value: 45,
    label: 'Fear',
  },
}

export const FearGreedExtremeGreed: StoryObj<typeof FearGreedIndexWidget> = {
  args: {
    value: 85,
    label: 'Extreme Greed',
  },
}

export const FearGreedNeutral: StoryObj<typeof FearGreedIndexWidget> = {
  args: {
    value: 50,
    label: 'Neutral',
  },
}
