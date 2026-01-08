/**
 * Dropdown Menu component
 * Menu panel with positioning logic
 * Mapped from Figma Forsured Design System
 */

import { useEffect, useState } from 'react'
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
  const [calculatedLayout, setCalculatedLayout] = useState(triggerLayout)

  // Update calculated layout when triggerLayout changes
  useEffect(() => {
    if (visible && triggerLayout) {
      setCalculatedLayout(triggerLayout)
    }
  }, [visible, triggerLayout])

  // Calculate menu position based on trigger layout and position prop
  const getMenuPosition = () => {
    const menuWidth = 246 // Fixed width from styles
    const gap = spacing[13] // 13px gap between trigger and menu
    const estimatedMenuHeight = 200 // Estimate for top positioning

    const positionStyle: Record<string, number | string> = {
      position: 'absolute' as const,
      zIndex: 9999,
      elevation: 9999, // Android
    }

    const layout = calculatedLayout || triggerLayout
    if (!layout) {
      // Fallback positioning if layout not available - position relative to viewport
      positionStyle.top = 100
      positionStyle.left = 100
      return positionStyle
    }

    const { x, y, width, height } = layout

    // On web, Modal coordinates are relative to the viewport (0,0 at top-left)
    // measureInWindow also gives viewport coordinates, so they should match
    // Ensure we're calculating from the button's bottom edge for bottom positions

    switch (position) {
      case 'bottom-right': {
        // Menu appears BELOW the button, right-aligned
        // top = button's bottom edge (y + height) + gap
        const bottomRightTop = y + height + gap
        // Ensure menu is below button (top should be greater than button bottom)
        if (bottomRightTop > y) {
          positionStyle.top = bottomRightTop
        } else {
          // Fallback: position below with minimum gap
          positionStyle.top = y + height + spacing[8]
        }

        if (Platform.OS === 'web') {
          // Right edge aligned: window width - (button left + button width)
          const rightPos = typeof window !== 'undefined' ? window.innerWidth - (x + width) : 0
          positionStyle.right = Math.max(0, rightPos)
          delete positionStyle.left
        } else {
          // Calculate left position: button left + button width - menu width
          positionStyle.left = Math.max(0, x + width - menuWidth)
          delete positionStyle.right
        }
        delete positionStyle.bottom
        break
      }
      case 'bottom-left': {
        // Menu appears BELOW the button, left-aligned
        // top = button's bottom edge (y + height) + gap
        const bottomLeftTop = y + height + gap
        // Ensure menu is below button (top should be greater than button bottom)
        if (bottomLeftTop > y) {
          positionStyle.top = bottomLeftTop
        } else {
          // Fallback: position below with minimum gap
          positionStyle.top = y + height + spacing[8]
        }
        // Left edge aligned with button's left edge
        positionStyle.left = Math.max(0, x)
        delete positionStyle.right
        delete positionStyle.bottom
        break
      }
      case 'top-right':
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            positionStyle.bottom = window.innerHeight - y + gap
            positionStyle.right = window.innerWidth - (x + width)
          }
          delete positionStyle.top
          delete positionStyle.left
        } else {
          positionStyle.top = Math.max(0, y - estimatedMenuHeight - gap)
          positionStyle.left = Math.max(0, x + width - menuWidth)
          delete positionStyle.right
          delete positionStyle.bottom
        }
        break
      case 'top-left':
        if (Platform.OS === 'web') {
          if (typeof window !== 'undefined') {
            positionStyle.bottom = window.innerHeight - y + gap
          }
          positionStyle.left = x
          delete positionStyle.top
          delete positionStyle.right
        } else {
          positionStyle.top = Math.max(0, y - estimatedMenuHeight - gap)
          positionStyle.left = Math.max(0, x)
          delete positionStyle.right
          delete positionStyle.bottom
        }
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
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss}>
        <View
          style={[styles.menu, menuPosition, style]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => {
            // Prevent touch events from bubbling to dismiss handler
            e.stopPropagation()
          }}
        >
          {children}
        </View>
      </Pressable>
    </Modal>
  )
}
