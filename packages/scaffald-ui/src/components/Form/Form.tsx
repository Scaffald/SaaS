/**
 * Form components
 * Layout components for organizing form fields
 *
 * @example
 * ```tsx
 * import { Form, Fieldset, FormField, FormRow, FormActions } from '@scaffald/ui'
 *
 * <Form onSubmit={handleSubmit}>
 *   <Fieldset legend="Personal Information">
 *     <FormRow>
 *       <FormField label="First Name" required>
 *         <Input placeholder="Enter first name" />
 *       </FormField>
 *       <FormField label="Last Name" required>
 *         <Input placeholder="Enter last name" />
 *       </FormField>
 *     </FormRow>
 *     <FormField label="Email" helperText="We'll never share your email">
 *       <Input type="email" placeholder="Enter email" />
 *     </FormField>
 *   </Fieldset>
 *   <FormActions>
 *     <Button variant="outline">Cancel</Button>
 *     <Button>Submit</Button>
 *   </FormActions>
 * </Form>
 * ```
 */

import { createContext, useContext } from 'react'
import { View, StyleSheet } from 'react-native'
import type {
  FormProps,
  FieldsetProps,
  FormFieldProps,
  FormRowProps,
  FormActionsProps,
} from './Form.types'
import { useThemeContext } from '../../theme'
import { colors } from '../../tokens/colors'
import { spacing } from '../../tokens/spacing'
import { Text, H4, Caption } from '../Typography'
import { Label } from '../Typography'

// ============================================================================
// Context
// ============================================================================

interface FormContextValue {
  disabled?: boolean
}

const FormContext = createContext<FormContextValue>({})

function useFormContext() {
  return useContext(FormContext)
}

// ============================================================================
// Form Component
// ============================================================================

export function Form({
  children,
  onSubmit,
  gap = 16,
  style,
  testID,
}: FormProps) {
  const styles = getFormStyles(gap)

  return (
    <View
      style={[styles.form, style]}
      testID={testID}
      accessibilityRole="none"
    >
      {children}
    </View>
  )
}

// ============================================================================
// Fieldset Component
// ============================================================================

export function Fieldset({
  children,
  legend,
  description,
  disabled = false,
  gap = 12,
  direction = 'column',
  style,
  testID,
}: FieldsetProps) {
  const { theme } = useThemeContext()
  const styles = getFieldsetStyles(theme, gap, direction, disabled)

  return (
    <FormContext.Provider value={{ disabled }}>
      <View
        style={[styles.fieldset, style]}
        testID={testID}
        accessibilityRole="none"
      >
        {(legend || description) && (
          <View style={styles.legendContainer}>
            {legend && (
              <H4 style={disabled ? styles.legendDisabled : undefined}>
                {legend}
              </H4>
            )}
            {description && (
              <Text size="sm" color="secondary" style={styles.description}>
                {description}
              </Text>
            )}
          </View>
        )}
        <View style={styles.fields}>{children}</View>
      </View>
    </FormContext.Provider>
  )
}

// ============================================================================
// FormField Component
// ============================================================================

export function FormField({
  children,
  label,
  helperText,
  error,
  required = false,
  disabled = false,
  id,
  gap = 4,
  style,
  testID,
}: FormFieldProps) {
  const { theme } = useThemeContext()
  const formContext = useFormContext()
  const isDisabled = disabled || formContext.disabled || false
  const hasError = !!error
  const styles = getFormFieldStyles(theme, gap, isDisabled, hasError)

  return (
    <View style={[styles.formField, style]} testID={testID}>
      {label && (
        <Label
          htmlFor={id}
          required={required}
          disabled={isDisabled}
          style={styles.label}
        >
          {label}
        </Label>
      )}
      <View style={styles.control}>{children}</View>
      {(error || helperText) && (
        <Caption
          color={hasError ? 'error' : 'secondary'}
          style={styles.helperText}
        >
          {error || helperText}
        </Caption>
      )}
    </View>
  )
}

// ============================================================================
// FormRow Component
// ============================================================================

export function FormRow({
  children,
  gap = 16,
  align = 'stretch',
  style,
  testID,
}: FormRowProps) {
  const styles = getFormRowStyles(gap, align)

  return (
    <View style={[styles.row, style]} testID={testID}>
      {children}
    </View>
  )
}

// ============================================================================
// FormActions Component
// ============================================================================

export function FormActions({
  children,
  align = 'right',
  gap = 12,
  style,
  testID,
}: FormActionsProps) {
  const { theme } = useThemeContext()
  const styles = getFormActionsStyles(theme, align, gap)

  return (
    <View style={[styles.actions, style]} testID={testID}>
      {children}
    </View>
  )
}

// ============================================================================
// Styles
// ============================================================================

function getFormStyles(gap: number) {
  return StyleSheet.create({
    form: {
      gap,
    },
  })
}

function getFieldsetStyles(
  _theme: 'light' | 'dark',
  gap: number,
  direction: 'row' | 'column',
  _disabled: boolean
) {
  return StyleSheet.create({
    fieldset: {
      gap: spacing[16],
    },
    legendContainer: {
      gap: spacing[4],
    },
    legendDisabled: {
      opacity: 0.5,
    },
    description: {
      marginTop: spacing[2],
    },
    fields: {
      flexDirection: direction,
      gap,
      ...(direction === 'row' && {
        flexWrap: 'wrap',
      }),
    },
  })
}

function getFormFieldStyles(
  _theme: 'light' | 'dark',
  gap: number,
  disabled: boolean,
  _hasError: boolean
) {
  return StyleSheet.create({
    formField: {
      flex: 1,
      minWidth: 0,
      gap,
      opacity: disabled ? 0.5 : 1,
    },
    label: {
      marginBottom: spacing[2],
    },
    control: {
      // Container for the form control
    },
    helperText: {
      marginTop: spacing[2],
    },
  })
}

function getFormRowStyles(
  gap: number,
  align: 'start' | 'center' | 'end' | 'stretch'
) {
  const alignMap = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    stretch: 'stretch',
  } as const

  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap,
      alignItems: alignMap[align],
    },
  })
}

function getFormActionsStyles(
  theme: 'light' | 'dark',
  align: 'left' | 'center' | 'right' | 'space-between',
  gap: number
) {
  const justifyMap = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end',
    'space-between': 'space-between',
  } as const

  return StyleSheet.create({
    actions: {
      flexDirection: 'row',
      justifyContent: justifyMap[align],
      alignItems: 'center',
      gap,
      marginTop: spacing[8],
      paddingTop: spacing[16],
      borderTopWidth: 1,
      borderTopColor: colors.border[theme].subtle,
    },
  })
}
