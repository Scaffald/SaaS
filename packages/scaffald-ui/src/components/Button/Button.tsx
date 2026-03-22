/**
 * Button component
 * Fully-featured button component mapped from Figma Forsured Design System
 *
 * Use the `loading` prop for loading state; do not put a Spinner or other
 * large indicator in children, or the indicator may overflow the button.
 *
 * @example
 * ```tsx
 * import { Button } from '@scaffald/ui'
 *
 * // Primary filled button
 * <Button color="primary" variant="filled" onPress={() => console.log('Pressed')}>
 *   Click me
 * </Button>
 *
 * // Button with icon
 * <Button iconStart={MyIcon} color="primary">
 *   With Icon
 * </Button>
 *
 * // Loading state (use the prop, not a Spinner in children)
 * <Button loading>Saving</Button>
 *
 * // Icon-only button
 * <Button iconStart={MyIcon} iconOnly />
 *
 * // With ref
 * const buttonRef = useRef<View>(null)
 * <Button ref={buttonRef}>Click me</Button>
 * ```
 */

import { forwardRef, useMemo } from 'react'
import { Pressable, Text, View, ActivityIndicator, Platform } from 'react-native'
import type { ButtonProps } from './Button.types'
import { getButtonStyles, getButtonIconSize } from './Button.styles'
import { useThemeContext } from '../../theme'
import { useInteractiveState } from '../../hooks/useInteractiveState'

export const Button = forwardRef<View, ButtonProps>(function Button({
  children,
  color = 'gray',
  variant = 'filled',
  size = 'md',
  disabled = false,
  fullWidth = false,
  iconStart: IconStart,
  iconEnd: IconEnd,
  iconOnly = false,
  loading = false,
  destructive = false,
  style,
  textStyle,
  onPress,
  ...pressableProps
}, ref) {
  const isDisabled = disabled || loading
  const { theme } = useThemeContext()
  const { isHovered, interactiveProps } = useInteractiveState(isDisabled)

  // Get styles based on current props and theme
  const styles = useMemo(
    () => getButtonStyles(color, variant, size, isDisabled, iconOnly, theme, destructive),
    [color, variant, size, isDisabled, iconOnly, theme, destructive]
  )

  // Calculate icon/loading size based on button size
  const iconSize = getButtonIconSize(size)
  const loadingSize = iconSize

  return (
    <Pressable
      ref={ref}
      disabled={isDisabled}
      onPress={onPress}
      accessibilityRole="button"
      {...interactiveProps}
      style={({ pressed }) => [
        styles.container,
        fullWidth && { width: '100%' },
        // Hover state (web only) - darken background instead of reducing opacity
        isHovered && !isDisabled && Platform.OS === 'web' && styles.hover,
        // Pressed state - darken background more instead of reducing opacity
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <View
          style={{
            width: iconSize,
            height: iconSize,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          <ActivityIndicator size="small" color={styles.iconColor} />
        </View>
      ) : (
        <>
          {/* Icon Start */}
          {IconStart && (
            <View style={{ width: iconSize, height: iconSize }}>
              <IconStart size={iconSize} color={styles.iconColor} />
            </View>
          )}

          {/* Button Text */}
          {!iconOnly && children && (
            <Text style={[styles.text, textStyle]}>
              {typeof children === 'string' ? children : children}
            </Text>
          )}

          {/* Icon End */}
          {IconEnd && !iconOnly && (
            <View style={{ width: iconSize, height: iconSize }}>
              <IconEnd size={iconSize} color={styles.iconColor} />
            </View>
          )}
        </>
      )}
    </Pressable>
  )
})

Button.displayName = 'Button'

// Export types
export type { ButtonProps, ButtonColor, ButtonVariant, ButtonSize } from './Button.types'
