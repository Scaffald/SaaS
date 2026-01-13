/**
 * Toast component types
 * Toast is a notification component for showing temporary messages
 */

import type { ReactNode } from 'react'
import type { ViewStyle, StyleProp } from 'react-native'

/**
 * Toast variant determines the visual style and semantic meaning
 */
export type ToastVariant = 'info' | 'success' | 'warning' | 'error'

/**
 * Toast position on screen
 */
export type ToastPosition = 'top' | 'top-left' | 'top-right' | 'bottom' | 'bottom-left' | 'bottom-right'

/**
 * Individual toast data
 */
export interface ToastData {
  /** Unique identifier for the toast */
  id: string
  /** Toast title (optional) */
  title?: string
  /** Toast message content */
  message: string | ReactNode
  /** Semantic variant */
  variant?: ToastVariant
  /** Duration in milliseconds before auto-dismiss (0 = no auto-dismiss) */
  duration?: number
  /** Whether the toast can be dismissed by the user */
  dismissible?: boolean
  /** Custom icon (overrides default variant icon) */
  icon?: ReactNode
  /** Action button configuration */
  action?: ToastAction
  /** Callback when toast is dismissed */
  onDismiss?: () => void
}

/**
 * Toast action button configuration
 */
export interface ToastAction {
  /** Action button label */
  label: string
  /** Callback when action is clicked */
  onPress: () => void
}

/**
 * Toast component props (for rendering individual toast)
 */
export interface ToastProps extends Omit<ToastData, 'id'> {
  /** Unique identifier */
  id: string
  /** Callback to dismiss this toast */
  onDismiss: () => void
  /** Additional styles */
  style?: StyleProp<ViewStyle>
  /** Test ID for testing */
  testID?: string
}

/**
 * ToastContainer component props
 */
export interface ToastContainerProps {
  /** Position on screen */
  position?: ToastPosition
  /** Maximum number of toasts visible at once */
  maxToasts?: number
  /** Gap between toasts */
  gap?: number
  /** Additional styles */
  style?: StyleProp<ViewStyle>
}

/**
 * ToastProvider component props
 */
export interface ToastProviderProps {
  /** Children to wrap */
  children: ReactNode
  /** Default toast duration in milliseconds */
  defaultDuration?: number
  /** Default position for toasts */
  defaultPosition?: ToastPosition
  /** Maximum number of toasts visible at once */
  maxToasts?: number
}

/**
 * Toast context value
 */
export interface ToastContextValue {
  /** Show a new toast */
  show: (toast: Omit<ToastData, 'id'>) => string
  /** Show an info toast (convenience method) */
  info: (message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>>) => string
  /** Show a success toast (convenience method) */
  success: (message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>>) => string
  /** Show a warning toast (convenience method) */
  warning: (message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>>) => string
  /** Show an error toast (convenience method) */
  error: (message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>>) => string
  /** Dismiss a specific toast */
  dismiss: (id: string) => void
  /** Dismiss all toasts */
  dismissAll: () => void
  /** Current toasts */
  toasts: ToastData[]
}

/**
 * Options for creating a toast programmatically
 */
export type ShowToastOptions = Omit<ToastData, 'id'>
