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

import { useState } from 'react'
import { View, Pressable, Text, Platform } from 'react-native'
import { colors } from '../../tokens/colors'
import { typography } from '../../tokens/typography'
import { boxShadows } from '../../tokens/shadows'
import type { RadioProps } from './Radio.types'
import { RadioIcon } from './RadioIcon'
import { useThemeContext } from '../../theme'
import { HelperText } from '../HelperText'
import { useInteractiveState } from '../../hooks/useInteractiveState'
import { useStyles } from '../../hooks'
import { getRadioColorConfig, getRadioSizeConfig, staticStyles as styles } from './Radio.styles'

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

  const sizeConfig = getRadioSizeConfig(size)
  const colorConfig = useStyles(getRadioColorConfig, [error, checked, color, disabled, theme] as const)

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

export type { RadioProps, RadioSize, RadioColor, RadioState } from './Radio.types'
