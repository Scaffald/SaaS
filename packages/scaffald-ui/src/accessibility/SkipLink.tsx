/**
 * SkipLink component
 * Provides a skip link for keyboard users to bypass navigation
 *
 * This is a WCAG 2.1 AAA requirement for pages with repeated content.
 * The link is visually hidden until focused, then appears prominently.
 *
 * @example
 * ```tsx
 * import { SkipLink } from '@scaffald/ui'
 *
 * function App() {
 *   return (
 *     <View>
 *       <SkipLink targetId="main-content">
 *         Skip to main content
 *       </SkipLink>
 *       <Header />
 *       <Navigation />
 *       <View nativeID="main-content">
 *         <MainContent />
 *       </View>
 *     </View>
 *   )
 * }
 * ```
 */

import { forwardRef, useState, useCallback } from 'react'
import { View, Text, Pressable, StyleSheet, Platform, type ViewProps } from 'react-native'
import { colors } from '../tokens/colors'
import { spacing } from '../tokens/spacing'
import { borderRadius } from '../tokens/borders'
import { fontSize, fontWeight } from '../tokens/typography'

export interface SkipLinkProps extends Omit<ViewProps, 'children'> {
  /**
   * Text content for the skip link
   */
  children: string

  /**
   * ID of the target element to skip to
   */
  targetId: string

  /**
   * Callback when the link is activated
   */
  onSkip?: () => void
}

/**
 * Skip link component for keyboard navigation
 */
export const SkipLink = forwardRef<View, SkipLinkProps>(
  function SkipLink({ children, targetId, onSkip, style, ...props }, ref) {
    const [isFocused, setIsFocused] = useState(false)

    const handlePress = useCallback(() => {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const target = document.getElementById(targetId)
        if (target) {
          // Make target focusable if it isn't
          if (!target.hasAttribute('tabindex')) {
            target.setAttribute('tabindex', '-1')
          }
          target.focus()
          // Scroll into view
          target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }
      onSkip?.()
    }, [targetId, onSkip])

    const handleFocus = useCallback(() => {
      setIsFocused(true)
    }, [])

    const handleBlur = useCallback(() => {
      setIsFocused(false)
    }, [])

    return (
      <View
        ref={ref}
        style={[styles.container, !isFocused && styles.hidden, style]}
        {...props}
      >
        <Pressable
          onPress={handlePress}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityRole="link"
          accessibilityLabel={children}
          style={({ pressed }) => [
            styles.link,
            pressed && styles.linkPressed,
          ]}
          {...(Platform.OS === 'web' && {
            href: `#${targetId}`,
          })}
        >
          <Text style={styles.linkText}>{children}</Text>
        </Pressable>
      </View>
    )
  }
)

SkipLink.displayName = 'SkipLink'

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing[8],
    left: spacing[8],
    zIndex: 9999,
  },
  hidden: {
    position: 'absolute',
    width: 1,
    height: 1,
    padding: 0,
    margin: -1,
    overflow: 'hidden',
    borderWidth: 0,
  },
  link: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[12],
    borderRadius: borderRadius.m,
  },
  linkPressed: {
    backgroundColor: colors.primary[600],
  },
  linkText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
})
