/**
 * Input Label component
 * Composable label component for Input fields
 * Maps to Figma "_Label Base" component
 *
 * Can be used independently or as part of the Input component
 *
 * @example
 * ```tsx
 * import { InputLabel } from '@unicornlove/beyond-ui'
 *
 * <InputLabel required note="(optional)" showInfo>
 *   Email Address
 * </InputLabel>
 * ```
 */

import type React from 'react'
import { View, Text, type ViewStyle, type TextStyle } from 'react-native'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import { typography } from '../../tokens/typography'

export interface InputLabelProps {
  /**
   * Label text
   */
  children: string

  /**
   * Show required asterisk
   * @default false
   */
  required?: boolean

  /**
   * Show helper note text next to label (e.g., "(optional)")
   */
  note?: string

  /**
   * Show info tooltip icon
   * @default false
   */
  showInfo?: boolean

  /**
   * Info icon component
   */
  infoIcon?: React.ComponentType<{ size: number; color: string }>

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom label text style
   */
  labelStyle?: TextStyle

  /**
   * Custom note text style
   */
  noteStyle?: TextStyle
}

export function InputLabel({
  children,
  required = false,
  note,
  showInfo = false,
  infoIcon: InfoIcon,
  style,
  labelStyle,
  noteStyle,
}: InputLabelProps) {
  const labelTextStyle: TextStyle = {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
    letterSpacing: 0,
    color: colors.text.primary,
  }

  const noteTextStyle: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.small.lineHeight,
    letterSpacing: 0,
    color: colors.text.light.tertiary,
  }

  const iconSize = 18

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }, style]}>
      <Text style={[labelTextStyle, labelStyle]}>{children}</Text>
      {required && <Text style={[labelTextStyle, { color: colors.primary[500] }]}>*</Text>}
      {note && <Text style={[noteTextStyle, noteStyle]}>{note}</Text>}
      {showInfo && InfoIcon && (
        <View style={{ width: iconSize, height: iconSize }}>
          <InfoIcon size={iconSize} color={colors.icon.light.muted} />
        </View>
      )}
    </View>
  )
}
