/**
 * Dropdown Item component
 * Individual menu item for Dropdown component
 * Mapped from Figma Forsured Design System
 */

import React from 'react'
import { Pressable, Text, View, StyleSheet } from 'react-native'
import type { DropdownItemProps } from './Dropdown.types'
import { getDropdownStyles } from './Dropdown.styles'
import { colors } from '../../tokens/colors'

export function DropdownItem({
  children,
  checked = false,
  selected = false,
  disabled = false,
  icon: Icon,
  onPress,
  style,
  textStyle,
  ...pressableProps
}: DropdownItemProps) {
  const styles = getDropdownStyles()
  const isDisabled = disabled
  const isSelected = selected || checked

  const itemStyles = [
    styles.item,
    isSelected && {
      backgroundColor: colors.bg.light.selected,
    },
    isDisabled && {
      opacity: 0.5,
    },
    style,
  ]

  const textStyles = [
    styles.itemText,
    isDisabled && {
      color: colors.text.light.disabled,
    },
    textStyle,
  ]

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        ...itemStyles,
        pressed && !isDisabled && {
          opacity: 0.8,
        },
      ]}
      {...pressableProps}
    >
      {/* Icon or Checkbox */}
      {Icon ? (
        <Icon size={20} color={styles.iconColor} />
      ) : checked ? (
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked && (
            <Text style={checkboxCheckmarkStyle}>✓</Text>
          )}
        </View>
      ) : (
        <View style={{ width: 20, height: 20 }} />
      )}

      {/* Item Text */}
      <Text style={textStyles}>{children}</Text>
    </Pressable>
  )
}

const checkboxCheckmarkStyle = {
  color: colors.white,
  fontSize: 14,
  fontWeight: 'bold' as const,
}

