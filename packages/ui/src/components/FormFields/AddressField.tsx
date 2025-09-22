import { useFieldInfo, useTsController } from '@ts-react/form'
import { useId } from 'react'
import { useEffect, useState } from 'react'
import { Fieldset, Input, InputProps, Label, Theme, XStack } from 'tamagui'
import { z } from 'zod'

import { AddressAutocompleteInput, type AddressSuggestion } from '../AddressAutocomplete'
import { FieldError } from '../FieldError'
import { Shake } from '../Shake'

export const AddressSchema = z.object({
  street: z.string().min(4),
  zipCode: z.string().regex(/\d{5}/, 'ZIP code should contain only 5 integers'),
})

export const AddressField = (props: Pick<InputProps, 'size'>) => {
  const {
    field,
    error,
    formState: { isSubmitting },
  } = useTsController<z.infer<typeof AddressSchema>>()
  const { label } = useFieldInfo()
  const id = useId()
  const disabled = isSubmitting
  const [streetValue, setStreetValue] = useState(field.value?.street ?? '')

  useEffect(() => {
    setStreetValue(field.value?.street ?? '')
  }, [field.value?.street])

  const mergeAddress = (partial: Partial<z.infer<typeof AddressSchema>>) => ({
    street: partial.street ?? field.value?.street ?? '',
    zipCode: partial.zipCode ?? field.value?.zipCode ?? '',
  })

  const handleSuggestionSelected = (suggestion: AddressSuggestion) => {
    field.onChange(
      mergeAddress({
        street: suggestion.street || suggestion.formatted,
        zipCode: suggestion.zipCode || field.value?.zipCode || '',
      }),
    )
  }

  return (
    <Fieldset gap="$2">
      <Label theme="alt1" size="$3">
        {label}
      </Label>

      <XStack $sm={{ fd: 'column' }} $gtSm={{ fw: 'wrap' }} gap="$4">
        <Theme name={error?.street ? 'red' : null} forceClassName>
          <Fieldset $gtSm={{ fb: 0 }} f={1}>
              <Label theme="alt1" size={props.size || '$3'} htmlFor={`${id}-street`}>
                Street
              </Label>
            <Shake shakeKey={error?.street?.errorMessage}>
              <AddressAutocompleteInput
                id={`${id}-street`}
                disabled={disabled}
                placeholderTextColor="$color10"
                placeholder="e.g. 123 Main St"
                value={streetValue}
                onValueChange={(street) => {
                  setStreetValue(street)
                  field.onChange(mergeAddress({ street }))
                }}
                onSuggestionSelected={handleSuggestionSelected}
                onBlur={field.onBlur}
                ref={field.ref}
                size={props.size}
              />
            </Shake>
            <FieldError message={error?.street?.errorMessage} />
          </Fieldset>
        </Theme>

        <Theme name={error?.zipCode ? 'red' : null} forceClassName>
          <Fieldset $gtSm={{ fb: 0 }} f={1}>
            <Label theme="alt1" size={props.size || '$3'} htmlFor={`${id}-zip-code`}>
              US ZIP Code
            </Label>
            <Shake shakeKey={error?.zipCode?.errorMessage}>
              <Input
                disabled={disabled}
                placeholderTextColor="$color10"
                value={field.value?.zipCode}
                onChangeText={(zipCode) => field.onChange(mergeAddress({ zipCode }))}
                onBlur={field.onBlur}
                placeholder="e.g. 12345"
                id={`${id}-zip-code`}
                {...props}
              />
            </Shake>
            <FieldError message={error?.zipCode?.errorMessage} />
          </Fieldset>
        </Theme>
      </XStack>
    </Fieldset>
  )
}
