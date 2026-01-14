/**
 * Finance Widget component types
 */

import type { ViewStyle } from 'react-native'

/**
 * Balance widget variant
 */
export type BalanceWidgetVariant = 'Balance 01' | 'Balance 02' | 'Balance 03' | 'Balance 04 (Stock)'

/**
 * Spending limit widget variant
 */
export type SpendingLimitWidgetVariant = 'Spending Limit 01' | 'Spending Limit 02'

/**
 * Credit card widget variant
 */
export type CreditCardWidgetVariant = 'Interactive - Credit Card' | 'Interactive - Credit Card - Limit On'

/**
 * Bar chart data point
 */
export interface BarChartDataPoint {
  /**
   * Bar value
   */
  value: number

  /**
   * Bar label (e.g., "Jun", "Jul")
   */
  label?: string

  /**
   * Bar color
   */
  color?: string
}

/**
 * Balance Widget props
 */
export interface BalanceWidgetProps {
  /**
   * Widget variant
   * @default 'Balance 01'
   */
  variant?: BalanceWidgetVariant

  /**
   * Widget title
   */
  title: string

  /**
   * Currency amount (numeric value as string, e.g., "5.632")
   * Currency symbol "$" will be added automatically
   */
  amount: string | number

  /**
   * Change value and period (e.g., "+$23.53 this month")
   * @deprecated Use changeValue and changePeriod instead for better control
   */
  change?: string

  /**
   * Change value (e.g., "+$23.53")
   */
  changeValue?: string

  /**
   * Change period text (e.g., "this month")
   */
  changePeriod?: string

  /**
   * Change type (positive/negative)
   * @default 'positive'
   */
  changeType?: 'positive' | 'negative'

  /**
   * Bar chart data
   * Value represents inset percentage from top (16, 36, 22, 6 for example)
   */
  chartData?: BarChartDataPoint[]

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Spending Limit Widget props
 */
export interface SpendingLimitWidgetProps {
  /**
   * Widget variant
   * @default 'Spending Limit 01'
   */
  variant?: SpendingLimitWidgetVariant

  /**
   * Spending limit amount
   */
  limit: number | string

  /**
   * Amount used
   */
  used: number | string

  /**
   * Amount remaining
   */
  remaining?: number | string

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Credit Card Widget props
 */
export interface CreditCardWidgetProps {
  /**
   * Widget variant
   * @default 'Interactive - Credit Card'
   */
  variant?: CreditCardWidgetVariant

  /**
   * Card number (last 4 digits)
   */
  cardNumber?: string

  /**
   * Cardholder name
   */
  cardholderName?: string

  /**
   * Card balance
   */
  balance?: string

  /**
   * Credit limit
   */
  limit?: string

  /**
   * Card type/brand
   */
  cardType?: string

  /**
   * On press handler
   */
  onPress?: () => void

  /**
   * Custom container style
   */
  style?: ViewStyle
}
