import type { Country } from '../../config/countries'

export interface PhoneNumberInputProps {
  /** Current phone number value (full international or national) */
  value?: string
  /** Callback when phone number changes (emits full number: dial code + national) */
  onChange?: (value: string) => void
  /** Placeholder for the number input */
  placeholder?: string
  /** Error message to display */
  error?: string
  /** Whether the input is disabled */
  disabled?: boolean
  /** Default country code (e.g. 'US') */
  defaultCountry?: string
  /** Custom country list; defaults to built-in list */
  countries?: Country[]
  /** Accessible label for the field */
  label?: string
  /** testID for the container */
  testID?: string
}
