/**
 * Phone number input with country selector.
 * No phone validation library; for validation/formatting use a peer (e.g. libphonenumber-js).
 */

import { useState, useEffect, useCallback } from 'react'
import { View } from 'react-native'
import {
  getDefaultCountries,
  findCountryByCode,
  getDefaultCountry,
  findCountryByValue,
  getNationalNumber,
} from '../../config/countries'
import type { Country } from '../../config/countries'
import { Stack } from '../Layout'
import { Row } from '../Layout'
import { ResponsiveSelect } from '../ResponsiveSelect'
import { Input } from '../Input'
import { Label } from '../Typography'
import { spacing } from '../../tokens/spacing'
import type { PhoneNumberInputProps } from './PhoneNumberInput.types'

export function PhoneNumberInput({
  value = '',
  onChange,
  placeholder = 'Phone number',
  error,
  disabled = false,
  defaultCountry = 'US',
  countries: countriesProp,
  label,
  testID,
}: PhoneNumberInputProps) {
  const countries = countriesProp ?? getDefaultCountries()
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    const fromValue = value ? findCountryByValue(value, countries) : undefined
    return fromValue ?? findCountryByCode(defaultCountry, countries) ?? getDefaultCountry(countries)
  })
  const [nationalNumber, setNationalNumber] = useState(() =>
    value ? getNationalNumber(value, selectedCountry.dialCode) : ''
  )

  const countryOptions = countries.map((c) => ({
    value: c.code,
    label: `${c.flag} ${c.dialCode} ${c.name}`,
  }))

  const syncFromValue = useCallback(() => {
    if (value === undefined || value === '') {
      setNationalNumber('')
      return
    }
    const country = findCountryByValue(value, countries)
    if (country) {
      setSelectedCountry(country)
      setNationalNumber(getNationalNumber(value, country.dialCode))
    } else {
      setNationalNumber(getNationalNumber(value, selectedCountry.dialCode))
    }
  }, [value, countries, selectedCountry.dialCode])

  useEffect(() => {
    syncFromValue()
  }, [syncFromValue])

  const handleCountryChange = useCallback(
    (code: string) => {
      const country = findCountryByCode(code, countries)
      if (country) {
        setSelectedCountry(country)
        const full = nationalNumber.trim()
          ? `${country.dialCode} ${nationalNumber.trim()}`
          : ''
        onChange?.(full)
      }
    },
    [countries, nationalNumber, onChange]
  )

  const handleNumberChange = useCallback(
    (text: string) => {
      setNationalNumber(text)
      const full = text.trim() ? `${selectedCountry.dialCode} ${text.trim()}` : ''
      onChange?.(full)
    },
    [selectedCountry.dialCode, onChange]
  )

  return (
    <Stack gap={spacing[2]} testID={testID}>
      {label ? <Label>{label}</Label> : null}
      <Row gap={spacing[2]} align="stretch">
        <View style={{ width: 112, flexShrink: 0 }}>
          <ResponsiveSelect
            value={selectedCountry.code}
            onValueChange={handleCountryChange}
            options={countryOptions}
            disabled={disabled}
            placeholder={`${selectedCountry.flag} ${selectedCountry.dialCode}`}
            sheetTitle="Select country"
            showIndicator
          />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Input
            placeholder={placeholder}
            value={nationalNumber}
            onChangeText={handleNumberChange}
            error={!!error}
            errorMessage={error}
            disabled={disabled}
            keyboardType="phone-pad"
          />
        </View>
      </Row>
    </Stack>
  )
}
