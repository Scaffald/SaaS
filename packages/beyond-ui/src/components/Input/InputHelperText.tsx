/**
 * Input Helper Text component
 * Composable helper text component for Input fields
 * Maps to Figma "_Hint Message Base" component
 * 
 * Can be used independently or as part of the Input component
 * 
 * @example
 * ```tsx
 * import { InputHelperText } from '@unicornlove/beyond-ui'
 * 
 * <InputHelperText error showIcon icon={ErrorIcon}>
 *   This field is required
 * </InputHelperText>
 * ```
 */

import type React from 'react'
import { View, Text, type ViewStyle, type TextStyle } from 'react-native'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import { typography } from '../../tokens/typography'

export interface InputHelperTextProps {
  /**
   * Helper text content
   */
  children: string

  /**
   * Show as error state
   * @default false
   */
  error?: boolean

  /**
   * Show icon before text
   * @default false
   */
  showIcon?: boolean

  /**
   * Icon component to display
   */
  icon?: React.ComponentType<{ size: number; color: string }>

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom text style
   */
  textStyle?: TextStyle
}

export function InputHelperText({
  children,
  error = false,
  showIcon = false,
  icon: Icon,
  style,
  textStyle,
}: InputHelperTextProps) {
  const textStyleBase: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.small.lineHeight,
    letterSpacing: 0,
    color: error ? colors.error[500] : colors.text.light.tertiary,
  }

  const iconSize = 20
  const iconColor = error ? colors.error[500] : colors.icon.light.muted

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }, style]}>
      {showIcon && Icon && (
        <View style={{ width: iconSize, height: iconSize }}>
          <Icon size={iconSize} color={iconColor} />
        </View>
      )}
      <Text style={[textStyleBase, textStyle]}>{children}</Text>
    </View>
  )
}

