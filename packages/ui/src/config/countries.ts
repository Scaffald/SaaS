/**
 * Country configuration for phone number input
 * Includes country codes, names, flags, and dial codes
 */

export interface Country {
  /** ISO 3166-1 alpha-2 country code */
  code: string
  /** Country name */
  name: string
  /** Unicode flag emoji */
  flag: string
  /** International dial code with + prefix */
  dialCode: string
  /** Priority for sorting (higher = more common) */
  priority?: number
}

export const COUNTRIES: Country[] = [
  // High priority countries (most common)
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

  // European countries
  { code: 'CH', name: 'Switzerland', flag: '🇨🇭', dialCode: '+41', priority: 45 },
  { code: 'AT', name: 'Austria', flag: '🇦🇹', dialCode: '+43', priority: 40 },
  { code: 'SE', name: 'Sweden', flag: '🇸🇪', dialCode: '+46', priority: 35 },
  { code: 'NO', name: 'Norway', flag: '🇳🇴', dialCode: '+47', priority: 30 },
  { code: 'DK', name: 'Denmark', flag: '🇩🇰', dialCode: '+45', priority: 25 },
  { code: 'FI', name: 'Finland', flag: '🇫🇮', dialCode: '+358', priority: 20 },
  { code: 'PL', name: 'Poland', flag: '🇵🇱', dialCode: '+48', priority: 15 },
  { code: 'CZ', name: 'Czech Republic', flag: '🇨🇿', dialCode: '+420', priority: 10 },
  { code: 'HU', name: 'Hungary', flag: '🇭🇺', dialCode: '+36', priority: 5 },
  { code: 'RO', name: 'Romania', flag: '🇷🇴', dialCode: '+40', priority: 5 },
  { code: 'BG', name: 'Bulgaria', flag: '🇧🇬', dialCode: '+359', priority: 5 },
  { code: 'HR', name: 'Croatia', flag: '🇭🇷', dialCode: '+385', priority: 5 },
  { code: 'SI', name: 'Slovenia', flag: '🇸🇮', dialCode: '+386', priority: 5 },
  { code: 'SK', name: 'Slovakia', flag: '🇸🇰', dialCode: '+421', priority: 5 },
  { code: 'EE', name: 'Estonia', flag: '🇪🇪', dialCode: '+372', priority: 5 },
  { code: 'LV', name: 'Latvia', flag: '🇱🇻', dialCode: '+371', priority: 5 },
  { code: 'LT', name: 'Lithuania', flag: '🇱🇹', dialCode: '+370', priority: 5 },
  { code: 'IE', name: 'Ireland', flag: '🇮🇪', dialCode: '+353', priority: 5 },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹', dialCode: '+351', priority: 5 },
  { code: 'GR', name: 'Greece', flag: '🇬🇷', dialCode: '+30', priority: 5 },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', dialCode: '+357', priority: 5 },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', dialCode: '+356', priority: 5 },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺', dialCode: '+352', priority: 5 },
  { code: 'IS', name: 'Iceland', flag: '🇮🇸', dialCode: '+354', priority: 5 },

  // Asian countries
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', priority: 40 },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', dialCode: '+82', priority: 35 },
  { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86', priority: 30 },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', priority: 25 },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', priority: 20 },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60', priority: 15 },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66', priority: 10 },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳', dialCode: '+84', priority: 10 },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63', priority: 10 },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62', priority: 10 },

  // Middle East
  { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966', priority: 20 },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971', priority: 15 },
  { code: 'IL', name: 'Israel', flag: '🇮🇱', dialCode: '+972', priority: 10 },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90', priority: 10 },

  // South American countries
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', priority: 25 },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', priority: 20 },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷', dialCode: '+54', priority: 15 },
  { code: 'CL', name: 'Chile', flag: '🇨🇱', dialCode: '+56', priority: 10 },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴', dialCode: '+57', priority: 10 },
  { code: 'PE', name: 'Peru', flag: '🇵🇪', dialCode: '+51', priority: 10 },

  // African countries
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', priority: 15 },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', priority: 10 },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20', priority: 10 },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254', priority: 10 },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233', priority: 10 },

  // Additional countries (lower priority)
  { code: 'RU', name: 'Russia', flag: '🇷🇺', dialCode: '+7', priority: 5 },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64', priority: 5 },
  { code: 'FJ', name: 'Fiji', flag: '🇫🇯', dialCode: '+679', priority: 5 },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92', priority: 5 },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880', priority: 5 },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰', dialCode: '+94', priority: 5 },
  { code: 'NP', name: 'Nepal', flag: '🇳🇵', dialCode: '+977', priority: 5 },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲', dialCode: '+95', priority: 5 },
  { code: 'LA', name: 'Laos', flag: '🇱🇦', dialCode: '+856', priority: 5 },
  { code: 'KH', name: 'Cambodia', flag: '🇰🇭', dialCode: '+855', priority: 5 },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳', dialCode: '+673', priority: 5 },
  { code: 'TL', name: 'East Timor', flag: '🇹🇱', dialCode: '+670', priority: 5 },
  { code: 'PG', name: 'Papua New Guinea', flag: '🇵🇬', dialCode: '+675', priority: 5 },
  { code: 'NC', name: 'New Caledonia', flag: '🇳🇨', dialCode: '+687', priority: 5 },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺', dialCode: '+678', priority: 5 },
  { code: 'SB', name: 'Solomon Islands', flag: '🇸🇧', dialCode: '+677', priority: 5 },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮', dialCode: '+686', priority: 5 },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻', dialCode: '+688', priority: 5 },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷', dialCode: '+674', priority: 5 },
  { code: 'PW', name: 'Palau', flag: '🇵🇼', dialCode: '+680', priority: 5 },
  { code: 'FM', name: 'Micronesia', flag: '🇫🇲', dialCode: '+691', priority: 5 },
  { code: 'MH', name: 'Marshall Islands', flag: '🇲🇭', dialCode: '+692', priority: 5 },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴', dialCode: '+676', priority: 5 },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸', dialCode: '+685', priority: 5 },
  { code: 'AS', name: 'American Samoa', flag: '🇦🇸', dialCode: '+1684', priority: 5 },
  { code: 'CK', name: 'Cook Islands', flag: '🇨🇰', dialCode: '+682', priority: 5 },
  { code: 'NU', name: 'Niue', flag: '🇳🇺', dialCode: '+683', priority: 5 },
  { code: 'TK', name: 'Tokelau', flag: '🇹🇰', dialCode: '+690', priority: 5 },
  { code: 'PF', name: 'French Polynesia', flag: '🇵🇫', dialCode: '+689', priority: 5 },
  { code: 'WF', name: 'Wallis and Futuna', flag: '🇼🇫', dialCode: '+681', priority: 5 },
]

/**
 * Get countries sorted by priority (highest first) then alphabetically
 */
export const getSortedCountries = (): Country[] => {
  return [...COUNTRIES].sort((a, b) => {
    // First sort by priority (higher priority first)
    if (a.priority !== b.priority) {
      return (b.priority || 0) - (a.priority || 0)
    }
    // Then sort alphabetically by name
    return a.name.localeCompare(b.name)
  })
}

/**
 * Find a country by its code
 */
export const findCountryByCode = (code: string): Country | undefined => {
  return COUNTRIES.find((country) => country.code === code)
}

/**
 * Find a country by its dial code
 */
export const findCountryByDialCode = (dialCode: string): Country | undefined => {
  return COUNTRIES.find((country) => country.dialCode === dialCode)
}

/**
 * Get default country (US)
 */
export const getDefaultCountry = (): Country => {
  return findCountryByCode('US') || COUNTRIES[0]
}
