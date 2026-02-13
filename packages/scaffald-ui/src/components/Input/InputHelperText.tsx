/**
 * Input Helper Text component
 * Composable helper text component for Input fields
 * Maps to Figma "_Hint Message Base" component
 * Uses shared HelperText component internally
 *
 * Can be used independently or as part of the Input component
 *
 * @example
 * ```tsx
 * import { InputHelperText } from '@scaffald/ui'
 *
 * <InputHelperText type="error" showIcon>
 *   This field is required
 * </InputHelperText>
 *
 * <InputHelperText type="warning">
 *   This value may be changed later
 * </InputHelperText>
 * ```
 */

import type React from 'react'
import type { ViewStyle, TextStyle } from 'react-native'
import { HelperText } from '../HelperText'
import type { HelperTextType } from '../HelperText'

export type InputHelperTextType = HelperTextType

export interface InputHelperTextProps {
  /**
   * Helper text content
   */
  children: string

  /**
   * Helper text type/state
   * @default 'default'
   */
  type?: InputHelperTextType

  /**
   * Show icon before text
   * @default false
   */
  showIcon?: boolean

  /**
   * Icon component to display (overrides default InfoIcon)
   */
  icon?: React.ComponentType<{ size: number; color: string }>

  /**
   * @deprecated Use `type="error"` instead
   */
  error?: boolean

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom text style
   */
  textStyle?: TextStyle
}

/**
 * InputHelperText component
 * Wraps HelperText component with Input-specific props
 */
export function InputHelperText({
  children,
  type: typeProp,
  showIcon = false,
  icon: IconComponent,
  error: errorDeprecated,
  style,
  textStyle,
}: InputHelperTextProps) {
  // Handle deprecated error prop with warning
  const type = typeProp ?? (errorDeprecated ? 'error' : 'default')

  if (errorDeprecated !== undefined && __DEV__) {
    console.warn(
      'InputHelperText: `error` prop is deprecated. Use `type="error"` instead.',
    )
  }

  return (
    <HelperText
      type={type}
      showIcon={showIcon}
      icon={IconComponent}
      iconSize={16}
      style={style}
      textStyle={textStyle}
    >
      {children}
    </HelperText>
  )
}
