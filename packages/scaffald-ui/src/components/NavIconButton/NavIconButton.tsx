/**
 * NavIconButton component
 * Icon-only navigation button with optional badges
 * Maps to Figma "_Nav icon button" component
 *
 * @example
 * ```tsx
 * import { NavIconButton } from '@scaffald/ui'
 * import { Bell } from 'lucide-react-native'
 *
 * // Basic icon button
 * <NavIconButton icon={Bell} onPress={() => console.log('Pressed')} />
 *
 * // With dot badge
 * <NavIconButton
 *   icon={Bell}
 *   badge="dot"
 *   showBadge
 *   onPress={() => console.log('Pressed')}
 * />
 *
 * // With number badge (outline variant)
 * <NavIconButton
 *   icon={Bell}
 *   badge="number"
 *   badgeValue={5}
 *   showBadge
 *   variant="outline"
 *   state="hover"
 *   onPress={() => console.log('Pressed')}
 * />
 * ```
 */

import { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import type { NavIconButtonProps } from './NavIconButton.types'
import {
  getContainerStyles,
  getIconColor,
  getBadgeStyles,
  getBadgeTextStyles,
  getIconSize,
} from './NavIconButton.styles'
import { useThemeContext } from '../../theme'
import { Bell } from 'lucide-react-native'

export function NavIconButton({
  icon: IconComponent,
  badge,
  badgeValue,
  showBadge = false,
  state: stateProp,
  variant = 'light',
  disabled = false,
  onPress,
  style,
  accessibilityLabel,
}: NavIconButtonProps) {
  const { theme } = useThemeContext()
  const [internalHovered, setInternalHovered] = useState(false)
  const [internalPressed, setInternalPressed] = useState(false)

  // Determine current state
  let currentState: NavIconButtonProps['state'] = stateProp || 'default'
  if (!stateProp) {
    if (internalPressed) {
      currentState = 'pressed'
    } else if (internalHovered) {
      currentState = 'hover'
    }
  }

  const iconSize = getIconSize()
  const iconColor = getIconColor(variant, currentState, disabled, theme)
  const containerStyles = getContainerStyles(variant, currentState, disabled, theme)

  // Use Bell icon as default if none provided
  const Icon = IconComponent || Bell

  const buttonContent = (
    <View style={[containerStyles, style]} pointerEvents="box-none">
      {/* Icon */}
      <View style={styles.iconContainer}>
        <Icon size={iconSize} color={iconColor} />
      </View>

      {/* Badge */}
      {showBadge && badge && (
        <View style={getBadgeStyles(badge, variant, currentState)}>
          {badge === 'number' && badgeValue !== undefined && (
            <Text style={getBadgeTextStyles(badge, variant)}>
              {typeof badgeValue === 'number' && badgeValue > 99 ? '99+' : String(badgeValue)}
            </Text>
          )}
        </View>
      )}
    </View>
  )

  if (!onPress) {
    return buttonContent
  }

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setInternalPressed(true)}
      onPressOut={() => setInternalPressed(false)}
      {...(Platform.OS === 'web' && {
        onMouseEnter: () => setInternalHovered(true),
        onMouseLeave: () => setInternalHovered(false),
      } as any)}
      style={({ pressed }) => [
        styles.pressable,
        pressed && Platform.OS !== 'web' && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || 'Navigation button'}
      accessibilityState={{ disabled }}
    >
      {buttonContent}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  pressable: {
    position: 'relative',
  },
  pressed: {
    opacity: 0.8,
  },
  iconContainer: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
})