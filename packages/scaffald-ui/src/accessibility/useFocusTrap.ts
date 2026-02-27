/**
 * useFocusTrap hook
 * Traps keyboard focus within a container element
 *
 * Essential for modal dialogs, sheets, and other overlay components
 * to meet WCAG 2.1 AAA requirements for keyboard accessibility.
 *
 * @example
 * ```tsx
 * import { useFocusTrap } from '@scaffald/ui'
 *
 * function Modal({ visible, onClose, children }) {
 *   const containerRef = useRef<View>(null)
 *   const { activate, deactivate } = useFocusTrap(containerRef, {
 *     enabled: visible,
 *     escapeDeactivates: true,
 *     onDeactivate: onClose,
 *   })
 *
 *   return (
 *     <View ref={containerRef}>
 *       {children}
 *     </View>
 *   )
 * }
 * ```
 */

import { useEffect, useCallback, useRef } from 'react'
import { Platform } from 'react-native'
import type { FocusTrapConfig } from './types'

// Focusable element selectors for web
const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(', ')

export interface UseFocusTrapReturn {
  /** Manually activate the trap */
  activate: () => void
  /** Manually deactivate the trap */
  deactivate: () => void
  /** Whether the trap is currently active */
  isActive: boolean
}

/**
 * Get all focusable elements within a container (web only)
 */
function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll(FOCUSABLE_SELECTORS)
  return Array.from(elements) as HTMLElement[]
}

/**
 * Hook for trapping focus within a container
 */
export function useFocusTrap<T extends { focus?: () => void } | null>(
  containerRef: React.RefObject<T>,
  config: FocusTrapConfig = {}
): UseFocusTrapReturn {
  const {
    enabled = true,
    initialFocus,
    returnFocus = true,
    escapeDeactivates = true,
    clickOutsideDeactivates = false,
    onActivate,
    onDeactivate,
  } = config

  const isActiveRef = useRef(false)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Activate the trap
  const activate = useCallback(() => {
    if (isActiveRef.current) return
    isActiveRef.current = true

    // Web-only implementation
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement as HTMLElement

      // Focus initial element or first focusable
      const container = containerRef.current as unknown as HTMLElement
      if (container) {
        try {
          if (initialFocus?.current) {
            initialFocus.current.focus()
          } else {
            const focusables = getFocusableElements(container)
            if (focusables.length > 0) {
              focusables[0].focus()
            }
          }
        } catch (error) {
          // Silently fail if focus can't be set - modal content might not be ready yet
          if (process.env.NODE_ENV === 'development') {
            console.warn('[useFocusTrap] Failed to set initial focus:', error)
          }
        }
      }
    }

    onActivate?.()
  }, [containerRef, initialFocus, onActivate])

  // Deactivate the trap
  const deactivate = useCallback(() => {
    if (!isActiveRef.current) return
    isActiveRef.current = false

    // Return focus to previous element
    if (Platform.OS === 'web' && returnFocus && previousFocusRef.current) {
      if (typeof returnFocus === 'boolean') {
        previousFocusRef.current?.focus?.()
      } else if (returnFocus.current) {
        returnFocus.current.focus()
      }
    }

    onDeactivate?.()
  }, [returnFocus, onDeactivate])

  // Handle keyboard navigation
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web' || typeof document === 'undefined') {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isActiveRef.current) return

      const container = containerRef.current as unknown as HTMLElement
      if (!container) return

      // Handle Escape key
      if (event.key === 'Escape' && escapeDeactivates) {
        event.preventDefault()
        deactivate()
        return
      }

      // Handle Tab key for focus trapping
      if (event.key === 'Tab') {
        const focusables = getFocusableElements(container)
        if (focusables.length === 0) return

        const firstElement = focusables[0]
        const lastElement = focusables[focusables.length - 1]
        const activeElement = document.activeElement

        if (event.shiftKey) {
          // Shift+Tab: if on first element, go to last
          if (activeElement === firstElement) {
            event.preventDefault()
            lastElement.focus()
          }
        } else {
          // Tab: if on last element, go to first
          if (activeElement === lastElement) {
            event.preventDefault()
            firstElement.focus()
          }
        }
      }
    }

    const handleClick = (event: MouseEvent) => {
      if (!isActiveRef.current || !clickOutsideDeactivates) return

      const container = containerRef.current as unknown as HTMLElement
      if (!container) return

      // Check if click was outside the container
      if (!container.contains(event.target as Node)) {
        deactivate()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    if (clickOutsideDeactivates) {
      document.addEventListener('click', handleClick, true)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      if (clickOutsideDeactivates) {
        document.removeEventListener('click', handleClick, true)
      }
    }
  }, [enabled, escapeDeactivates, clickOutsideDeactivates, containerRef, deactivate])

  // Activate/deactivate based on enabled prop
  useEffect(() => {
    if (enabled) {
      activate()
    } else {
      deactivate()
    }

    return () => {
      if (isActiveRef.current) {
        deactivate()
      }
    }
  }, [enabled, activate, deactivate])

  return {
    activate,
    deactivate,
    isActive: isActiveRef.current,
  }
}
