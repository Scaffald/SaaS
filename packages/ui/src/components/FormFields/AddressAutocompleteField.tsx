import { useFieldInfo, useTsController } from '@ts-react/form'
import { useId } from 'react'
import { Fieldset, InputProps, Label, Theme } from 'tamagui'
import { z } from 'zod'

import { FieldError } from '../FieldError'
import { Shake } from '../Shake'
import { AddressAutocompleteInput, AddressAutocompleteInputProps } from './AddressAutocompleteInput'
import type { AddressSuggestion } from '../../utils/mapboxGeocoding'

// Extended address schema with autocomplete support
export const AddressAutocompleteSchema = z.object({
  street: z.string().min(4),
  zipCode: z.string().regex(/\d{5}/, 'ZIP code should contain only 5 integers'),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  fullAddress: z.string().optional(),
  coordinates: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
    })
    .optional(),
})

export interface AddressAutocompleteFieldProps
  extends Omit<AddressAutocompleteInputProps, 'error'> {
  variant?: 'default' | 'compact' | 'expanded'
  showFullAddress?: boolean
}

export const AddressAutocompleteField = (props: AddressAutocompleteFieldProps) => {
  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<z.infer<typeof AddressAutocompleteSchema>>()
  const { label } = useFieldInfo()
  const id = useId()
  const disabled = isSubmitting || props.disabled

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    const newValue = {
      street: suggestion.street || '',
      zipCode: suggestion.zipCode || '',
      city: suggestion.city || '',
      state: suggestion.state || '',
      country: suggestion.country || '',
      fullAddress: suggestion.fullAddress,
      coordinates: suggestion.coordinates,
    }

    field.onChange(newValue)
  }

  const handleTextChange = (text: string) => {
    // Update the full address field when user types
    field.onChange({
      ...field.value,
      fullAddress: text,
    })
  }

  // Determine the display value
  const displayValue =
    field.value?.fullAddress ||
    (field.value?.street && field.value?.zipCode
      ? `${field.value.street}, ${field.value.zipCode}`
      : '')

  return (
    <Theme name={error ? 'red' : null} forceClassName>
      <Fieldset>
        <Label theme="alt1" size="$3" htmlFor={id}>
          {label}
        </Label>
        <Shake shakeKey={error?.errorMessage}>
          <AddressAutocompleteInput
            id={id}
            value={displayValue}
            onChangeText={handleTextChange}
            onAddressSelect={handleAddressSelect}
            disabled={disabled}
            placeholder="Enter an address..."
            {...props}
          />
        </Shake>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
}

// Simple string-based address field for basic use cases
export const AddressStringField = (props: AddressAutocompleteFieldProps) => {
  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<string>()
  const { label } = useFieldInfo()
  const id = useId()
  const disabled = isSubmitting || props.disabled

  const handleAddressSelect = (suggestion: AddressSuggestion) => {
    field.onChange(suggestion.fullAddress)
  }

  return (
    <Theme name={error ? 'red' : null} forceClassName>
      <Fieldset>
        <Label theme="alt1" size="$3" htmlFor={id}>
          {label}
        </Label>
        <Shake shakeKey={error?.errorMessage}>
          <AddressAutocompleteInput
            id={id}
            value={field.value || ''}
            onChangeText={field.onChange}
            onAddressSelect={handleAddressSelect}
            disabled={disabled}
            placeholder="Enter an address..."
            {...props}
          />
        </Shake>
        <FieldError message={error?.errorMessage} />
      </Fieldset>
    </Theme>
  )
}
