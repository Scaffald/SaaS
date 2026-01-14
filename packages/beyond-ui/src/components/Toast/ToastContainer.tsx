/**
 * ToastContainer component
 * Renders all active toasts in the specified position
 */

import type React from 'react'
import { useMemo } from 'react'
import { View, StyleSheet, type ViewStyle } from 'react-native'
import { spacing } from '../../tokens/spacing'
import { useToast } from './ToastContext'
import { Toast } from './Toast'
import type { ToastContainerProps, ToastPosition } from './Toast.types'

// ============================================================================
// Constants
// ============================================================================

const POSITION_STYLES: Record<ToastPosition, ViewStyle> = {
  top: {
    top: spacing[16],
    left: '50%',
    transform: [{ translateX: -180 }], // Half of container width
    alignItems: 'center',
  },
  'top-left': {
    top: spacing[16],
    left: spacing[16],
  },
  'top-right': {
    top: spacing[16],
    right: spacing[16],
  },
  bottom: {
    bottom: spacing[16],
    left: '50%',
    transform: [{ translateX: -180 }], // Half of container width
    alignItems: 'center',
  },
  'bottom-left': {
    bottom: spacing[16],
    left: spacing[16],
  },
  'bottom-right': {
    bottom: spacing[16],
    right: spacing[16],
  },
}

// ============================================================================
// ToastContainer Component
// ============================================================================

/**
 * ToastContainer - Renders all active toasts
 *
 * Place this component at the root of your app, after ToastProvider.
 *
 * @example
 * <ToastProvider>
 *   <App />
 *   <ToastContainer position="top-right" />
 * </ToastProvider>
 */
export function ToastContainer({
  position = 'top-right',
  maxToasts = 5,
  gap = 8,
  style,
}: ToastContainerProps): React.ReactElement | null {
  const { toasts, dismiss } = useToast()

  const positionStyle = useMemo<ViewStyle>(() => {
    return {
      ...POSITION_STYLES[position],
      gap,
    }
  }, [position, gap])

  // Limit visible toasts
  const visibleToasts = useMemo(() => {
    return toasts.slice(-maxToasts)
  }, [toasts, maxToasts])

  if (visibleToasts.length === 0) {
    return null
  }

  // Reverse order for bottom positions so newest appears at the bottom
  const orderedToasts = position.startsWith('bottom')
    ? [...visibleToasts].reverse()
    : visibleToasts

  return (
    <View style={[styles.container, positionStyle, style]} pointerEvents="box-none">
      {orderedToasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          message={toast.message}
          variant={toast.variant}
          duration={toast.duration}
          dismissible={toast.dismissible}
          icon={toast.icon}
          action={toast.action}
          onDismiss={() => {
            toast.onDismiss?.()
            dismiss(toast.id)
          }}
          testID={`toast-${toast.id}`}
        />
      ))}
    </View>
  )
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 9999,
    width: 360,
    maxWidth: '100%',
  },
})
