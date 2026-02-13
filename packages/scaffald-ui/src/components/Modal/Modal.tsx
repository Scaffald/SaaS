/**
 * Modal component
 * Base modal dialog with overlay and backdrop
 * Mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { Modal } from '@scaffald/ui'
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
import { View, Modal as RNModal, Platform, type ViewStyle } from 'react-native'
import type { ModalProps } from './Modal.types'
import { getModalStyles } from './Modal.styles'
import { useThemeContext } from '../../theme'
import { useFocusTrap } from '../../accessibility/useFocusTrap'

const logger = {
  debug: (msg: string, data?: Record<string, unknown>) => {
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      if (data) console.debug(msg, data)
      else console.debug(msg)
    }
  },
}

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
  
  // Track when modal was opened to prevent premature onRequestClose calls
  // MUST be declared before any conditional returns to maintain hook order
  const openedAtRef = useRef<number | null>(null)
  
  // Track last backdrop click time to prevent accidental closes from rapid events
  const lastBackdropClickRef = useRef<number>(0)

  // Controlled/uncontrolled visibility state
  const [internalVisible, setInternalVisible] = useState(defaultVisible)
  const isControlled = controlledVisible !== undefined
  const isVisible = isControlled ? controlledVisible : internalVisible

  // Handle close - memoized to avoid recreating on each render
  const handleClose = useCallback(() => {
    if (Platform.OS === 'web' && process.env.NODE_ENV === 'development') {
      // Log close events on web for debugging (only in dev)
      logger.debug('Modal handleClose called', {
        isControlled,
      })
    }
    if (!isControlled) {
      setInternalVisible(false)
    }
    onClose?.()
  }, [isControlled, onClose])

  // Focus trap for accessibility - trap focus within modal when open
  // Always call useFocusTrap with the same parameters to maintain hook order
  // The hook internally handles the enabled state safely
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
      // Track when modal opened
      openedAtRef.current = Date.now()
    } else {
      // Reset for next open
      setModalScale(0.95)
      setModalOpacity(0)
      openedAtRef.current = null
    }
  }, [isVisible])

  // Computed style for modal content
  const animatedModalStyle = useMemo(() => ({
    transform: [{ scale: modalScale }],
    opacity: modalOpacity,
  }), [modalScale, modalOpacity])

  // Escape key is now handled by useFocusTrap

  // Handle onRequestClose from React Native Modal
  // On web, this can be called inappropriately when focus changes or inputs are interacted with
  // We completely ignore it on web since we handle closing via Escape (useFocusTrap) and backdrop click
  // On native, it's used for the Android back button
  // MUST be declared before any conditional returns to maintain hook order
  const handleRequestClose = useCallback(() => {
    // On web, completely ignore onRequestClose - it's unreliable and triggers on focus changes
    // We handle closing via Escape key (useFocusTrap) and backdrop click instead
    if (Platform.OS === 'web') {
      return // No-op on web
    }
    // On native (Android back button), allow it
    if (closeOnBackdropPress) {
      handleClose()
    }
  }, [closeOnBackdropPress, handleClose])

  // Handle backdrop press
  const handleBackdropPress = useCallback(() => {
    if (closeOnBackdropPress) {
      handleClose()
    }
  }, [closeOnBackdropPress, handleClose])

  // Handle backdrop click for web - using View with onClick to avoid nested button issue
  // Added defensive checks to prevent accidental closes from focus changes or rapid events
  // MUST be declared before any conditional returns to maintain hook order
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    // Prevent if modal was just opened (within 200ms)
    if (openedAtRef.current && Date.now() - openedAtRef.current < 200) {
      if (Platform.OS === 'web' && process.env.NODE_ENV === 'development') {
        logger.debug('Modal: Ignoring backdrop click - modal just opened')
      }
      return
    }

    // Prevent rapid successive clicks (debounce)
    const now = Date.now()
    if (now - lastBackdropClickRef.current < 100) {
      if (Platform.OS === 'web' && process.env.NODE_ENV === 'development') {
        logger.debug('Modal: Ignoring backdrop click - too rapid')
      }
      return
    }
    lastBackdropClickRef.current = now
    
    // Only close if clicking directly on the backdrop, not on the modal content
    // Verify it's an actual mouse click event (not a programmatic event)
    const isDirectBackdropClick = e.target === e.currentTarget
    const isValidClick = e.type === 'click' && (e.button === undefined || e.button === 0)
    
    // Additional check: ensure the click originated from a user interaction
    // by checking if defaultPrevented is false (programmatic clicks often have this set)
    const isUserClick = !e.defaultPrevented
    
    if (Platform.OS === 'web' && process.env.NODE_ENV === 'development') {
      logger.debug('Modal: Backdrop click event', {
        isDirectBackdropClick,
        isValidClick,
        isUserClick,
        closeOnBackdropPress,
        target: e.target?.constructor?.name,
        currentTarget: e.currentTarget?.constructor?.name,
        type: e.type,
        button: e.button,
        defaultPrevented: e.defaultPrevented,
      })
    }

    if (
      isDirectBackdropClick &&
      closeOnBackdropPress &&
      isValidClick &&
      isUserClick
    ) {
      if (Platform.OS === 'web' && process.env.NODE_ENV === 'development') {
        logger.debug('Modal: Closing via backdrop click')
      }
      handleClose()
    } else {
      if (Platform.OS === 'web' && process.env.NODE_ENV === 'development') {
        logger.debug('Modal: Ignoring backdrop click - conditions not met', {
          isDirectBackdropClick,
          isValidClick,
          isUserClick,
        })
      }
    }
  }, [closeOnBackdropPress, handleClose])

  // No-op function for web to prevent React Native Modal from closing unexpectedly
  // MUST be declared before any conditional returns to maintain hook order
  const noOpRequestClose = useCallback(() => {
    // Intentionally do nothing - we handle closing via Escape key and backdrop click
  }, [])

  if (!isVisible) {
    return null
  }

  return (
    <RNModal
      visible={isVisible}
      transparent
      animationType="fade"
      {...(Platform.OS === 'web' 
        ? { onRequestClose: noOpRequestClose } // Use no-op on web to prevent unwanted closes
        : { onRequestClose: handleRequestClose }
      )}
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
