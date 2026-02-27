/**
 * HelperText base component
 * Shared base component for helper/hint messages
 * Used by InputHelperText and HintMessage components
 *
 * @example
 * ```tsx
 * import { HelperText } from '@scaffald/ui'
 *
 * <HelperText type="error" showIcon>
 *   This field is required
 * </HelperText>
 * ```
 */

import React from 'react'
import { View, Text, type ViewStyle, type TextStyle } from 'react-native'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import { typography } from '../../tokens/typography'
import { InfoIcon } from '../Icon'
import { useThemeContext } from '../../theme'

export type HelperTextType = 'default' | 'error' | 'warning' | 'disabled'

export interface HelperTextProps {
  /**
   * Helper text content
   */
  children: string

  /**
   * Helper text type/state
   * @default 'default'
   */
  type?: HelperTextType

  /**
   * Show icon before text
   * @default false
   */
  showIcon?: boolean

  /**
   * Icon component to display (overrides default InfoIcon)
   */
  icon?: React.ComponentType<{ size: number; color: string }> | React.ReactNode

  /**
   * Icon size in pixels
   * @default 16
   */
  iconSize?: number

  /**
   * Custom container style
   */
  style?: ViewStyle

  /**
   * Custom text style
   */
  textStyle?: TextStyle

  /**
   * Maximum number of lines for text (pass-through to Text component)
   */
  numberOfLines?: number
}

/**
 * HelperText base component
 * Provides consistent helper text rendering with type support
 */
export function HelperText({
  children,
  type = 'default',
  showIcon = false,
  icon,
  iconSize = 16,
  style,
  textStyle,
  numberOfLines,
}: HelperTextProps) {
  const { theme } = useThemeContext()
  const isLight = theme === 'light'

  // Get text color based on type
  const getTextColor = (): string => {
    if (type === 'disabled') {
      return isLight ? colors.text.light.disabled : colors.text.dark.disabled
    }
    if (type === 'error') {
      return colors.error[500]
    }
    if (type === 'warning') {
      return isLight ? colors.text.light.tertiary : colors.text.dark.tertiary
    }
    return isLight ? colors.text.light.tertiary : colors.text.dark.tertiary
  }

  // Get icon color based on type
  const getIconColor = (): string => {
    if (type === 'disabled') {
      return isLight ? colors.text.light.disabled : colors.text.dark.disabled
    }
    if (type === 'error') {
      return colors.error[500]
    }
    if (type === 'warning') {
      return isLight ? colors.text.light.tertiary : colors.text.dark.tertiary
    }
    return isLight ? colors.icon.light.muted : colors.icon.dark.muted
  }

  // Render icon
  const renderIcon = () => {
    if (!showIcon) return null

    const iconColor = getIconColor()

    // If icon is provided as ReactNode, render it directly
    if (icon && typeof icon !== 'function' && React.isValidElement(icon)) {
      return <View style={{ width: iconSize, height: iconSize }}>{icon}</View>
    }

    // If icon is provided as component, render it
    if (icon && typeof icon === 'function') {
      const IconComponent = icon as React.ComponentType<{ size: number; color: string }>
      return (
        <View style={{ width: iconSize, height: iconSize }}>
          <IconComponent size={iconSize} color={iconColor} />
        </View>
      )
    }

    // Default info icon
    return (
      <View style={{ width: iconSize, height: iconSize }}>
        <InfoIcon size={iconSize} color={iconColor} />
      </View>
    )
  }

  const textStyleBase: TextStyle = {
    fontFamily: typography.body.fontFamily,
    fontSize: typography.small.fontSize,
    fontWeight: typography.body.fontWeight,
    lineHeight: typography.small.lineHeight,
    letterSpacing: 0,
    color: getTextColor(),
  }

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing[4] }, style]}>
      {renderIcon()}
      <Text style={[textStyleBase, textStyle]} numberOfLines={numberOfLines}>
        {children}
      </Text>
    </View>
  )
}

