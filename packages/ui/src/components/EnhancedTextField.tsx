import { forwardRef, useId, useRef } from 'react'
import { useStringFieldInfo, useTsController } from '@ts-react/form'
import {
  Fieldset,
  Input as TInput,
  InputProps,
  Label,
  Theme,
  View,
  type ColorTokens,
  type FontSizeTokens,
} from 'tamagui'
import { AlertCircle } from '@tamagui/lucide-icons'
import type { TextInput } from 'react-native'

import { FieldError } from './FieldError'
import { Shake } from './Shake'

// Import the sophisticated  input system
import {
  Input as BentoInput,
  InputContext,
  InputIconFrame,
  defaultInputGroupStyles,
} from './forms/inputs/components/inputsParts'
// useForwardFocus hook removed - not needed for basic functionality

export type EnhancedTextFieldVariant = 'default' | 'outlined' | 'filled' | 'underlined'
export type EnhancedTextFieldIconPosition = 'left' | 'right' | 'both'

export interface EnhancedTextFieldProps
  extends Pick<
    InputProps,
    'size' | 'autoFocus' | 'secureTextEntry' | 'value' | 'onChangeText' | 'onBlur'
  > {
  /** Visual variant of the input */
  variant?: EnhancedTextFieldVariant
  /** Icon to display */
  icon?: React.ReactNode
  /** Position of the icon */
  iconPosition?: EnhancedTextFieldIconPosition
  /** Right side icon (when iconPosition is 'both') */
  rightIcon?: React.ReactNode
  /** Helper text to display below input */
  helperText?: string
  /** Whether to show character count */
  showCharacterCount?: boolean
  /** Custom placeholder text (overrides schema placeholder) */
  placeholder?: string
  /** Disable all enhancements and use legacy styling */
  disableEnhancements?: boolean
  /** Custom icon scale */
  iconScale?: number
  /** Custom error icon */
  errorIcon?: React.ReactNode
  /** Whether to show error icon */
  showErrorIcon?: boolean
  /** Label for standalone use */
  label?: string
  /** Error message for standalone use */
  error?: string
  /** Disabled state for standalone use */
  disabled?: boolean
}

/**
 * Enhanced TextField with new patterns and comprehensive features
 * Maintains full compatibility with existing ts-form integration while adding:
 *
 * Features:
 * - Icon support (left, right, or both sides)
 * - Multiple visual variants (default, outlined, filled, underlined)
 * - Enhanced error states with optional icons
 * - Helper text and character counting
 * - Sophisticated focus management
 * - Cross-platform compatibility
 * - Theme-aware styling
 * - Accessibility improvements
 *
 * @param props - Enhanced text field props
 * @returns Enhanced text field component
 */
