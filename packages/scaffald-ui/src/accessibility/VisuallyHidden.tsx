/**
 * VisuallyHidden component
 * Hides content visually while keeping it accessible to screen readers
 *
 * Use this for:
 * - Labels that should be read but not seen
 * - Skip links (before focus)
 * - Additional context for screen reader users
 *
 * @example
 * ```tsx
 * import { VisuallyHidden } from '@scaffald/ui'
 *
 * // Hidden label for icon button
 * function IconButton({ icon, label }) {
 *   return (
 *     <Pressable accessibilityLabel={label}>
 *       <Icon name={icon} />
 *       <VisuallyHidden>{label}</VisuallyHidden>
 *     </Pressable>
 *   )
 * }
 *
 * // Additional context
 * function StatusBadge({ count }) {
 *   return (
 *     <View>
 *       <Text>{count}</Text>
 *       <VisuallyHidden>
 *         {count === 1 ? 'notification' : 'notifications'}
 *       </VisuallyHidden>
 *     </View>
 *   )
 * }
 * ```
 */

import { forwardRef } from 'react'
import { View, Text, StyleSheet, type ViewProps, type TextStyle } from 'react-native'

export interface VisuallyHiddenProps extends ViewProps {
  /**
   * Content to hide visually but keep accessible
   */
  children: React.ReactNode

  /**
   * Whether to render as Text instead of View
   * @default false
   */
  asText?: boolean
}

/**
 * Visually hidden content accessible to screen readers
 */
export const VisuallyHidden = forwardRef<View, VisuallyHiddenProps>(
  function VisuallyHidden({ children, asText = false, style, ...props }, ref) {
    if (asText) {
      return (
        <Text style={[styles.visuallyHidden, style as TextStyle]} {...props}>
          {children}
        </Text>
      )
    }

    return (
      <View ref={ref} style={[styles.visuallyHidden, style]} {...props}>
        {typeof children === 'string' ? (
          <Text style={styles.visuallyHidden}>{children}</Text>
        ) : (
          children
        )}
      </View>
    )
  }
)

VisuallyHidden.displayName = 'VisuallyHidden'

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
