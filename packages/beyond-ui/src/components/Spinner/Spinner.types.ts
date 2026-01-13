/**
 * Spinner component types
 */

import type { ViewStyle } from 'react-native'

export type SpinnerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
export type SpinnerColor = 'primary' | 'gray'

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
   * Whether to show the spinner
   * @default true
   */
  visible?: boolean
}

