/**
 * Button component
 * Fully-featured button component mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { Button } from '@unicornlove/beyond-ui'
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
 * // Icon-only button
 * <Button iconStart={MyIcon} iconOnly />
 * ```
 */

import { useMemo } from 'react'
import { Pressable, Text, View, ActivityIndicator, Platform } from 'react-native'
import type { ButtonProps } from './Button.types'
import { getButtonStyles } from './Button.styles'
import { useThemeContext } from '../../playground/ThemeProvider'
import { useInteractiveState } from '../../hooks/useInteractiveState'

export function Button({
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
  style,
  textStyle,
  onPress,
  ...pressableProps
}: ButtonProps) {
  const isDisabled = disabled || loading
  const { theme } = useThemeContext()
  const { isHovered, interactiveProps } = useInteractiveState(isDisabled)

  // Get styles based on current props and theme
  const styles = useMemo(
    () => getButtonStyles(color, variant, size, isDisabled, iconOnly, theme),
    [color, variant, size, isDisabled, iconOnly, theme]
  )

  // Calculate icon size based on button size
  const iconSize = size === 'sm' ? 20 : 24

  return (
    <Pressable
      disabled={isDisabled}
      onPress={onPress}
      accessibilityRole="button"
      {...interactiveProps}
      style={({ pressed }) => [
        styles.container,
        fullWidth && { width: '100%' },
        // Hover state (web only)
        isHovered && !isDisabled && Platform.OS === 'web' && { opacity: 0.9 },
        // Pressed state
        pressed && !isDisabled && { opacity: 0.8 },
        style,
      ]}
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator size="small" color={styles.iconColor} />
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
}

// Export types
export type { ButtonProps, ButtonColor, ButtonVariant, ButtonSize } from './Button.types'
