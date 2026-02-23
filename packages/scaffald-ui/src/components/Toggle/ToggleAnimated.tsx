/**
 * Toggle with Reanimated animations
 * Uses useSharedValue and useAnimatedStyle unconditionally.
 * Only rendered when Reanimated is available.
 */

import { useState, useMemo, useEffect } from 'react'
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { boxShadows } from '../../tokens/shadows'
import type { ToggleProps } from './Toggle.types'
import { useThemeContext } from '../../theme'
import { HelperText } from '../HelperText'
import { useInteractiveState } from '../../hooks/useInteractiveState'
import { useHaptics } from '../../platform/useHaptics'
import { AnimatedView } from '../../animation'
import {
  useSharedValueAsserted,
  useAnimatedStyleAsserted,
  withSpringAsserted,
} from '../../animation/reanimated.types'
import { useReducedMotion } from '../../animation/useReducedMotion'
import { springConfigs } from '../../animation/presets'

export function ToggleAnimated({
  checked: checkedProp,
  onChange,
  size = 'md',
  color = 'primary',
  disabled = false,
  error = false,
  errorMessage,
  showError = true,
  label,
  helperText,
  optional = false,
  labelElement,
  style,
  contentStyle,
  labelStyle,
  helperTextStyle,
}: ToggleProps) {
  const [internalChecked, setInternalChecked] = useState(false)
  const isControlled = checkedProp !== undefined

  const shouldShowError = showError && error
  const displayMessage = shouldShowError && errorMessage ? errorMessage : helperText
  const checked = isControlled ? checkedProp : internalChecked

  const { theme } = useThemeContext()
  const { isHovered, isFocused, interactiveProps } = useInteractiveState(disabled)
  const prefersReducedMotion = useReducedMotion()
  const haptics = useHaptics()

  const sizeConfig = {
    sm: {
      trackWidth: 36,
      trackHeight: 20,
      thumbSize: 16,
      thumbOffset: 2,
      thumbTranslate: 36 - 16 - 2 - 2,
    },
    md: {
      trackWidth: 44,
      trackHeight: 24,
      thumbSize: 20,
      thumbOffset: 2,
      thumbTranslate: 44 - 20 - 2 - 2,
    },
  }[size]

  const thumbPosition = useSharedValueAsserted(checked ? sizeConfig.thumbTranslate : 0)

  useEffect(() => {
    if (!prefersReducedMotion) {
      thumbPosition.value = withSpringAsserted(
        checked ? sizeConfig.thumbTranslate : 0,
        springConfigs.snappy
      )
    } else {
      thumbPosition.value = checked ? sizeConfig.thumbTranslate : 0
    }
  }, [checked, sizeConfig.thumbTranslate, prefersReducedMotion, thumbPosition])

  const animatedThumbStyle = useAnimatedStyleAsserted(() => ({
    transform: [{ translateX: thumbPosition.value }],
  }))

  const handlePress = () => {
    if (disabled) return
    haptics.impact('light')
    const newValue = !checked
    if (!isControlled) setInternalChecked(newValue)
    onChange?.(newValue)
  }

  const colorConfig = useMemo(() => {
    if (color === 'red-green') {
      return {
        trackOff: checked ? colors.success[500] : colors.error[500],
        trackOn: checked ? colors.success[500] : colors.error[500],
        trackOffHover: checked ? colors.success[600] : colors.error[600],
        trackOnHover: checked ? colors.success[600] : colors.error[600],
        thumbColor: colors.white,
      }
    }
    if (color === 'primary') {
      return {
        trackOff: colors.gray[300],
        trackOn: colors.primary[500],
        trackOffHover: colors.gray[400],
        trackOnHover: colors.primary[600],
        thumbColor: colors.white,
      }
    }
    return {
      trackOff: colors.gray[300],
      trackOn: colors.gray[600],
      trackOffHover: colors.gray[400],
      trackOnHover: colors.gray[700],
      thumbColor: colors.white,
    }
  }, [color, checked])

  const trackBackgroundColor =
    isHovered && !disabled
      ? checked
        ? colorConfig.trackOnHover
        : colorConfig.trackOffHover
      : checked
        ? colorConfig.trackOn
        : colorConfig.trackOff

  const finalTrackBackgroundColor = disabled
    ? theme === 'light'
      ? colors.bg.light.disabled
      : colors.bg.dark.disabled
    : trackBackgroundColor

  const focusRing =
    isFocused && !disabled ? (Platform.OS === 'web' ? { boxShadow: boxShadows.focusBase } : {}) : {}

  return (
    <View style={[styles.container, style]}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityState={{ checked, disabled }}
        {...interactiveProps}
        style={({ pressed }) => [
          styles.pressable,
          isHovered && !disabled && { opacity: 0.9 },
          pressed && !disabled && { opacity: 0.8 },
        ]}
      >
        <View style={styles.toggleWrapper}>
          <View
            style={[
              styles.toggleTrack,
              {
                width: sizeConfig.trackWidth,
                height: sizeConfig.trackHeight,
                backgroundColor: finalTrackBackgroundColor,
                ...focusRing,
              },
              disabled && styles.disabled,
              contentStyle,
            ]}
          >
            <AnimatedView
              style={[
                styles.toggleThumb,
                {
                  width: sizeConfig.thumbSize,
                  height: sizeConfig.thumbSize,
                },
                animatedThumbStyle,
              ]}
            />
          </View>
        </View>

        {(label || labelElement || displayMessage) && (
          <View style={styles.textContainer}>
            {(label || labelElement) && (
              <View style={styles.labelRow}>
                {labelElement ? (
                  labelElement
                ) : (
                  <>
                    <Text
                      style={[
                        styles.label,
                        {
                          fontSize:
                            size === 'sm' ? typography.small.fontSize : typography.body.fontSize,
                          lineHeight:
                            size === 'sm'
                              ? typography.small.lineHeight
                              : typography.body.lineHeight,
                          color: disabled
                            ? colors.text[theme].disabled
                            : colors.text[theme].primary,
                        },
                        labelStyle,
                      ]}
                    >
                      {label}
                    </Text>
                    {optional && (
                      <Text
                        style={[
                          styles.optionalText,
                          {
                            fontSize:
                              size === 'sm' ? typography.small.fontSize : typography.body.fontSize,
                            lineHeight:
                              size === 'sm'
                                ? typography.small.lineHeight
                                : typography.body.lineHeight,
                            color: disabled
                              ? colors.text[theme].disabled
                              : colors.text[theme].tertiary,
                          },
                        ]}
                      >
                        {' '}
                        (optional)
                      </Text>
                    )}
                  </>
                )}
              </View>
            )}

            {displayMessage && (
              <HelperText
                type={disabled ? 'disabled' : shouldShowError ? 'error' : 'default'}
                textStyle={helperTextStyle}
              >
                {displayMessage}
              </HelperText>
            )}
          </View>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-start' },
  pressable: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[10] },
  toggleWrapper: {},
  toggleTrack: {
    borderRadius: borderRadius.max,
    justifyContent: 'center',
    padding: 2,
  },
  toggleThumb: {
    borderRadius: borderRadius.max,
    backgroundColor: colors.white,
    ...Platform.select({
      web: { boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)' },
      default: { elevation: 1 },
    }),
  },
  textContainer: { flexDirection: 'column', flex: 1, gap: spacing[4] },
  labelRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  label: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  optionalText: {
    fontFamily: typography.body.fontFamily,
    fontWeight: typography.body.fontWeight,
  },
  disabled: { opacity: 0.5 },
})
