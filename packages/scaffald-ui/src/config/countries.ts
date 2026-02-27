/**
 * Country configuration for PhoneNumberInput
 * Minimal list; consumers can pass a custom list via the countries prop.
 */

export interface Country {
  code: string
  name: string
  flag: string
  dialCode: string
  priority?: number
}

const DEFAULT_COUNTRIES: Country[] = [
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', priority: 100 },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', priority: 90 },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', priority: 85 },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', priority: 80 },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', priority: 75 },
  { code: 'FR', name: 'France', flag: '🇫🇷', dialCode: '+33', priority: 70 },
  { code: 'IT', name: 'Italy', flag: '🇮🇹', dialCode: '+39', priority: 65 },
  { code: 'ES', name: 'Spain', flag: '🇪🇸', dialCode: '+34', priority: 60 },
  { code: 'NL', name: 'Netherlands', flag: '🇳🇱', dialCode: '+31', priority: 55 },
  { code: 'BE', name: 'Belgium', flag: '🇧🇪', dialCode: '+32', priority: 50 },
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41', priority: 45 },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43', priority: 40 },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', priority: 40 },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', priority: 30 },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', priority: 25 },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', priority: 25 },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', priority: 20 },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', priority: 15 },
]

export function getDefaultCountries(): Country[] {
  return [...DEFAULT_COUNTRIES].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
}

export function findCountryByCode(code: string, countries: Country[]): Country | undefined {
  return countries.find((c) => c.code === code)
}

export function getDefaultCountry(countries: Country[]): Country {
  return findCountryByCode('US', countries) ?? countries[0]
}

/**
 * Find country whose dial code matches the start of the value (e.g. "+1" or "+44").
 * Uses longest match to handle overlapping codes (e.g. +1 vs +123).
 */
export function findCountryByValue(value: string, countries: Country[]): Country | undefined {
  const normalized = value.trim()
  if (!normalized.startsWith('+')) return undefined
  const sortedByDialLength = [...countries].sort(
    (a, b) => b.dialCode.length - a.dialCode.length
  )
  return sortedByDialLength.find((c) => normalized.startsWith(c.dialCode))
}

/**
 * Strip dial code from value to get national number for display.
 */
export function getNationalNumber(value: string, dialCode: string): string {
  const normalized = value.trim()
  if (normalized.startsWith('+')) {
    if (!normalized.startsWith(dialCode)) return normalized
    const rest = normalized.slice(dialCode.length).replace(/^\s+/, '')
    return rest
  }
  return normalized
}
