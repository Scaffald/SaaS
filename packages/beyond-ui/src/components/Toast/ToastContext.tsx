/**
 * Toast context and provider
 * Provides toast management throughout the app
 */

import type React from 'react'
import { createContext, useContext, useState, useCallback, useMemo } from 'react'
import type {
  ToastContextValue,
  ToastData,
  ToastProviderProps,
  ShowToastOptions,
} from './Toast.types'

// ============================================================================
// Context
// ============================================================================

const ToastContext = createContext<ToastContextValue | null>(null)

// ============================================================================
// Helper Functions
// ============================================================================

let toastIdCounter = 0

function generateToastId(): string {
  toastIdCounter += 1
  return `toast-${toastIdCounter}-${Date.now()}`
}

// ============================================================================
// ToastProvider Component
// ============================================================================

/**
 * ToastProvider - Provides toast context to children
 *
 * @example
 * <ToastProvider>
 *   <App />
 *   <ToastContainer />
 * </ToastProvider>
 */
export function ToastProvider({
  children,
  defaultDuration = 5000,
  maxToasts = 5,
}: ToastProviderProps): React.ReactElement {
  const [toasts, setToasts] = useState<ToastData[]>([])

  const show = useCallback(
    (options: ShowToastOptions): string => {
      const id = generateToastId()
      const toast: ToastData = {
        id,
        duration: defaultDuration,
        dismissible: true,
        variant: 'info',
        ...options,
      }

      setToasts((prev) => {
        // Remove oldest toasts if we exceed maxToasts
        const newToasts = [...prev, toast]
        if (newToasts.length > maxToasts) {
          return newToasts.slice(-maxToasts)
        }
        return newToasts
      })

      return id
    },
    [defaultDuration, maxToasts]
  )

  const info = useCallback(
    (message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>>): string => {
      return show({ message, variant: 'info', ...options })
    },
    [show]
  )

  const success = useCallback(
    (message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>>): string => {
      return show({ message, variant: 'success', ...options })
    },
    [show]
  )

  const warning = useCallback(
    (message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>>): string => {
      return show({ message, variant: 'warning', ...options })
    },
    [show]
  )

  const error = useCallback(
    (message: string, options?: Partial<Omit<ToastData, 'id' | 'message' | 'variant'>>): string => {
      return show({ message, variant: 'error', ...options })
    },
    [show]
  )

  const dismiss = useCallback((id: string): void => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const dismissAll = useCallback((): void => {
    setToasts([])
  }, [])

  const contextValue = useMemo<ToastContextValue>(
    () => ({
      show,
      info,
      success,
      warning,
      error,
      dismiss,
      dismissAll,
      toasts,
    }),
    [show, info, success, warning, error, dismiss, dismissAll, toasts]
  )

  return <ToastContext.Provider value={contextValue}>{children}</ToastContext.Provider>
}

// ============================================================================
// useToast Hook
// ============================================================================

/**
 * useToast - Hook to access toast context
 *
 * @example
 * function MyComponent() {
 *   const toast = useToast()
 *
 *   const handleSave = () => {
 *     toast.success('Changes saved successfully!')
 *   }
 *
 *   return <Button onPress={handleSave}>Save</Button>
 * }
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// ============================================================================
// Export Context
// ============================================================================

export { ToastContext }
