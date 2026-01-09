/**
 * HintMessage component
 * Displays helper text with optional icon and type styling
 * Now uses shared HelperText component for consistency
 */

import type React from 'react'
import type { ViewStyle, TextStyle } from 'react-native'
import { HelperText } from '../HelperText'
import type { HelperTextType } from '../HelperText'
import type { HintMessageType } from './ProgressBar.types'

export interface HintMessageProps {
  /**
   * Message text
   */
  message: string

  /**
   * Message type
   * @default 'default'
   */
  type?: HintMessageType

  /**
   * Whether to show icon
   * @default false
   */
  showIcon?: boolean

  /**
   * Custom icon component
   */
  icon?: React.ReactNode

  /**
   * Custom style for the container
   */
  style?: ViewStyle

  /**
   * Custom style for the text
   */
  textStyle?: TextStyle
}

/**
 * Map HintMessageType to HelperTextType
 */
function mapHintMessageTypeToHelperTextType(type?: HintMessageType): HelperTextType {
  switch (type) {
    case 'error':
      return 'error'
    case 'warning':
      return 'warning'
    default:
      return 'default'
  }
}

/**
 * HintMessage component
 * Wraps HelperText component with ProgressBar-specific props
 */
export function HintMessage({
  message,
  type = 'default',
  showIcon = false,
  icon,
  style,
  textStyle,
}: HintMessageProps) {
  return (
    <HelperText
      type={mapHintMessageTypeToHelperTextType(type)}
      showIcon={showIcon}
      icon={icon}
      iconSize={16}
      style={style}
      textStyle={textStyle}
      numberOfLines={1}
    >
      {message}
    </HelperText>
  )
}

