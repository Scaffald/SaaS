/**
 * Input Addon components
 * Composable addon components for Input fields
 * Maps to Figma External Addon and Left/Right Side Base components
 *
 * These components can be used independently to build custom input layouts
 *
 * @example
 * ```tsx
 * import {
 *   InputExternalAddon,
 *   InputLeftSide,
 *   InputRightSide
 * } from '@scaffald/ui'
 *
 * <View style={{ flexDirection: 'row' }}>
 *   <InputExternalAddon>https://</InputExternalAddon>
 *   <View style={inputStyle}>
 *     <InputLeftSide icon={SearchIcon} />
 *     <TextInput />
 *     <InputRightSide icon={InfoIcon} />
 *   </View>
 * </View>
 * ```
 */

import type React from 'react'
import { View, Text, type ViewStyle, type TextStyle } from 'react-native'
import { spacing } from '../../tokens/spacing'
import { colors } from '../../tokens/colors'
import { typography } from '../../tokens/typography'
import { borderRadius } from '../../tokens/borders'
import { shadows } from '../../tokens/shadows'

export interface InputExternalAddonProps {
  /**
   * Addon text content (e.g., "https://")
   */
  children: string

  /**
   * Input type variant
   * @default 'classic'
   */
  type?: 'classic' | 'line'

  /**
   * Border color (derived from input state)
   */
  borderColor?: string

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
 * External Addon (Prefix) component
 * Displays before the main input, e.g., "https://"
 */
export function InputExternalAddon({
  children,
  type = 'classic',
  borderColor = colors.border.light.default,
  style,
  textStyle,
}: InputExternalAddonProps) {
  const containerStyle: ViewStyle = {
    backgroundColor: colors.bg.light.subtle, // bg-50
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 0,
    borderColor,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderTopLeftRadius: borderRadius.m,
    borderBottomLeftRadius: borderRadius.m,
    borderTopRightRadius: borderRadius.none,
    borderBottomRightRadius: borderRadius.none,
    minHeight: 44,
    justifyContent: 'center',
    ...(type === 'classic' ? shadows.button : {}),
  }

  const textStyleBase: TextStyle = {
    ...typography.body,
    letterSpacing: 0,
    color: colors.text.light.tertiary,
  }

  return (
    <View style={[containerStyle, style]}>
      <Text style={[textStyleBase, textStyle]}>{children}</Text>
    </View>
  )
}

export interface InputLeftSideProps {
  /**
   * Icon component to display
   */
  icon?: React.ComponentType<{ size: number; color: string }>

  /**
   * Or text content
   */
  text?: string

  /**
   * Icon/Text color
   */
  color?: string

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Left Side (Leading) component
 * Displays icon or text on the left side of the input
 */
export function InputLeftSide({
  icon: Icon,
  text,
  color = colors.icon.light.muted,
  style,
}: InputLeftSideProps) {
  const iconSize = 24

  return (
    <View style={[{ justifyContent: 'flex-start' }, style]}>
      {Icon && (
        <View style={{ width: iconSize, height: iconSize }}>
          <Icon size={iconSize} color={color} />
        </View>
      )}
      {text && (
        <Text
          style={{
            ...typography.body,
            letterSpacing: 0,
            color: colors.text.light.tertiary,
          }}
        >
          {text}
        </Text>
      )}
    </View>
  )
}

export interface InputRightSideProps {
  /**
   * Icon component to display
   */
  icon?: React.ComponentType<{ size: number; color: string }>

  /**
   * Icon color
   */
  color?: string

  /**
   * Custom container style
   */
  style?: ViewStyle
}

/**
 * Right Side (Trailing) component
 * Displays icon on the right side of the input
 */
export function InputRightSide({
  icon: Icon,
  color = colors.icon.light.muted,
  style,
}: InputRightSideProps) {
  const iconSize = 20

  return (
    <View style={[{ justifyContent: 'center', alignItems: 'center' }, style]}>
      {Icon && (
        <View style={{ width: iconSize, height: iconSize }}>
          <Icon size={iconSize} color={color} />
        </View>
      )}
    </View>
  )
}
