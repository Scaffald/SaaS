/**
 * useFocusVisible hook
 * Detects keyboard-initiated focus vs mouse/touch focus
 *
 * This implements the :focus-visible behavior for React Native Web,
 * showing focus indicators only when the user navigates with keyboard.
 *
 * @example
 * ```tsx
 * import { useFocusVisible } from '@scaffald/ui'
 *
 * function Button() {
 *   const { isFocusVisible, focusVisibleProps } = useFocusVisible()
 *
 *   return (
 *     <Pressable
 *       {...focusVisibleProps}
 *       style={[
 *         styles.button,
 *         isFocusVisible && styles.focusRing,
 *       ]}
 *     >
 *       Button
 *     </Pressable>
 *   )
 * }
 * ```
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { Platform } from '../Platform'

export interface FocusVisibleProps {
  onFocus?: () => void
  onBlur?: () => void
}

export interface UseFocusVisibleReturn {
  /** Whether focus should be visually indicated (keyboard navigation) */
  isFocusVisible: boolean
  /** Whether the element is focused (any method) */
  isFocused: boolean
  /** Props to spread on the focusable element */
  focusVisibleProps: FocusVisibleProps
}

// Global state to track if keyboard is being used
let hadKeyboardEvent = false
let hadFocusVisibleRecently = false
let hadFocusVisibleRecentlyTimeout: ReturnType<typeof setTimeout> | null = null

/**
 * Track global keyboard/mouse state for focus-visible detection
 */
function setupGlobalListeners() {
  if (typeof document === 'undefined') return

  // Track keyboard events
  document.addEventListener(
    'keydown',
    (e) => {
      // Ignore modifier keys
      if (e.metaKey || e.altKey || e.ctrlKey) return
      hadKeyboardEvent = true
    },
    true
  )

  // Track mouse/touch events
  document.addEventListener(
    'mousedown',
    () => {
      hadKeyboardEvent = false
    },
    true
  )

  document.addEventListener(
    'pointerdown',
    () => {
      hadKeyboardEvent = false
    },
    true
  )

  document.addEventListener(
    'touchstart',
    () => {
      hadKeyboardEvent = false
    },
    true
  )

  // Track visibility changes to maintain state
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (hadFocusVisibleRecently) {
        hadKeyboardEvent = true
      }
    }
  })
}

// Set up global listeners once
let listenersInitialized = false

/**
 * Hook for detecting keyboard-initiated focus
 */
export function useFocusVisible(): UseFocusVisibleReturn {
  const [isFocused, setIsFocused] = useState(false)
  const [isFocusVisible, setIsFocusVisible] = useState(false)
  const isKeyboardRef = useRef(false)

  // Initialize global listeners
  useEffect(() => {
    if (Platform.isWeb && !listenersInitialized) {
      setupGlobalListeners()
      listenersInitialized = true
    }
  }, [])

  const onFocus = useCallback(() => {
    setIsFocused(true)

    // Check if this focus was triggered by keyboard
    if (Platform.isWeb && hadKeyboardEvent) {
      setIsFocusVisible(true)
      isKeyboardRef.current = true
    }
  }, [])

  const onBlur = useCallback(() => {
    setIsFocused(false)
    setIsFocusVisible(false)

    // Track recent focus-visible for tab switching
    if (isKeyboardRef.current) {
      hadFocusVisibleRecently = true
      if (hadFocusVisibleRecentlyTimeout) {
        clearTimeout(hadFocusVisibleRecentlyTimeout)
      }
      hadFocusVisibleRecentlyTimeout = setTimeout(() => {
        hadFocusVisibleRecently = false
      }, 100)
    }
    isKeyboardRef.current = false
  }, [])

  // On native platforms, always show focus indicator
  if (!Platform.isWeb) {
    return {
      isFocusVisible: isFocused,
      isFocused,
      focusVisibleProps: {},
    }
  }

  return {
    isFocusVisible,
    isFocused,
    focusVisibleProps: {
      onFocus,
      onBlur,
    },
  }
}

/**
 * Check if focus-visible is currently active
 * Useful for components that need to check state synchronously
 */
export function isFocusVisibleActive(): boolean {
  return hadKeyboardEvent
}
