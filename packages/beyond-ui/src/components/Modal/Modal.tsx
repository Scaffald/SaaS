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

import { useState, useEffect, useCallback, forwardRef, useRef, useMemo } from 'react'
import { View, Modal as RNModal, Platform } from 'react-native'
import type { ModalProps } from './Modal.types'
import { getModalStyles } from './Modal.styles'
import { useThemeContext } from '../../playground/ThemeProvider'
import { useFocusTrap } from '../../accessibility/useFocusTrap'

export const Modal = forwardRef<View, ModalProps>(function Modal({
  visible: controlledVisible,
  defaultVisible = false,
  onClose,
  closeOnBackdropPress = true,
  closeOnEscapeKey = true,
  width = 520,
  style,
  children,
  testID,
}, ref) {
  const { theme } = useThemeContext()
  const styles = getModalStyles(theme, width)
  const modalContentRef = useRef<View>(null)

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

  // Focus trap for accessibility - trap focus within modal when open
  useFocusTrap(modalContentRef, {
    enabled: isVisible,
    returnFocus: true,
    escapeDeactivates: closeOnEscapeKey,
    onDeactivate: closeOnEscapeKey ? handleClose : undefined,
  })

  // Combine forwarded ref with internal modalContentRef
  const setRefs = useCallback(
    (node: View | null) => {
      // Set internal ref
      ;(modalContentRef as React.MutableRefObject<View | null>).current = node
      // Forward ref
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ;(ref as React.MutableRefObject<View | null>).current = node
      }
    },
    [ref]
  )

  // Animation state - using regular React state for compatibility
  const [modalScale, setModalScale] = useState(0.95)
  const [modalOpacity, setModalOpacity] = useState(0)

  // Animate modal when visibility changes
  useEffect(() => {
    if (isVisible) {
      setModalScale(1)
      setModalOpacity(1)
    } else {
      // Reset for next open
      setModalScale(0.95)
      setModalOpacity(0)
    }
  }, [isVisible])

  // Computed style for modal content
  const animatedModalStyle = useMemo(() => ({
    transform: [{ scale: modalScale }],
    opacity: modalOpacity,
  }), [modalScale, modalOpacity])

  // Escape key is now handled by useFocusTrap

  // Handle backdrop press
  const handleBackdropPress = () => {
    if (closeOnBackdropPress) {
      handleClose()
    }
  }

  if (!isVisible) {
    return null
  }

  // Handle backdrop click for web - using View with onClick to avoid nested button issue
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking directly on the backdrop, not on the modal content
    if (e.target === e.currentTarget && closeOnBackdropPress) {
      handleClose()
    }
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
      <View
        style={styles.overlay}
        onTouchEnd={handleBackdropPress}
        {...(Platform.OS === 'web' && {
          onClick: handleBackdropClick,
        } as Record<string, unknown>)}
      >
        <View
          ref={setRefs}
          style={[styles.container, style, animatedModalStyle]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={(e) => {
            // Prevent touch events from bubbling to backdrop handler
            e.stopPropagation()
          }}
          {...(Platform.OS === 'web' && {
            onClick: (e: React.MouseEvent) => {
              // Prevent click events from bubbling to backdrop handler
              e.stopPropagation()
            },
            role: 'dialog',
            'aria-modal': 'true',
            'aria-labelledby': testID ? `${testID}-title` : undefined,
          } as Record<string, unknown>)}
          accessible={true}
          accessibilityRole="none"
          accessibilityViewIsModal={true}
        >
          {children}
        </View>
      </View>
    </RNModal>
  )
})

Modal.displayName = 'Modal'
