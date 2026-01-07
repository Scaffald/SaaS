/**
 * Toggle component
 * Fully-featured toggle switch component mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { Toggle } from '@unicornlove/beyond-ui'
 *
 * // Basic toggle
 * <Toggle
 *   checked={isEnabled}
 *   onChange={setIsEnabled}
 *   label="Enable notifications"
 * />
 *
 * // Toggle with helper text
 * <Toggle
 *   checked={darkMode}
 *   onChange={setDarkMode}
 *   label="Dark Mode"
 *   helperText="Switch to dark theme"
 * />
 *
 * // Red-Green toggle (error/success states)
 * <Toggle
 *   checked={isActive}
 *   onChange={setIsActive}
 *   color="red-green"
 *   label="Status"
 * />
 * ```
 */

import { useState } from 'react'
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { boxShadows } from '../../tokens/shadows'
import type { ToggleProps } from './Toggle.types'
import { useThemeContext } from '../../playground/ThemeProvider'

export function Toggle({
  checked: checkedProp,
  onChange,
  size = 'md',
  color = 'primary',
  disabled = false,
  label,
  helperText,
  optional = false,
  labelElement,
  containerStyle,
  toggleStyle,
  labelStyle,
  helperTextStyle,
}: ToggleProps) {
  // Support both controlled and uncontrolled mode
  const [internalChecked, setInternalChecked] = useState(false)
  const isControlled = checkedProp !== undefined
  const checked = isControlled ? checkedProp : internalChecked

  const [isHovered, setIsHovered] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const { theme } = useThemeContext()

  const handlePress = () => {
    if (disabled) return
    const newValue = !checked

    // Update internal state if uncontrolled
    if (!isControlled) {
      setInternalChecked(newValue)
    }

    // Always call onChange if provided
    onChange?.(newValue)
  }

  // Size configuration
  // Small: 36px width, 20px height, 16px thumb
  // Medium: 44px width, 24px height, 20px thumb
  const sizeConfig = {
    sm: {
      trackWidth: 36,
      trackHeight: 20,
      thumbSize: 16,
      thumbOffset: 2, // Padding inside track
      thumbTranslate: 36 - 16 - 2 - 2, // Track width - thumb size - left padding - right padding
    },
    md: {
      trackWidth: 44,
      trackHeight: 24,
      thumbSize: 20,
      thumbOffset: 2,
      thumbTranslate: 44 - 20 - 2 - 2,
    },
  }[size]

  // Color configuration based on state
  const getColors = () => {
    // Red-Green color (error/success states)
    if (color === 'red-green') {
      return {
        trackOff: checked ? colors.success[500] : colors.error[500],
        trackOn: checked ? colors.success[500] : colors.error[500],
        trackOffHover: checked ? colors.success[600] : colors.error[600],
        trackOnHover: checked ? colors.success[600] : colors.error[600],
        thumbColor: colors.white,
      }
    }

    // Primary color
    if (color === 'primary') {
      return {
        trackOff: colors.gray[300],
        trackOn: colors.primary[500],
        trackOffHover: colors.gray[400],
        trackOnHover: colors.primary[600],
        thumbColor: colors.white,
      }
    }

    // Gray color
    return {
      trackOff: colors.gray[300],
      trackOn: colors.gray[600],
      trackOffHover: colors.gray[400],
      trackOnHover: colors.gray[700],
      thumbColor: colors.white,
    }
  }

  const colorConfig = getColors()

  // Get track background color based on checked and hover state
  const trackBackgroundColor =
    isHovered && !disabled
      ? checked
        ? colorConfig.trackOnHover
        : colorConfig.trackOffHover
      : checked
        ? colorConfig.trackOn
        : colorConfig.trackOff

  // Disabled state - use disabled background color
  const finalTrackBackgroundColor = disabled
    ? theme === 'light'
      ? colors.bg.light.disabled
      : colors.bg.dark.disabled
    : trackBackgroundColor

  // Focus ring style (web only)
  const focusRing =
    isFocused && !disabled ? (Platform.OS === 'web' ? { boxShadow: boxShadows.focusBase } : {}) : {}

  return (
    <View style={[styles.container, containerStyle]}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="switch"
        accessibilityState={{ checked, disabled }}
        {...(Platform.OS === 'web' && {
          onMouseEnter: () => setIsHovered(true),
          onMouseLeave: () => setIsHovered(false),
        })}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={({ pressed }) => [
          styles.pressable,
          // Apply hover effect
          isHovered && !disabled && Platform.OS === 'web' && { opacity: 0.9 },
          // Apply pressed effect
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
              toggleStyle,
            ]}
          >
            <View
              style={[
                styles.toggleThumb,
                {
                  width: sizeConfig.thumbSize,
                  height: sizeConfig.thumbSize,
                  transform: [{ translateX: checked ? sizeConfig.thumbTranslate : 0 }],
                },
              ]}
            />
          </View>
        </View>

        {(label || labelElement || helperText) && (
          <View style={styles.textContainer}>
            {/* Label with optional indicator */}
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

            {/* Helper text */}
            {helperText && (
              <Text
                style={[
                  styles.helperText,
                  {
                    fontSize: typography.small.fontSize,
                    lineHeight: typography.small.lineHeight,
                    color: disabled ? colors.text[theme].disabled : colors.text[theme].tertiary,
                  },
                  helperTextStyle,
                ]}
              >
                {helperText}
              </Text>
            )}
          </View>
        )}
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[10], // 10px gap between toggle and label matching Figma
  },
  toggleWrapper: {
    // Wrapper for toggle switch
  },
  toggleTrack: {
    borderRadius: borderRadius.max, // Fully rounded pill shape
    justifyContent: 'center',
    padding: 2, // Padding inside track for thumb
  },
  toggleThumb: {
    borderRadius: borderRadius.max, // Fully rounded thumb
    backgroundColor: colors.white,
    // Shadow for depth (optional, matching Figma design)
    ...Platform.select({
      web: {
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
      },
      default: {
        elevation: 1,
      },
    }),
  },
  textContainer: {
    flexDirection: 'column',
    flex: 1,
    gap: spacing[4], // 4px gap between label and helper text
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  label: {
    fontFamily: typography.bodyMedium.fontFamily,
    fontWeight: typography.bodyMedium.fontWeight,
  },
  optionalText: {
    fontFamily: typography.body.fontFamily,
    fontWeight: typography.body.fontWeight,
  },
  helperText: {
    fontFamily: typography.body.fontFamily,
    fontWeight: typography.body.fontWeight,
  },
  disabled: {
    opacity: 0.5,
  },
})

// Export types
export type { ToggleProps, ToggleSize, ToggleColor, ToggleState } from './Toggle.types'
