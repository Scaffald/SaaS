/**
 * AppearanceThemeCard component
 * Theme selection card with visual preview
 *
 * @example
 * ```tsx
 * import { AppearanceThemeCard } from '@scaffald/ui'
 *
 * <AppearanceThemeCard
 *   variant="light"
 *   selected={selectedTheme === 'light'}
 *   onPress={() => setSelectedTheme('light')}
 * />
 * ```
 */

import { View, Text, Pressable } from 'react-native'
import type { AppearanceThemeCardProps } from './AppearanceThemeCard.types'
import { getAppearanceThemeCardStyles } from './AppearanceThemeCard.styles'
import { useThemeContext } from '../../theme'
import { useInteractiveState } from '../../hooks/useInteractiveState'
import { colors } from '../../tokens/colors'
import { borderRadius } from '../../tokens/borders'

export function AppearanceThemeCard({
  variant = 'light',
  selected = false,
  style,
  disabled = false,
  onPress,
  ...pressableProps
}: AppearanceThemeCardProps) {
  const { theme } = useThemeContext()
  const { isHovered, interactiveProps } = useInteractiveState(disabled ?? false)
  const styles = getAppearanceThemeCardStyles(theme, variant, selected)

  const renderPreview = () => {
    if (variant === 'system') {
      // System shows split between light and dark
      return (
        <View style={[styles.preview, styles.previewSystem]}>
          <View style={[styles.previewLight, { flex: 1 }]} />
          <View style={[styles.previewDark, { flex: 1 }]} />
          {/* Add some UI elements to show it's a preview */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 15,
              backgroundColor: variant === 'system' ? colors.gray[800] : colors.gray[100],
            }}
          />
          {/* Mock UI elements */}
          <View
            style={{
              position: 'absolute',
              top: 5,
              left: 5,
              width: 30,
              height: 6,
              borderRadius: borderRadius.max,
              backgroundColor: variant === 'system' ? colors.gray[600] : colors.gray[200],
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 5,
              left: 40,
              width: 30,
              height: 6,
              borderRadius: borderRadius.max,
              backgroundColor: variant === 'system' ? colors.gray[600] : colors.gray[200],
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 23,
              left: 5,
              width: 60,
              height: 6,
              borderRadius: borderRadius.max,
              backgroundColor: variant === 'system' ? colors.gray[600] : colors.gray[200],
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 23,
              right: 5,
              width: 20,
              height: 6,
              borderRadius: borderRadius.max,
              backgroundColor: colors.error[500],
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 23,
              right: 30,
              width: 20,
              height: 6,
              borderRadius: borderRadius.max,
              backgroundColor: colors.success[500],
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 34,
              left: 5,
              right: 23,
              height: 4,
              borderRadius: borderRadius.xxs,
              backgroundColor: variant === 'system' ? colors.gray[600] : colors.gray[200],
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 34,
              right: 5,
              width: 20,
              height: 4,
              borderRadius: borderRadius.xxs,
              backgroundColor: variant === 'system' ? colors.gray[600] : colors.gray[200],
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 5,
              left: 80,
              width: 30,
              height: 6,
              borderRadius: borderRadius.max,
              backgroundColor: variant === 'system' ? colors.gray[200] : colors.gray[600],
            }}
          />
        </View>
      )
    }

    const previewBg = variant === 'light' ? colors.gray[50] : colors.gray[900]
    const elementColor = variant === 'light' ? colors.gray[200] : colors.gray[600]

    return (
      <View style={[styles.preview, { backgroundColor: previewBg }]}>
        {/* Mock UI elements to show theme preview */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 15,
            backgroundColor: variant === 'light' ? colors.gray[100] : colors.gray[800],
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 5,
            left: 5,
            width: 30,
            height: 6,
            borderRadius: borderRadius.max,
            backgroundColor: elementColor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 5,
            left: 40,
            width: 30,
            height: 6,
            borderRadius: borderRadius.max,
            backgroundColor: elementColor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 23,
            left: 5,
            width: 60,
            height: 6,
            borderRadius: borderRadius.max,
            backgroundColor: elementColor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 23,
            right: 5,
            width: 20,
            height: 6,
            borderRadius: borderRadius.max,
            backgroundColor: colors.error[500],
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 23,
            right: 30,
            width: 20,
            height: 6,
            borderRadius: borderRadius.max,
            backgroundColor: colors.success[500],
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 34,
            left: 5,
            right: 23,
            height: 4,
            borderRadius: borderRadius.xxs,
            backgroundColor: elementColor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 34,
            right: 5,
            width: 20,
            height: 4,
            borderRadius: borderRadius.xxs,
            backgroundColor: elementColor,
          }}
        />
        <View
          style={{
            position: 'absolute',
            top: 5,
            left: 80,
            width: 30,
            height: 6,
            borderRadius: borderRadius.max,
            backgroundColor: elementColor,
          }}
        />
      </View>
    )
  }

  const getLabel = () => {
    switch (variant) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'system':
        return 'System Default'
      default:
        return 'Light'
    }
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected, disabled: disabled ?? false }}
      {...interactiveProps}
      style={({ pressed }) => [
        styles.container,
        isHovered && !disabled && { opacity: 0.9 },
        pressed && !disabled && { opacity: 0.8 },
        style,
      ]}
      {...pressableProps}
    >
      {renderPreview()}
      <Text style={styles.label}>{getLabel()}</Text>
    </Pressable>
  )
}
