import type { FieldValues } from 'react-hook-form'
import { ControlledAddressForm } from './ControlledAddressForm'
import type { SmartAddressFormPresetProps } from './types'

/**
 * SmartAddressForm - Pre-configured address form presets
 *
 * Provides common address form configurations with sensible defaults.
 */
export const SmartAddressForm = {
  /**
   * Home Address - Full detail with street-level zoom
   *
   * @example
   * ```tsx
   * <SmartAddressForm.Home
   *   control={control}
   *   name="address"
   *   setValue={setValue}
   *   trigger={trigger}
   * />
   * ```
   */
  Home: <TFieldValues extends FieldValues = FieldValues>(
    props: SmartAddressFormPresetProps<TFieldValues>
  ) => (
    <ControlledAddressForm
      {...props}
      mode="hybrid"
      zoomLevel="street"
      label={props.label || 'Home Address'}
      storeCoordinates={props.storeCoordinates ?? true}
    />
  ),

  /**
   * Job Location - City-level zoom for job postings
   *
   * @example
   * ```tsx
   * <SmartAddressForm.JobLocation
   *   control={control}
   *   name="address"
   *   setValue={setValue}
   *   trigger={trigger}
   * />
   * ```
   */
  JobLocation: <TFieldValues extends FieldValues = FieldValues>(
    props: SmartAddressFormPresetProps<TFieldValues>
  ) => (
    <ControlledAddressForm
      {...props}
      mode="hybrid"
      zoomLevel="city"
      label={props.label || 'Job Location'}
      storeCoordinates={props.storeCoordinates ?? true}
    />
  ),

  /**
   * Generic Address - Standard address with street-level zoom
   *
   * @example
   * ```tsx
   * <SmartAddressForm.Generic
   *   control={control}
   *   name="address"
   *   setValue={setValue}
   *   trigger={trigger}
   *   label="Billing Address"
   * />
   * ```
   */
  Generic: <TFieldValues extends FieldValues = FieldValues>(
    props: SmartAddressFormPresetProps<TFieldValues>
  ) => (
    <ControlledAddressForm
      {...props}
      mode="hybrid"
      zoomLevel="street"
      label={props.label || 'Address'}
      storeCoordinates={props.storeCoordinates ?? true}
    />
  ),

  /**
   * Autocomplete Only - Just the search input, no manual fields
   *
   * @example
   * ```tsx
   * <SmartAddressForm.AutocompleteOnly
   *   control={control}
   *   name="address"
   *   setValue={setValue}
   *   trigger={trigger}
   *   label="Search Location"
   * />
   * ```
   */
  AutocompleteOnly: <TFieldValues extends FieldValues = FieldValues>(
    props: SmartAddressFormPresetProps<TFieldValues>
  ) => (
    <ControlledAddressForm
      {...props}
      mode="autocomplete-only"
      zoomLevel="street"
      label={props.label || 'Search Address'}
      storeCoordinates={props.storeCoordinates ?? true}
    />
  ),

  /**
   * Full Manual - All fields visible, no autocomplete search
   *
   * @example
   * ```tsx
   * <SmartAddressForm.FullManual
   *   control={control}
   *   name="address"
   *   setValue={setValue}
   *   trigger={trigger}
   * />
   * ```
   */
  FullManual: <TFieldValues extends FieldValues = FieldValues>(
    props: SmartAddressFormPresetProps<TFieldValues>
  ) => (
    <ControlledAddressForm
      {...props}
      mode="full"
      label={props.label || 'Address'}
      storeCoordinates={props.storeCoordinates ?? false}
    />
  ),
}
