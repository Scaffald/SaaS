import { AddressForm, type AddressResult } from "@scaffald/ui";
import { createMapboxGeocodingProvider } from "@scf/core/utils/mapbox-geocoding-provider";
import { useMemo } from "react";
import {
  type FieldPath,
  type FieldValues,
  type PathValue,
  useWatch,
} from "react-hook-form";
import { Text, Stack } from "@scaffald/ui";
import type {
  ControlledAddressFormProps,
  CustomAddressFieldMapping,
} from "./types";

/**
 * ControlledAddressForm
 *
 * A smart wrapper around AddressForm that automatically integrates with react-hook-form.
 * Eliminates boilerplate code by handling setValue, trigger, and addressValue construction.
 *
 * When provider="mapbox" (default), address autocomplete uses Mapbox Geocoding API. Set
 * EXPO_PUBLIC_MAPBOX_TOKEN in .env or pass apiKey so the component can create the provider.
 *
 * @example
 * ```tsx
 * <ControlledAddressForm
 *   control={control}
 *   name="address"
 *   label="Home Address"
 *   required
 * />
 * ```
 */
export function ControlledAddressForm<
  TFieldValues extends FieldValues = FieldValues
>({
  control,
  name,
  setValue,
  trigger: _trigger,
  fieldMapping = "nested",
  storeCoordinates = true,
  coordinateFields = { lat: "latitude", lng: "longitude" },
  mode = "hybrid",
  provider = "mapbox",
  apiKey,
  zoomLevel = "street",
  proximity,
  label,
  placeholder = "Search for your address...",
  required = false,
  disabled = false,
  error,
  onAddressSelect,
  onChange,
  manualFieldsVariant,
  expandLabel,
  collapseLabel,
  lockedCountry,
  stateOptions,
  fieldErrors,
}: ControlledAddressFormProps<TFieldValues>) {
  const mapboxToken =
    apiKey ??
    (typeof process !== "undefined" ? process.env?.EXPO_PUBLIC_MAPBOX_TOKEN ?? "" : "");
  const geocodingProvider = useMemo(() => {
    if (provider !== "mapbox" || !mapboxToken) return null;
    return createMapboxGeocodingProvider(mapboxToken);
  }, [provider, mapboxToken]);
  // Determine field paths based on mapping strategy
  const fieldPaths = useMemo(() => {
    if (typeof fieldMapping === "object") {
      // Custom mapping
      return fieldMapping as CustomAddressFieldMapping;
    }

    if (fieldMapping === "flat") {
      // Flat structure: street, city, state, zip
      return {
        street: "street",
        city: "city",
        state: "state",
        zip: "zip",
        country: "country",
        latitude: coordinateFields.lat,
        longitude: coordinateFields.lng,
      } as CustomAddressFieldMapping;
    }

    // Default: nested structure (address.street, address.city, etc.)
    return {
      street: `${name}.street`,
      city: `${name}.city`,
      state: `${name}.state`,
      zip: `${name}.zip`,
      country: `${name}.country`,
      latitude: `${name}.${coordinateFields.lat}`,
      longitude: `${name}.${coordinateFields.lng}`,
    } as CustomAddressFieldMapping;
  }, [fieldMapping, name, coordinateFields]);

  // Watch all address fields
  const streetValue = useWatch({
    control,
    name: fieldPaths.street as FieldPath<TFieldValues>,
  });
  const cityValue = useWatch({
    control,
    name: fieldPaths.city as FieldPath<TFieldValues>,
  });
  const stateValue = useWatch({
    control,
    name: fieldPaths.state as FieldPath<TFieldValues>,
  });
  const zipValue = useWatch({
    control,
    name: fieldPaths.zip as FieldPath<TFieldValues>,
  });
  const countryValue = useWatch({
    control,
    name: fieldPaths.country as FieldPath<TFieldValues>,
  });

  // Construct addressValue from watched fields
  const addressValue = useMemo(
    () => ({
      streetAddress: streetValue || "",
      locality: cityValue || "",
      stateAbbreviation: stateValue || "",
      postalCode: zipValue || "",
      country: countryValue || "",
      formattedAddress: [streetValue, cityValue, stateValue, zipValue]
        .filter(Boolean)
        .join(", "),
    }),
    [streetValue, cityValue, stateValue, zipValue, countryValue]
  );

  // Handle address selection from autocomplete
  const handleAddressSelect = (address: AddressResult) => {
    const opts = { shouldValidate: false };
    if (fieldPaths.street) {
      setValue(
        fieldPaths.street as FieldPath<TFieldValues>,
        (address.streetAddress || "") as PathValue<
          TFieldValues,
          FieldPath<TFieldValues>
        >,
        opts
      );
    }
    if (fieldPaths.city) {
      setValue(
        fieldPaths.city as FieldPath<TFieldValues>,
        (address.locality || "") as PathValue<
          TFieldValues,
          FieldPath<TFieldValues>
        >,
        opts
      );
    }
    if (fieldPaths.state) {
      setValue(
        fieldPaths.state as FieldPath<TFieldValues>,
        (address.stateAbbreviation ||
          address.administrativeAreaLevel1 ||
          "") as PathValue<TFieldValues, FieldPath<TFieldValues>>,
        opts
      );
    }
    if (fieldPaths.zip) {
      setValue(
        fieldPaths.zip as FieldPath<TFieldValues>,
        (address.postalCode || "") as PathValue<
          TFieldValues,
          FieldPath<TFieldValues>
        >,
        opts
      );
    }
    if (fieldPaths.country) {
      setValue(
        fieldPaths.country as FieldPath<TFieldValues>,
        (address.country || "United States") as PathValue<
          TFieldValues,
          FieldPath<TFieldValues>
        >,
        opts
      );
    }
    if (storeCoordinates && address.coordinates) {
      if (fieldPaths.latitude && address.coordinates.lat !== undefined) {
        setValue(
          fieldPaths.latitude as FieldPath<TFieldValues>,
          address.coordinates.lat as PathValue<
            TFieldValues,
            FieldPath<TFieldValues>
          >,
          opts
        );
      }
      if (fieldPaths.longitude && address.coordinates.lng !== undefined) {
        setValue(
          fieldPaths.longitude as FieldPath<TFieldValues>,
          address.coordinates.lng as PathValue<
            TFieldValues,
            FieldPath<TFieldValues>
          >,
          opts
        );
      }
    }
    onAddressSelect?.(address);
  };

  // Handle manual address changes (when user edits individual fields)
  const handleAddressChange = (address: Partial<AddressResult>) => {
    // Set values without triggering validation - validation will happen on form submit
    if (address.streetAddress !== undefined && fieldPaths.street) {
      setValue(
        fieldPaths.street as FieldPath<TFieldValues>,
        address.streetAddress as PathValue<
          TFieldValues,
          FieldPath<TFieldValues>
        >,
        { shouldValidate: false }
      );
    }

    if (address.locality !== undefined && fieldPaths.city) {
      setValue(
        fieldPaths.city as FieldPath<TFieldValues>,
        address.locality as PathValue<TFieldValues, FieldPath<TFieldValues>>,
        { shouldValidate: false }
      );
    }

    if (address.stateAbbreviation !== undefined && fieldPaths.state) {
      setValue(
        fieldPaths.state as FieldPath<TFieldValues>,
        address.stateAbbreviation as PathValue<
          TFieldValues,
          FieldPath<TFieldValues>
        >,
        { shouldValidate: false }
      );
    }

    if (address.postalCode !== undefined && fieldPaths.zip) {
      setValue(
        fieldPaths.zip as FieldPath<TFieldValues>,
        address.postalCode as PathValue<TFieldValues, FieldPath<TFieldValues>>,
        { shouldValidate: false }
      );
    }

    if (address.country !== undefined && fieldPaths.country) {
      setValue(
        fieldPaths.country as FieldPath<TFieldValues>,
        address.country as PathValue<TFieldValues, FieldPath<TFieldValues>>,
        { shouldValidate: false }
      );
    }
  };

  return (
    <Stack
      gap={8}
      style={{
        position: "relative",
        zIndex: 10000,
        overflow: "visible",
      }}
    >
      {label && (
        <Text>
          {label}
          {required && " *"}
        </Text>
      )}
      <AddressForm
        mode={mode}
        searchOptions={{ zoomLevel, proximity }}
        placeholder={placeholder}
        disabled={disabled}
        error={error}
        addressValue={addressValue}
        value={addressValue.formattedAddress}
        provider={geocodingProvider}
        onAddressSelect={handleAddressSelect}
        onAddressChange={handleAddressChange}
        onChange={onChange}
        manualFieldsVariant={manualFieldsVariant}
        expandLabel={expandLabel}
        collapseLabel={collapseLabel}
        lockedCountry={lockedCountry}
        stateOptions={stateOptions}
        fieldErrors={fieldErrors}
      />
    </Stack>
  );
}