export const EnhancedTextField = forwardRef<any, EnhancedTextFieldProps>(
  (
    {
      variant = 'default',
      icon,
      iconPosition = 'left',
      rightIcon,
      helperText,
      showCharacterCount = false,
      placeholder: customPlaceholder,
      disableEnhancements = false,
      iconScale = 1.2,
      errorIcon,
      showErrorIcon = true,
      size = '$4',
      // Standalone props
      label: standaloneLabel,
      error: standaloneError,
      disabled: standaloneDisabled,
      value: standaloneValue,
      onChangeText: standaloneOnChangeText,
      onBlur: standaloneOnBlur,
      ...props
    },
    ref
  ) => {
    // Try to get ts-form context, but fallback gracefully if not available
    let field, error, isSubmitting, label, schemaPlaceholder, isOptional, maxLength, isEmail
    let isStandalone = false

    try {
      const tsController = useTsController<string>()
      const fieldInfo = useStringFieldInfo()
      field = tsController.field
      error = tsController.error
      isSubmitting = tsController.formState.isSubmitting
      label = fieldInfo.label
      schemaPlaceholder = fieldInfo.placeholder
      isOptional = fieldInfo.isOptional
      maxLength = fieldInfo.maxLength
      isEmail = fieldInfo.isEmail
    } catch {
      // Not in ts-form context, use standalone props
      isStandalone = true
      field = {
        value: standaloneValue || '',
        onChange: standaloneOnChangeText || (() => {}),
        onBlur: standaloneOnBlur || (() => {}),
        ref: null,
      }
      error = standaloneError ? { errorMessage: standaloneError } : null
      isSubmitting = standaloneDisabled || false
      label = standaloneLabel
      schemaPlaceholder = null
      isOptional = false
      maxLength = undefined
      isEmail = false
    }

    const id = useId()
    const disabled = isSubmitting
    const inputRef = useRef<TextInput>(null)
    // focusTrigger removed - useForwardFocus hook not available

    // Use custom placeholder or fall back to schema placeholder
    const finalPlaceholder = customPlaceholder || schemaPlaceholder || ''

    // Determine if we should show icons
    const hasLeftIcon = icon && (iconPosition === 'left' || iconPosition === 'both')
    const hasRightIcon =
      (rightIcon && (iconPosition === 'right' || iconPosition === 'both')) ||
      (error && showErrorIcon)
    const hasAnyIcon = hasLeftIcon || hasRightIcon

    // Character count logic
    const currentLength = field?.value?.length || 0
    const shouldShowCount = showCharacterCount && maxLength

    // If enhancements are disabled, fall back to legacy TextField
    if (disableEnhancements) {
      return (
        <Theme name={error ? 'red' : null} forceClassName>
          <Fieldset>
            {!!label && (
              <Label theme="alt1" size={size} htmlFor={id}>
                {label} {isOptional && `(Optional)`}
              </Label>
            )}
            <Shake shakeKey={error?.errorMessage}>
              <TInput
                ref={ref}
                disabled={disabled}
                maxLength={maxLength}
                placeholderTextColor="$color10"
                spellCheck={isEmail ? false : undefined}
                autoCapitalize={isEmail ? 'none' : undefined}
                inputMode={isEmail ? 'email' : undefined}
                value={field.value || ''}
                onChangeText={(text) => field.onChange(text)}
                onBlur={field.onBlur}
                placeholder={finalPlaceholder}
                id={id}
                w="100%"
                size={size}
                {...props}
              />
            </Shake>
            <FieldError message={error?.errorMessage} />
          </Fieldset>
        </Theme>
      )
    }

    // Enhanced version with  patterns
    return (
      <Theme name={error ? 'red' : null} forceClassName>
        <BentoInput size={size} w="100%" color={error ? '$red10' : undefined}>
          {/* Label */}
          {!!label && (
            <BentoInput.Label htmlFor={id} theme="alt1">
              {label} {isOptional && `(Optional)`}
            </BentoInput.Label>
          )}

          {/* Input Box with Icons */}
          <Shake shakeKey={error?.errorMessage}>
            <BentoInput.Box>
              {/* Left Icon */}
              {hasLeftIcon && (
                <BentoInput.Section>
                  <BentoInput.Icon>{icon}</BentoInput.Icon>
                </BentoInput.Section>
              )}

              {/* Input Area */}
              <BentoInput.Section>
                <BentoInput.Area
                  ref={inputRef}
                  id={id}
                  disabled={disabled}
                  maxLength={maxLength}
                  placeholderTextColor="$color10"
                  spellCheck={isEmail ? false : undefined}
                  autoCapitalize={isEmail ? 'none' : undefined}
                  inputMode={isEmail ? 'email' : undefined}
                  value={field.value || ''}
                  onChangeText={(text) => field.onChange(text)}
                  onBlur={field.onBlur}
                  placeholder={finalPlaceholder}
                  paddingLeft={hasLeftIcon ? 0 : undefined}
                  paddingRight={hasRightIcon ? 0 : undefined}
                  {...props}
                />
              </BentoInput.Section>

              {/* Right Icon */}
              {hasRightIcon && (
                <BentoInput.Section>
                  <BentoInput.Icon>
                    {error && showErrorIcon ? errorIcon || <AlertCircle /> : rightIcon}
                  </BentoInput.Icon>
                </BentoInput.Section>
              )}
            </BentoInput.Box>
          </Shake>

          {/* Helper Text and Character Count */}
          {(helperText || shouldShowCount || error?.errorMessage) && (
            <View flexDirection="row" justifyContent="space-between" alignItems="flex-start">
              <View flex={1}>
                {/* Error Message */}
                <FieldError message={error?.errorMessage} />

                {/* Helper Text (only show if no error) */}
                {!error?.errorMessage && helperText && (
                  <BentoInput.Info>{helperText}</BentoInput.Info>
                )}
              </View>

              {/* Character Count */}
              {shouldShowCount && (
                <BentoInput.Info
                  color={currentLength > maxLength ? '$red10' : '$color10'}
                  marginLeft="$2"
                >
                  {currentLength}/{maxLength}
                </BentoInput.Info>
              )}
            </View>
          )}
        </BentoInput>
      </Theme>
    )
  }
)

EnhancedTextField.displayName = 'EnhancedTextField'

/**
 * Icon-enhanced text field with left icon
 * Clean API for the most common icon input pattern
 */
export const IconTextField = forwardRef<any, EnhancedTextFieldProps>(
  ({ icon, iconPosition = 'left', ...props }, ref) => {
    return <EnhancedTextField ref={ref} icon={icon} iconPosition={iconPosition} {...props} />
  }
)

IconTextField.displayName = 'IconTextField'

/**
 * Text field with helper text
 * Combines input with helpful guidance text
 */
export const HelperTextField = forwardRef<any, EnhancedTextFieldProps>(
  ({ helperText, ...props }, ref) => {
    return <EnhancedTextField ref={ref} helperText={helperText} {...props} />
  }
)

HelperTextField.displayName = 'HelperTextField'

/**
 * Text field with character counting
 * Shows character count and validates against maxLength
 */
export const CountingTextField = forwardRef<any, EnhancedTextFieldProps>(
  ({ showCharacterCount = true, ...props }, ref) => {
    return <EnhancedTextField ref={ref} showCharacterCount={showCharacterCount} {...props} />
  }
)

CountingTextField.displayName = 'CountingTextField'
