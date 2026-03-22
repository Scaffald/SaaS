/**
 * Spinner component types
 */

import type { ViewStyle } from 'react-native'

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type SpinnerColor = 'primary' | 'gray'
/** Visual style variant. 'ios' renders the iOS 26 8-spoke activity indicator. */
export type SpinnerVariant = 'default' | 'ios'

export interface SpinnerProps {
  /**
   * Size of the spinner
   * @default 'md'
   */
  size?: SpinnerSize

  /**
   * Color variant
   * @default 'primary'
   */
  color?: SpinnerColor

  /**
   * Custom style for the spinner container
   */
  style?: ViewStyle

  /**
   * Visual style variant. 'ios' renders iOS 26 8-spoke indicator.
   * @default 'default'
   */
  variant?: SpinnerVariant

  /**
   * Whether to show the spinner
   * @default true
   */
  visible?: boolean
}
