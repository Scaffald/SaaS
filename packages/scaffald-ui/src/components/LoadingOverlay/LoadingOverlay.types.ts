/**
 * LoadingOverlay and FullscreenSpinner type definitions
 */

import type { ViewStyle } from 'react-native'
import type { SpinnerProps } from '../Spinner'

export interface LoadingOverlayProps {
  /**
   * Whether to show a dimmed background behind the spinner
   * @default true
   */
  dimmed?: boolean

  /**
   * Opacity of the dimmed overlay (0–1) when dimmed is true
   * @default 0.4
   */
  dimOpacity?: number

  /**
   * Spinner size
   * @default 'md'
   */
  spinnerSize?: SpinnerProps['size']

  /**
   * Spinner color
   * @default 'primary'
   */
  spinnerColor?: SpinnerProps['color']

  /**
   * Container style override
   */
  style?: ViewStyle
}

export interface FullscreenSpinnerProps extends SpinnerProps {
  /**
   * Container style override
   */
  style?: ViewStyle
}
