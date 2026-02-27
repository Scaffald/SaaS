/**
 * LiveRegion component
 * Creates an ARIA live region for dynamic content announcements
 *
 * Use this for content that updates dynamically and should be
 * announced to screen reader users.
 *
 * @example
 * ```tsx
 * import { LiveRegion } from '@scaffald/ui'
 *
 * // Announce form validation errors
 * function FormField({ error }) {
 *   return (
 *     <View>
 *       <TextInput {...props} />
 *       <LiveRegion priority="polite">
 *         {error}
 *       </LiveRegion>
 *     </View>
 *   )
 * }
 *
 * // Announce loading status
 * function LoadingIndicator({ isLoading }) {
 *   return (
 *     <LiveRegion priority="polite" atomic>
 *       {isLoading ? 'Loading...' : 'Content loaded'}
 *     </LiveRegion>
 *   )
 * }
 * ```
 */

import { forwardRef, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Platform, AccessibilityInfo, type ViewProps } from 'react-native'
import type { AriaLive, AriaAtomic, AriaRelevant } from './types'

export interface LiveRegionProps extends ViewProps {
  /**
   * Content to announce
   */
  children: React.ReactNode

  /**
   * Priority level for announcements
   * - 'polite': Waits for user to be idle (default)
   * - 'assertive': Interrupts user immediately
   * - 'off': No announcements
   * @default 'polite'
   */
  priority?: AriaLive

  /**
   * Whether to announce the entire region or just changes
   * @default true
   */
  atomic?: AriaAtomic

  /**
   * What types of changes to announce
   * @default 'additions text'
   */
  relevant?: AriaRelevant

  /**
   * Whether to hide content visually (announce only)
   * @default false
   */
  visuallyHidden?: boolean
}

/**
 * ARIA live region for dynamic content announcements
 */
export const LiveRegion = forwardRef<View, LiveRegionProps>(
  function LiveRegion(
    {
      children,
      priority = 'polite',
      atomic = true,
      relevant = 'additions text',
      visuallyHidden = false,
      style,
      ...props
    },
    ref
  ) {
    const previousContentRef = useRef<string | null>(null)

    // On native, announce content changes using AccessibilityInfo
    useEffect(() => {
      if (Platform.OS !== 'web' && priority !== 'off') {
        const content = typeof children === 'string' ? children : ''

        // Only announce if content changed
        if (content && content !== previousContentRef.current) {
          AccessibilityInfo.announceForAccessibility(content)
          previousContentRef.current = content
        }
      }
    }, [children, priority])

    // Don't render if disabled
    if (priority === 'off') {
      return null
    }

    return (
      <View
        ref={ref}
        style={[visuallyHidden && styles.visuallyHidden, style]}
        accessibilityRole="none"
        // Web-specific ARIA props
        {...(Platform.OS === 'web' && {
          'aria-live': priority,
          'aria-atomic': atomic,
          'aria-relevant': relevant,
        })}
        // Native accessibility
        accessible={true}
        accessibilityLiveRegion={priority === 'assertive' ? 'assertive' : 'polite'}
        {...props}
      >
        {typeof children === 'string' ? (
          <Text style={visuallyHidden ? styles.visuallyHidden : undefined}>
            {children}
          </Text>
        ) : (
          children
        )}
      </View>
    )
  }
)

LiveRegion.displayName = 'LiveRegion'

const styles = StyleSheet.create({
  visuallyHidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    borderWidth: 0,
  },
})
