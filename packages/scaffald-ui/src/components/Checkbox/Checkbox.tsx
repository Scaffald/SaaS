/**
 * Checkbox component
 * Fully-featured checkbox component mapped from Figma Forsured Design System
 *
 * @example
 * ```tsx
 * import { Checkbox } from '@scaffald/ui'
 *
 * // Basic checkbox
 * <Checkbox
 *   checked={isChecked}
 *   onChange={setIsChecked}
 *   label="Accept terms and conditions"
 * />
 *
 * // Indeterminate checkbox (e.g., "Select all")
 * <Checkbox
 *   indeterminate={someSelected}
 *   checked={allSelected}
 *   onChange={handleSelectAll}
 *   label="Select all"
 * />
 *
 * // Checkbox with error state
 * <Checkbox
 *   checked={agreed}
 *   onChange={setAgreed}
 *   error={!agreed}
 *   label="You must accept to continue"
 * />
 * ```
 */

import { useState, useMemo, useEffect } from 'react'
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { borderRadius } from '../../tokens/borders'
import { typography } from '../../tokens/typography'
import { boxShadows } from '../../tokens/shadows'
import type { CheckboxProps } from './Checkbox.types'
import { CheckIcon } from './CheckIcon'
import { MinusIcon } from './MinusIcon'
import { useThemeContext } from '../../theme'
import { HelperText } from '../HelperText'
import { useInteractiveState } from '../../hooks/useInteractiveState'

export function Checkbox({
  checked: checkedProp,
  indeterminate = false,
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
}: CheckboxProps) {
  // Support both controlled and uncontrolled mode
  const [internalChecked, setInternalChecked] = useState(false)
  const isControlled = checkedProp !== undefined
  const checked = isControlled ? checkedProp : internalChecked

  const { theme } = useThemeContext()
  const { isHovered, isFocused, interactiveProps} = useInteractiveState(disabled)

  // Resolve error display
  const shouldShowError = showError && error
  const displayMessage = shouldShowError && errorMessage ? errorMessage : helperText

  // Create a stable initial value for animation
  const initialValue = checked || indeterminate ? 1 : 0

  // Animation state - always use regular React state for compatibility
  // This avoids conditional hook calls when Reanimated may or may not be available
  const [animationScale, setAnimationScale] = useState(initialValue)
  const [animationOpacity, setAnimationOpacity] = useState(initialValue)

  // Animate icon when checked/indeterminate state changes
  useEffect(() => {
    const targetValue = checked || indeterminate ? 1 : 0
    // For now, use instant transitions (can be enhanced with CSS transitions on web)
    setAnimationScale(targetValue)
    setAnimationOpacity(targetValue)
  }, [checked, indeterminate])

  // Computed style for the icon
  const animatedIconStyle = useMemo(() => ({
    transform: [{ scale: animationScale }],
    opacity: animationOpacity,
  }), [animationScale, animationOpacity])

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
      iconSize: 10,
      borderRadius: borderRadius.s - 2, // Slightly smaller radius
    },
    md: {
      size: 20,
      iconSize: 12,
      borderRadius: borderRadius.s,
    },
  }[size]

  // Determine current state
  const isCheckedOrIndeterminate = checked || indeterminate
  const showCheckIcon = checked && !indeterminate
  const showMinusIcon = indeterminate

  // Color configuration based on state (memoized for performance)
  const colorConfig = useMemo(() => {
    // Error state overrides color choice
    if (error) {
      return {
        border: colors.border[theme].error,
        background: isCheckedOrIndeterminate ? colors.error[600] : 'transparent',
        backgroundHover: isCheckedOrIndeterminate ? colors.error[700] : colors.error[50],
        iconColor: colors.white,
      }
    }

    // Primary color
    if (color === 'primary') {
      return {
        border: disabled
          ? colors.border[theme].disabled
          : isCheckedOrIndeterminate
            ? colors.primary[600]
            : colors.border[theme].default,
        background: isCheckedOrIndeterminate
          ? disabled
            ? colors.primary[200]
            : colors.primary[600]
          : 'transparent',
        backgroundHover: isCheckedOrIndeterminate ? colors.primary[700] : colors.gray[50],
        iconColor: colors.white,
      }
    }

    // Gray color
    return {
      border: disabled
        ? colors.border[theme].disabled
        : isCheckedOrIndeterminate
          ? colors.gray[700]
          : colors.border[theme].default,
      background: isCheckedOrIndeterminate
        ? disabled
          ? colors.gray[200]
          : colors.gray[700]
        : 'transparent',
      backgroundHover: isCheckedOrIndeterminate ? colors.gray[800] : colors.gray[50],
      iconColor: colors.white,
    }
  }, [error, isCheckedOrIndeterminate, color, disabled, theme])

  // Focus ring style (web only)
  const focusRing =
    isFocused && !disabled ? (Platform.OS === 'web' ? { boxShadow: boxShadows.focusBase } : {}) : {}

  return (
    <View style={[styles.container, style]}>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="checkbox"
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
        <View
          style={[
            styles.checkboxWrapper,
            {
              paddingTop: size === 'sm' ? 2 : 0, // Small checkboxes need 2px top padding for alignment
            },
          ]}
        >
          <View
            style={[
              styles.checkboxBox,
              {
                width: sizeConfig.size,
                height: sizeConfig.size,
                borderRadius: sizeConfig.borderRadius,
                borderColor: colorConfig.border,
                backgroundColor:
                  isHovered && !disabled ? colorConfig.backgroundHover : colorConfig.background,
              },
              focusRing,
              disabled && styles.disabled,
              contentStyle,
            ]}
          >
            {showCheckIcon && (
              <View style={animatedIconStyle}>
                <CheckIcon size={sizeConfig.iconSize} color={colorConfig.iconColor} />
              </View>
            )}
            {showMinusIcon && (
              <View style={animatedIconStyle}>
                <MinusIcon size={sizeConfig.iconSize} color={colorConfig.iconColor} />
              </View>
            )}
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
  checkboxWrapper: {
    // Wrapper for checkbox with optional top padding for alignment
  },
  checkboxBox: {
    borderWidth: 1.5,
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
export type { CheckboxProps, CheckboxSize, CheckboxColor, CheckboxState } from './Checkbox.types'
