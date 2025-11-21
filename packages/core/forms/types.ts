import type { AddressResult } from '@app/ui'
import type {
  Control,
  FieldPath,
  FieldValues,
  UseFormSetValue,
  UseFormTrigger,
} from 'react-hook-form'

/**
 * Field mapping strategies for address forms
 */
export type FieldMappingStrategy = 'nested' | 'flat' | 'custom'

/**
 * Custom field mapping for address components
 */
export interface CustomAddressFieldMapping {
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
  latitude?: string
  longitude?: string
}

/**
 * Props for ControlledAddressForm component
 */
export interface ControlledAddressFormProps<TFieldValues extends FieldValues = FieldValues> {
  // Required react-hook-form integration
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  setValue: UseFormSetValue<TFieldValues>
  trigger?: UseFormTrigger<TFieldValues>

  // Field mapping configuration
  fieldMapping?: FieldMappingStrategy | CustomAddressFieldMapping
  storeCoordinates?: boolean
  coordinateFields?: {
    lat: string
    lng: string
  }

  // AddressForm configuration
  mode?: 'hybrid' | 'autocomplete-only' | 'full'
  provider?: 'mapbox' | 'google'
  apiKey?: string
  zoomLevel?: 'street' | 'city' | 'region'

  // UI customization
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  error?: string

  // Optional callbacks
  onAddressSelect?: (address: AddressResult) => void
  onChange?: (value: string) => void
}

/**
 * Preset configurations for common address form use cases
 */
export interface SmartAddressFormPresetProps<TFieldValues extends FieldValues = FieldValues>
  extends Omit<ControlledAddressFormProps<TFieldValues>, 'mode' | 'zoomLevel' | 'label'> {
  label?: string
}
