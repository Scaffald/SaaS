/**
 * Modal component
 * Base modal dialog with overlay and backdrop
 * Mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { Modal } from '@unicornlove/beyond-ui'
 *
 * // Controlled modal
 * <Modal visible={isVisible} onClose={() => setIsVisible(false)}>
 *   <ModalHeader title="Modal Title" />
 *   <ModalContent>Content here</ModalContent>
 *   <ModalActions primaryAction={{ label: 'Save', onPress: handleSave }} />
 * </Modal>
 *
 * // Uncontrolled modal
 * <Modal defaultVisible={true} onClose={handleClose}>
 *   <ModalHeader title="Modal Title" />
 *   <ModalContent>Content here</ModalContent>
 * </Modal>
 * ```
 */

import { useState, useEffect, useCallback } from 'react'
import { View, Modal as RNModal, Pressable, Platform } from 'react-native'
import type { ModalProps } from './Modal.types'
import { getModalStyles } from './Modal.styles'
import { useThemeContext } from '../../playground/ThemeProvider'

export function Modal({
  visible: controlledVisible,
  defaultVisible = false,
  onClose,
  closeOnBackdropPress = true,
  closeOnEscapeKey = true,
  width = 520,
  style,
  children,
  testID,
}: ModalProps) {
  const { theme } = useThemeContext()
  const styles = getModalStyles(theme, width)

  // Controlled/uncontrolled visibility state
  const [internalVisible, setInternalVisible] = useState(defaultVisible)
  const isControlled = controlledVisible !== undefined
  const isVisible = isControlled ? controlledVisible : internalVisible

  // Handle close - memoized to avoid recreating on each render
  const handleClose = useCallback(() => {
    if (!isControlled) {
      setInternalVisible(false)
    }
    onClose?.()
  }, [isControlled, onClose])

  // Handle Escape key press (web only)
  useEffect(() => {
    if (!closeOnEscapeKey || !isVisible || Platform.OS !== 'web') {
      return
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.keyCode === 27) {
        handleClose()
      }
    }

    if (typeof document !== 'undefined') {
      document.addEventListener('keydown', handleEscape)
      return () => {
        document.removeEventListener('keydown', handleEscape)
      }
    }
  }, [isVisible, closeOnEscapeKey, handleClose])

  // Handle backdrop press
  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      handleClose()
    }
  }

  if (!isVisible) {
    return null
  }

  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
      testID={testID}
    >
      <Pressable
        style={styles.overlay}
        onPress={handleBackdropPress}
        accessibilityRole="button"
        accessibilityLabel="Close modal"
      >
        <View
          style={[styles.container, style]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => {
            // Prevent touch events from bubbling to backdrop handler
            e.stopPropagation()
          }}
          {...(Platform.OS === 'web' && {
            onMouseDown: (e: any) => {
              // Prevent mouse events from bubbling to backdrop handler
              e.stopPropagation()
            },
            role: 'dialog',
            'aria-modal': 'true',
          } as any)}
          accessible={true}
          accessibilityRole="alert"
          accessibilityViewIsModal={true}
        >
          {children}
        </View>
      </Pressable>
    </RNModal>
  )
}
