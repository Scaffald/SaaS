/**
 * Crypto Widget component types
 */

import type { ViewStyle } from 'react-native'

/**
 * Crypto stock widget variant
 */
export type CryptoStockWidgetVariant = 'Crypto Stock 01' | 'Crypto Stock 02'

/**
 * Crypto Stock Widget props
 */
export interface CryptoStockWidgetProps {
  /**
   * Widget variant
   * @default 'Crypto Stock 01'
   */
  variant?: CryptoStockWidgetVariant

  /**
   * Cryptocurrency symbol (e.g., "BTC", "ETH")
   */
  symbol: string

  /**
   * Cryptocurrency name
   */
  name?: string

  /**
   * Current price
   */
  price: number | string

  /**
   * Price change percentage
   */
  change?: string

  /**
   * Change type (positive/negative)
   * @default 'positive'
   */
  changeType?: 'positive' | 'negative'

  /**
   * Chart data for price history
   */
  chartData?: number[]

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Crypto Balance Widget props
 */
export interface CryptoBalanceWidgetProps {
  /**
   * Cryptocurrency symbol
   */
  symbol: string

  /**
   * Balance amount
   */
  balance: number | string

  /**
   * Balance in USD
   */
  balanceUSD?: number | string

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Crypto Single Price Widget props
 */
export interface CryptoSinglePriceWidgetProps {
  /**
   * Cryptocurrency symbol
   */
  symbol: string

  /**
   * Cryptocurrency name
   */
  name?: string

  /**
   * Current price
   */
  price: number | string

  /**
   * Price change percentage
   */
  change?: string

  /**
   * Change type
   * @default 'positive'
   */
  changeType?: 'positive' | 'negative'

  /**
   * Chart data
   */
  chartData?: number[]

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Crypto Converter Widget props
 */
export interface CryptoConverterWidgetProps {
  /**
   * From cryptocurrency symbol
   */
  fromSymbol?: string

  /**
   * To cryptocurrency symbol
   */
  toSymbol?: string

  /**
   * Amount to convert
   */
  amount?: number | string

  /**
   * Converted amount
   */
  convertedAmount?: number | string

  /**
   * Exchange rate
   */
  exchangeRate?: number

  /**
   * On amount change handler
   */
  onAmountChange?: (amount: string) => void

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Market Trending Widget props
 */
export interface MarketTrendingWidgetProps {
  /**
   * Array of trending cryptocurrencies
   */
  cryptocurrencies?: Array<{
    symbol: string
    name?: string
    price: number | string
    change: string
    changeType: 'positive' | 'negative'
    chartData?: number[]
  }>

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Fear & Greed Index Widget props
 */
export interface FearGreedIndexWidgetProps {
  /**
   * Index value (0-100)
   */
  value: number

  /**
   * Index label (e.g., "Extreme Fear", "Greed")
   */
  label?: string

  /**
   * Custom container style
   */
  style?: ViewStyle
}
