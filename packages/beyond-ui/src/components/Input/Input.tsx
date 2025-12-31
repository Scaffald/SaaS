/**
 * Input component
 * Fully-featured input component mapped from Figma Forsured Design System
 * 
 * Can be used as a complete component or composed from sub-components for maximum flexibility.
 *
 * @example
 * ```tsx
 * import { Input } from '@unicornlove/beyond-ui'
 *
 * // Basic input (complete component)
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChangeText={setEmail}
 * />
 *
 * // Input with error
 * <Input
 *   label="Password"
 *   value={password}
 *   onChangeText={setPassword}
 *   error="Password must be at least 8 characters"
 *   required
 * />
 *
 * // Input with external addon
 * <Input
 *   label="Website"
 *   externalAddon="https://"
 *   placeholder="example.com"
 *   value={website}
 *   onChangeText={setWebsite}
 * />
 * ```
 * 
 * @example Composable usage
 * ```tsx
 * import { 
 *   InputLabel, 
 *   InputExternalAddon, 
 *   InputLeftSide,
 *   InputRightSide,
 *   InputHelperText 
 * } from '@unicornlove/beyond-ui'
 * 
 * // Compose manually for maximum control
 * <View>
 *   <InputLabel required note="(optional)">Custom Label</InputLabel>
 *   <View style={{ flexDirection: 'row' }}>
 *     <InputExternalAddon>https://</InputExternalAddon>
 *     <View style={inputContainerStyle}>
 *       <InputLeftSide icon={MyIcon} />
 *       <TextInput {...props} />
 *       <InputRightSide icon={InfoIcon} />
 *     </View>
 *   </View>
 *   <InputHelperText error>Custom error message</InputHelperText>
 * </View>
 * ```
 */

import { useState } from 'react'
import { View, TextInput, Platform } from 'react-native'
import type { NativeSyntheticEvent, TextInputFocusEventData } from 'react-native'
import type { InputProps } from './Input.types'
import {
  getInputStyles,
  getFocusBoxShadow,
  getFocusShadowStyle,
} from './Input.styles'
import { InputLabel } from './InputLabel'
import { InputHelperText } from './InputHelperText'
import { InputExternalAddon, InputLeftSide, InputRightSide } from './InputAddon'
import { colors } from '../../tokens/colors'

export function Input({
  label,
  required = false,
  helperText,
  error,
  state: controlledState,
  type = 'classic',
  externalAddon,
  iconStart: IconStart,
  iconEnd: IconEnd,
  disabled = false,
  fullWidth = true,
  containerStyle,
  inputStyle,
  labelStyle,
  helperTextStyle,
  onFocus,
  onBlur,
  value,
  ...textInputProps
}: InputProps) {
  const [internalFocused, setInternalFocused] = useState(false)

  // Determine actual state (controlled or derived)
  const isFocused = controlledState === 'focused' || internalFocused
  const isError = !!error || controlledState === 'error'
  const isFilled = controlledState === 'filled' || (!!value && value.length > 0)

  let actualState: InputProps['state'] = controlledState
  if (!controlledState) {
    if (isError) {
      actualState = 'error'
    } else if (isFocused) {
      actualState = 'focused'
    } else if (isFilled) {
      actualState = 'filled'
    } else {
      actualState = 'default'
    }
  }

  const hasExternalAddon = !!externalAddon
  const styles = getInputStyles(actualState || 'default', type, disabled, hasExternalAddon)


  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    if (!disabled) {
      setInternalFocused(true)
      onFocus?.(e)
    }
  }

  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setInternalFocused(false)
    onBlur?.(e)
  }

  // Get focus shadow for web
  const focusBoxShadow = getFocusBoxShadow(actualState || 'default')
  const focusShadowStyle = getFocusShadowStyle(actualState || 'default')

  return (
    <View style={[styles.container, fullWidth && { width: '100%' }, containerStyle]}>
      {/* Label */}
      {label && (
        <InputLabel
          required={required}
          labelStyle={labelStyle}
        >
          {label}
        </InputLabel>
      )}

      {/* Input Container */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'stretch',
          width: '100%',
        }}
      >
        {/* External Addon (Prefix) */}
        {hasExternalAddon && externalAddon && (
          <InputExternalAddon
            type={type}
            borderColor={
              (styles.input.borderColor as string | undefined) ||
              colors.border.light.default
            }
          >
            {externalAddon}
          </InputExternalAddon>
        )}

        {/* Main Input */}
        <View
          style={[
            styles.input,
            focusBoxShadow && Platform.OS === 'web' && { boxShadow: focusBoxShadow },
            focusShadowStyle,
          ]}
        >
          {/* Left Side - Leading Icon or Text */}
          {IconStart && (
            <InputLeftSide
              icon={IconStart}
              color={styles.iconColor}
            />
          )}

          {/* Text Input */}
          <TextInput
            {...textInputProps}
            value={value}
            editable={!disabled}
            style={[styles.inputText, inputStyle]}
            placeholderTextColor={colors.text.light.tertiary}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />

          {/* Right Side - Trailing Icon */}
          {IconEnd && (
            <InputRightSide
              icon={IconEnd}
              color={styles.iconColor}
            />
          )}
        </View>
      </View>

      {/* Helper Text / Error Message */}
      {(helperText || error) && (
        <InputHelperText
          error={!!error}
          textStyle={helperTextStyle}
        >
          {error || helperText || ''}
        </InputHelperText>
      )}
    </View>
  )
}

// Export types
export type { InputProps, InputState, InputType } from './Input.types'

