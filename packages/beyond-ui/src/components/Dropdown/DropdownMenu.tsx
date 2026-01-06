/**
 * Dropdown Menu component
 * Menu panel with positioning logic
 * Mapped from Figma Forsured Design System
 */

import React from 'react'
import { View, Modal, Pressable, StyleSheet, Platform } from 'react-native'
import type { DropdownMenuProps } from './Dropdown.types'
import { getDropdownStyles } from './Dropdown.styles'
import { spacing } from '../../tokens/spacing'

export function DropdownMenu({
  children,
  position,
  visible,
  triggerLayout,
  onDismiss,
  style,
}: DropdownMenuProps) {
  const styles = getDropdownStyles()

  // Calculate menu position based on trigger layout and position prop
  const getMenuPosition = () => {
    if (!triggerLayout) {
      return {}
    }

    const { x, y, width, height } = triggerLayout
    const menuWidth = 246 // Fixed width from styles
    const gap = spacing[13] // 13px gap between trigger and menu
    const menuOffsetY = height + gap

    const positionStyle: Record<string, number> = {}

    switch (position) {
      case 'bottom-right':
        positionStyle.top = y + menuOffsetY
        if (Platform.OS === 'web') {
          positionStyle.right = typeof window !== 'undefined' ? window.innerWidth - x - width : 0
        } else {
          positionStyle.left = x + width - menuWidth
        }
        break
      case 'bottom-left':
        positionStyle.top = y + menuOffsetY
        positionStyle.left = x
        break
      case 'top-right':
        positionStyle.bottom = typeof window !== 'undefined' && Platform.OS === 'web' 
          ? window.innerHeight - y 
          : undefined
        if (Platform.OS === 'web') {
          positionStyle.right = typeof window !== 'undefined' ? window.innerWidth - x - width : 0
        } else {
          positionStyle.left = x + width - menuWidth
        }
        break
      case 'top-left':
        positionStyle.bottom = typeof window !== 'undefined' && Platform.OS === 'web'
          ? window.innerHeight - y
          : undefined
        positionStyle.left = x
        break
    }

    return positionStyle
  }

  if (!visible) {
    return null
  }

  const menuPosition = getMenuPosition()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}
    >
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onDismiss}
      >
        <View style={[styles.menu, menuPosition, style]} onStartShouldSetResponder={() => true}>
          {children}
        </View>
      </Pressable>
    </Modal>
  )
}

