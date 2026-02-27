/**
 * Input Label component
 * Composable label component for Input fields
 * Maps to Figma "_Label Base" component
 *
 * Can be used independently or as part of the Input component
 *
 * @example
 * ```tsx
 * import { InputLabel } from '@scaffald/ui'
 *
 * <InputLabel required note="(optional)" showIcon>
 *   Email Address
 * </InputLabel>
 *
 * <InputLabel type="error" required>
 *   Invalid Email
 * </InputLabel>
 * ```
 */

import type React from 'react'
import { View, Text, type ViewStyle, type TextStyle } from 'react-native'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import { typography } from '../../tokens/typography'
import { InfoIcon } from '../Icon'
import { useThemeContext } from '../../theme'

export type InputLabelType = 'default' | 'error' | 'disabled'

export interface InputLabelProps {
  /**
   * Label text
   */
  children: string

  /**
   * Label type/state
   * @default 'default'
   */
  type?: InputLabelType

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
  showIcon?: boolean

  /**
   * Icon component (overrides default InfoIcon)
   */
  icon?: React.ComponentType<{ size: number; color: string }>

  /**
   * @deprecated Use `showIcon` instead
   */
  showInfo?: boolean

  /**
   * @deprecated Use `icon` instead
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
  type = 'default',
  required = false,
  note,
  showIcon: showIconProp,
  icon: IconComponent,
  showInfo: showInfoDeprecated,
  infoIcon: InfoIconDeprecated,
  style,
  labelStyle,
  noteStyle,
}: InputLabelProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Handle deprecated props with warnings
  const showIcon = showIconProp ?? showInfoDeprecated ?? false
  const Icon = IconComponent ?? InfoIconDeprecated

  if (showInfoDeprecated && __DEV__) {
    console.warn(
      'InputLabel: `showInfo` prop is deprecated. Use `showIcon` instead.',
    )
  }
  if (InfoIconDeprecated && __DEV__) {
    console.warn(
      'InputLabel: `infoIcon` prop is deprecated. Use `icon` instead.',
    )
  }

  // Get label text color based on type
  const getLabelColor = (): string => {
    if (type === 'disabled') {
      return isLight ? colors.text.light.disabled : colors.text.dark.disabled
    }
    if (type === 'error') {
      return colors.error[500]
    }
    return isLight ? colors.text.light.primary : colors.text.dark.primary
  }

  // Get asterisk color based on type
  const getAsteriskColor = (): string => {
    if (type === 'error') {
      return colors.error[500]
    }
    return colors.primary[500]
  }

  // Get note text color based on type
  const getNoteColor = (): string => {
    if (type === 'disabled') {
      return isLight ? colors.text.light.disabled : colors.text.dark.disabled
    }
    return isLight ? colors.text.light.tertiary : colors.text.dark.tertiary
  }

  // Get icon color based on type
  const getIconColor = (): string => {
    if (type === 'disabled') {
      return isLight ? colors.text.light.disabled : colors.text.dark.disabled
    }
    return isLight ? colors.icon.light.muted : colors.icon.dark.muted
  }

  const labelTextStyle: TextStyle = {
    fontFamily: typography.bodyMedium.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.bodyMedium.fontWeight,
    lineHeight: typography.small.lineHeight,
    letterSpacing: 0,
    color: getLabelColor(),
  }

  const noteTextStyle: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.small.lineHeight,
    letterSpacing: 0,
    color: getNoteColor(),
  }

  const iconSize = 18

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }, style]}>
      <Text style={[labelTextStyle, labelStyle]}>{children}</Text>
      {required && (
        <Text style={[labelTextStyle, { color: getAsteriskColor() }]}>*</Text>
      )}
      {note && <Text style={[noteTextStyle, noteStyle]}>{note}</Text>}
      {showIcon && (
        <View style={{ width: iconSize, height: iconSize }}>
          {Icon ? (
            <Icon size={iconSize} color={getIconColor()} />
          ) : (
            <InfoIcon size={iconSize} color={getIconColor()} />
          )}
        </View>
      )}
    </View>
  )
}
