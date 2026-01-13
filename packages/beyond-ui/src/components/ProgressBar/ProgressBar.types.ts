/**
 * ProgressBar component types
 */

import type { ViewStyle, TextStyle } from 'react-native'

export type ProgressBarColor = 'primary' | 'gray' | 'error' | 'success'
export type ProgressBarOrientation = 'horizontal' | 'vertical'
export type ProgressIndicatorIconType = 'spinner' | 'check' | 'cancel' | 'none'
export type HintMessageType = 'default' | 'error' | 'warning'

export interface ProgressBarBaseProps {
  /**
   * Progress value (0-100)
   */
  value: number

  /**
   * Color variant
   * @default 'primary'
   */
  color?: ProgressBarColor

  /**
   * Custom style for the progress bar container
   */
  style?: ViewStyle

  /**
   * Custom style for the progress fill
   */
  fillStyle?: ViewStyle
}

export interface ProgressIndicatorProps {
  /**
   * Progress value (0-100)
   */
  value: number

  /**
   * Icon type to display
   * @default 'spinner'
   */
  iconType?: ProgressIndicatorIconType

  /**
   * Custom text to display instead of percentage (e.g., "49% (1min left)")
   */
  customText?: string

  /**
   * Whether to show the percentage text
   * @default true
   */
  showText?: boolean

  /**
   * Custom style for the indicator container
   */
  style?: ViewStyle

  /**
   * Custom style for the text
   */
  textStyle?: TextStyle
}

export interface ProgressBarProps {
  /**
   * Progress value (0-100)
   */
  value: number

  /**
   * Optional label text (e.g., "Uploading...")
   */
  label?: string

  /**
   * Optional hint message (e.g., "178MB of 445MB")
   */
  hintMessage?: string

  /**
   * Hint message type
   * @default 'default'
   */
  hintMessageType?: HintMessageType

  /**
   * Whether to show the label
   * @default true
   */
  showLabel?: boolean

  /**
   * Whether to show the progress indicator (percentage + icon)
   * @default true
   */
  showIndicator?: boolean

  /**
   * Whether to show the hint message
   * @default true
   */
  showHintMessage?: boolean

  /**
   * Whether to show icon in hint message
   * @default false
   */
  showHintIcon?: boolean

  /**
   * Orientation of the progress bar
   * @default 'vertical'
   */
  orientation?: ProgressBarOrientation

  /**
   * Color variant
   * @default 'primary'
   */
  color?: ProgressBarColor

  /**
   * Icon type for progress indicator
   * @default 'spinner'
   */
  indicatorIconType?: ProgressIndicatorIconType

  /**
   * Custom text for progress indicator (overrides percentage)
   */
  indicatorCustomText?: string

  /**
   * Custom style for the progress bar container
   */
  style?: ViewStyle

  /**
   * Custom style for the label text
   */
  labelStyle?: TextStyle

  /**
   * Custom style for the hint message text
   */
  hintMessageStyle?: TextStyle
}

