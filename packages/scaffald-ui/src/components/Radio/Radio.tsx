/**
 * Radio component
 * Fully-featured radio button component mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { Radio } from '@scaffald/ui'
 *
 * // Basic radio
 * <Radio
 *   checked={isSelected}
 *   onChange={setIsSelected}
 *   label="Option 1"
 * />
 *
 * // Radio with helper text
 * <Radio
 *   checked={isSelected}
 *   onChange={setIsSelected}
 *   label="Subscribe to newsletter"
 *   helperText="We'll send you weekly updates"
 * />
 *
 * // Radio with optional indicator
 * <Radio
 *   checked={isSelected}
 *   onChange={setIsSelected}
 *   label="Email notifications"
 *   optional
 *   helperText="We will not spam you, promise!"
 * />
 * ```
 */

import { useState, useMemo } from 'react'
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { typography } from '../../tokens/typography'
import { boxShadows } from '../../tokens/shadows'
import type { RadioProps } from './Radio.types'
import { RadioIcon } from './RadioIcon'
import { useThemeContext } from '../../theme'
import { HelperText } from '../HelperText'
import { useInteractiveState } from '../../hooks/useInteractiveState'

export function Radio({
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
  value: _value,
  name: _name,
  style,
  contentStyle,
  labelStyle,
  helperTextStyle,
}: RadioProps) {
  // Support both controlled and uncontrolled mode
  const [internalChecked, setInternalChecked] = useState(false)
  const isControlled = checkedProp !== undefined
  const checked = isControlled ? checkedProp : internalChecked

  const { theme } = useThemeContext()
  const { isHovered, isFocused, interactiveProps } = useInteractiveState(disabled)

  // Resolve error display
  const shouldShowError = showError && error
  const displayMessage = shouldShowError && errorMessage ? errorMessage : helperText

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
  const sizeConfig = {
    sm: {
      size: 16,
      iconSize: 8,
    },
    md: {
      size: 20,
      iconSize: 10,
    },
  }[size]

  // Color configuration based on state (memoized for performance)
  const colorConfig = useMemo(() => {
    // Error state overrides color choice
    if (error) {
      return {
        border: colors.border[theme].error,
        background: checked ? colors.error[600] : 'transparent',
        backgroundHover: checked ? colors.error[700] : colors.error[50],
        iconColor: colors.white,
      }
    }

    // Primary color
    if (color === 'primary') {
      return {
        border: disabled
          ? colors.border[theme].disabled
          : checked
            ? colors.primary[600]
            : colors.border[theme].default,
        background: checked
          ? disabled
            ? colors.primary[200]
            : colors.primary[600]
          : 'transparent',
        backgroundHover: checked ? colors.primary[700] : colors.gray[50],
        iconColor: theme === 'dark' ? colors.gray[900] : colors.white,
      }
    }

    // Gray color
    return {
      border: disabled
        ? colors.border[theme].disabled
        : checked
          ? colors.gray[700]
          : colors.border[theme].default,
      background: checked ? (disabled ? colors.gray[200] : colors.gray[700]) : 'transparent',
      backgroundHover: checked ? colors.gray[800] : colors.gray[50],
      iconColor: colors.white,
    }
  }, [error, checked, color, disabled, theme])

  // Focus ring style (web only)
  const focusRing =
    isFocused && !disabled ? (Platform.OS === 'web' ? { boxShadow: boxShadows.focusBase } : {}) : {}

  return (
    <View style={[styles.container, style]}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="radio"
        accessibilityState={{ checked, disabled }}
        {...interactiveProps}
        style={({ pressed }) => [
          styles.pressable,
          // Apply hover effect
          isHovered && !disabled && { opacity: 0.9 },
          // Apply pressed effect
          pressed && !disabled && { opacity: 0.8 },
        ]}
      >
        <View style={styles.radioWrapper}>
          <View
            style={[
              styles.radioCircle,
              {
                width: sizeConfig.size,
                height: sizeConfig.size,
                borderColor: colorConfig.border,
                backgroundColor:
                  isHovered && !disabled ? colorConfig.backgroundHover : colorConfig.background,
              },
              focusRing,
              disabled && styles.disabled,
              contentStyle,
            ]}
          >
            {checked && <RadioIcon size={sizeConfig.iconSize} color={colorConfig.iconColor} />}
          </View>
        </View>

        {(label || labelElement || displayMessage) && (
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
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pressable: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[8],
  },
  radioWrapper: {
    // Wrapper for radio button
  },
  radioCircle: {
    borderWidth: 1.5,
    borderRadius: 9999, // Fully circular
    justifyContent: 'center',
    alignItems: 'center',
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
export type { RadioProps, RadioSize, RadioColor, RadioState } from './Radio.types'
