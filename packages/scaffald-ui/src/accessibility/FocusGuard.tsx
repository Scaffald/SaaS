/**
 * FocusGuard component
 * Creates invisible focus boundary markers for focus trapping
 *
 * Used at the start and end of focus trap containers to detect
 * when focus leaves the container and redirect it back inside.
 *
 * @example
 * ```tsx
 * import { FocusGuard } from '@scaffald/ui'
 *
 * function FocusTrapContainer({ children }) {
 *   const handleFocusStart = () => {
 *     // Focus last element in container
 *   }
 *
 *   const handleFocusEnd = () => {
 *     // Focus first element in container
 *   }
 *
 *   return (
 *     <View>
 *       <FocusGuard onFocus={handleFocusStart} />
 *       {children}
 *       <FocusGuard onFocus={handleFocusEnd} />
 *     </View>
 *   )
 * }
 * ```
 */

import { forwardRef, useCallback } from 'react'
import { View, StyleSheet, Platform, type ViewProps } from 'react-native'

export interface FocusGuardProps extends ViewProps {
  /**
   * Callback when the guard receives focus
   */
  onFocus?: () => void
}

/**
 * Invisible focus boundary marker
 */
export const FocusGuard = forwardRef<View, FocusGuardProps>(
  function FocusGuard({ onFocus, style, ...props }, ref) {
    const handleFocus = useCallback(() => {
      onFocus?.()
    }, [onFocus])

    // Only render on web where tab navigation applies
    if (Platform.OS !== 'web') {
      return null
    }

    return (
      <View
        ref={ref}
        style={[styles.guard, style]}
        // Web-specific prop for tab navigation
        {...(Platform.OS === 'web' && { tabIndex: 0 })}
        onFocus={handleFocus}
        accessible={false}
        importantForAccessibility="no"
        {...props}
      />
    )
  }
)

FocusGuard.displayName = 'FocusGuard'

const styles = StyleSheet.create({
  guard: {
    width: 1,
    height: 0,
    padding: 0,
    margin: 0,
    overflow: 'hidden',
    borderWidth: 0,
  },
})
