/**
 * TradeControls component types
 */

import type { ViewStyle } from 'react-native'

export type TradeMode = 'buy' | 'sell'

export interface TradeAsset {
  symbol: string
  name: string
  price: number
}

export interface TradeControlsProps {
  /**
   * Trade mode (buy or sell)
   * @default 'buy'
   */
  mode?: TradeMode

  /**
   * Asset being traded
   */
  asset?: TradeAsset

  /**
   * Amount value (controlled)
   */
  amount?: string

  /**
   * Price value (controlled)
   */
  price?: string

  /**
   * Total value (calculated or controlled)
   */
  total?: string

  /**
   * Available balance
   */
  availableBalance?: number

  /**
   * Available balance in USD
   */
  availableBalanceUSD?: number

  /**
   * Callback when amount changes
   */
  onAmountChange?: (value: string) => void

  /**
   * Callback when price changes
   */
  onPriceChange?: (value: string) => void

  /**
   * Callback when trade is submitted
   */
  onSubmit?: (mode: TradeMode, amount: string, price: string) => void

  /**
   * Whether controls are disabled
   * @default false
   */
  disabled?: boolean

  /**
   * Custom styles
   */
  style?: ViewStyle
}
