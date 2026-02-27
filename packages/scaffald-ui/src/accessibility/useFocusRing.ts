/**
 * useFocusRing hook
 * Provides cross-platform focus ring styling
 *
 * Ensures focus indicators are visible on both web and native platforms,
 * meeting WCAG 2.1 AAA requirements for focus visibility.
 *
 * @example
 * ```tsx
 * import { useFocusRing } from '@scaffald/ui'
 *
 * function Button({ children }) {
 *   const { isFocused, focusProps, focusRingStyle } = useFocusRing()
 *
 *   return (
 *     <Pressable
 *       {...focusProps}
 *       style={[
 *         styles.button,
 *         isFocused && focusRingStyle,
 *       ]}
 *     >
 *       {children}
 *     </Pressable>
 *   )
 * }
 * ```
 */

import { useState, useCallback, useMemo } from 'react'
import { Platform, type ViewStyle } from 'react-native'
import { colors } from '../tokens/colors'

export type FocusRingVariant = 'default' | 'primary' | 'error' | 'inset'
export type FocusRingSize = 'sm' | 'md' | 'lg'

export interface UseFocusRingOptions {
  /** Focus ring color variant */
  variant?: FocusRingVariant
  /** Focus ring size/offset */
  size?: FocusRingSize
  /** Whether the element is disabled (no focus ring when disabled) */
  disabled?: boolean
  /** Auto-detect keyboard vs mouse focus (web only) */
  autoDetect?: boolean
  /** Custom focus ring color */
  color?: string
  /** Border radius to match component */
  borderRadius?: number
}

export interface FocusProps {
  onFocus?: () => void
  onBlur?: () => void
}

export interface UseFocusRingReturn {
  /** Whether the element is currently focused */
  isFocused: boolean
  /** Props to spread on the focusable element */
  focusProps: FocusProps
  /** Style to apply when focused */
  focusRingStyle: ViewStyle
}

// Track if keyboard was used for focus
let keyboardActive = false

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  document.addEventListener('keydown', (e) => {
    if (!e.metaKey && !e.ctrlKey && !e.altKey) {
      keyboardActive = true
    }
  })
  document.addEventListener('mousedown', () => {
    keyboardActive = false
  })
  document.addEventListener('touchstart', () => {
    keyboardActive = false
  })
}

/**
 * Get focus ring style for the given variant and platform
 */
function getFocusRingStyle(
  variant: FocusRingVariant,
  size: FocusRingSize,
  customColor?: string,
  borderRadius?: number
): ViewStyle {
  // Get focus color based on variant
  const focusColor = customColor || (() => {
    switch (variant) {
      case 'primary':
        return colors.primary[500]
      case 'error':
        return colors.error[500]
      case 'inset':
        return colors.primary[500]
      default:
        return colors.primary[500]
    }
  })()

  // Get offset based on size
  const offset = size === 'sm' ? 2 : size === 'lg' ? 4 : 3
  const width = size === 'sm' ? 2 : size === 'lg' ? 3 : 2

  if (Platform.OS === 'web') {
    // Web: Use box-shadow for focus ring
    const inset = variant === 'inset' ? 'inset ' : ''
    return {
      boxShadow: `${inset}0 0 0 ${width}px ${focusColor}`,
    } as ViewStyle
  }

  // Native: Use border-based focus ring
  return {
    borderWidth: width,
    borderColor: focusColor,
    ...(borderRadius !== undefined && { borderRadius: borderRadius + offset }),
  }
}

/**
 * Hook for cross-platform focus ring styling
 */
export function useFocusRing(options: UseFocusRingOptions = {}): UseFocusRingReturn {
  const {
    variant = 'default',
    size = 'md',
    disabled = false,
    autoDetect = true,
    color,
    borderRadius,
  } = options

  const [isFocused, setIsFocused] = useState(false)

  const onFocus = useCallback(() => {
    if (disabled) return

    // On web with autoDetect, only show focus ring for keyboard focus
    if (Platform.OS === 'web' && autoDetect && !keyboardActive) {
      setIsFocused(false)
      return
    }

    setIsFocused(true)
  }, [disabled, autoDetect])

  const onBlur = useCallback(() => {
    setIsFocused(false)
  }, [])

  const focusProps = useMemo((): FocusProps => {
    if (disabled) return {}
    return { onFocus, onBlur }
  }, [disabled, onFocus, onBlur])

  const focusRingStyle = useMemo((): ViewStyle => {
    if (!isFocused || disabled) return {}
    return getFocusRingStyle(variant, size, color, borderRadius)
  }, [isFocused, disabled, variant, size, color, borderRadius])

  return {
    isFocused,
    focusProps,
    focusRingStyle,
  }
}

/**
 * Get static focus ring style (for components that manage their own focus state)
 */
export function getFocusRingStyles(
  isFocused: boolean,
  options: Omit<UseFocusRingOptions, 'disabled' | 'autoDetect'> = {}
): ViewStyle {
  if (!isFocused) return {}
  const { variant = 'default', size = 'md', color, borderRadius } = options
  return getFocusRingStyle(variant, size, color, borderRadius)
}
