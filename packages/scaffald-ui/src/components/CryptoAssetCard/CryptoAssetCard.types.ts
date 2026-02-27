/**
 * CryptoAssetCard component types
 */

import type { ViewStyle, TextStyle } from 'react-native'
import type { IconComponent } from '../types'

export type ChangeType = 'positive' | 'negative'

export interface CryptoAssetCardProps {
  /**
   * Cryptocurrency symbol (e.g., 'BTC', 'ETH')
   */
  symbol: string

  /**
   * Cryptocurrency name (e.g., 'Bitcoin', 'Ethereum')
   */
  name: string

  /**
   * Current price in USD
   */
  price: number | string

  /**
   * Price change percentage (e.g., '+5.2%', '-1.5%')
   */
  change?: string

  /**
   * Change type (positive or negative)
   */
  changeType?: ChangeType

  /**
   * Icon component (optional)
   */
  icon?: IconComponent

  /**
   * Balance in crypto (optional)
   */
  balance?: number

  /**
   * Balance in USD (optional)
   */
  balanceUSD?: number

  /**
   * Custom styles
   */
  style?: ViewStyle

  /**
   * Custom text styles
   */
  textStyle?: TextStyle
}
