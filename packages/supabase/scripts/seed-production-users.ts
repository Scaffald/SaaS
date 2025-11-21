/**
 * Production Users Import Script
 * Transforms production CSV data into SQL seed format
 * with Mapbox geocoding for accurate address parsing
 */

import * as fs from 'node:fs'
import * as path from 'node:path'

// =========================================================
// Types
// =========================================================

interface CSVRow {
  id: string
  name: string
  email: string
  created_at: string
  updated_at: string
  address: string
  location: string
  username: string
  description: string
  phone: string
  years_of_experience: string
  travel_mileage: string
  veteran: string
  us_resident: string
  clean_driving_record: string
  certifications: string
  drivers_license: string
  preferred_contact: string
  phone_os: string
  availability: string
  hourly_rate: string
  education_level: string
  us_passport: string
}

interface GeocodedAddress {
  street: string
  city: string
  state: string
  postal: string
  country: string
  longitude: number
  latitude: number
}

interface ProcessedUser {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  username: string
  headline: string
  bio: string
  phone: string
  yearsExperience: number
  travelMileage: number
  veteran: boolean
  usResident: boolean
  usPassport: boolean
  educationLevel: string
  hourlyRateCents: number | null
  phoneOs: string
  certifications: string[]
  driversLicense: string
  contactPrefs: string[]
  availability: string[]
  geocodedAddress: GeocodedAddress | null
  locationLabel: string
  createdAt: string
  updatedAt: string
}

// =========================================================
// Constants
// =========================================================

const MAPBOX_TOKEN =
  'pk.eyJ1Ijoic2NhZmZhbGQiLCJhIjoiY204Nmh5NWZ5MDRycTJrcHo0NHc1em5vZCJ9.w8FJ5p2msraGyyOeeLanhg'
const CSV_PATH = '/Users/clay/Desktop/users.csv'
const OUTPUT_PATH = path.join(__dirname, '../seeds/03_seed-production-users.sql')
const RATE_LIMIT_MS = 150 // Delay between Mapbox API calls

// =========================================================
// Utility Functions
// =========================================================

/**
 * Split full name into first and last name
 */
function splitName(fullName: string): [string, string] {
  if (!fullName || fullName.trim() === '') {
    return ['', '']
  }

  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) {
    return [parts[0], '']
  }

  const firstName = parts[0]
  const lastName = parts.slice(1).join(' ')
  return [firstName, lastName]
}

/**
 * Parse PostgreSQL array format: {val1,val2,"val with space"}
 */
function parsePostgresArray(arrayStr: string): string[] {
  if (!arrayStr || arrayStr.trim() === '' || arrayStr === '{}') {
    return []
  }

  // Remove outer braces
  const cleaned = arrayStr.replace(/^\{|\}$/g, '')
  if (cleaned === '') return []

  // Split by comma, handling quoted values
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      if (current.trim()) {
        values.push(current.trim())
      }
      current = ''
    } else {
      current += char
    }
  }

  if (current.trim()) {
    values.push(current.trim())
  }

  return values
}

/**
 * Parse boolean from CSV string
 */
function parseBoolean(value: string): boolean {
  if (!value) return false
  const normalized = value.toUpperCase().trim()
  return normalized === 'TRUE' || normalized === 'T' || normalized === '1'
}

/**
 * Generate headline from description and years of experience
 */
function generateHeadline(description: string, yearsExp: number): string {
  if (description && description.length > 10) {
    // Extract first sentence or first 60 chars
    const firstSentence = description.split(/[.!?]/)[0].trim()
    const shortDesc =
      firstSentence.length > 60 ? `${firstSentence.substring(0, 57)}...` : firstSentence

    if (shortDesc.length > 5) {
      return `${shortDesc} | ${yearsExp} ${yearsExp === 1 ? 'Year' : 'Years'} Experience`
    }
  }

  const level = yearsExp >= 10 ? 'Senior' : yearsExp >= 5 ? 'Experienced' : 'Construction'
  return `${level} Professional | ${yearsExp} Years`
}

/**
 * Parse drivers license array and return single class
 */
function parseDriversLicense(licenseStr: string): string {
  if (!licenseStr) return 'D' // Default to standard license

  const licenses = parsePostgresArray(licenseStr)
  if (licenses.length === 0) return 'D'

  // Return first license, preferring CDL types
  const first = licenses[0]

  // Map common values
  if (first.includes('CDL') || first === 'A' || first === 'B' || first === 'C') {
    return first
  }

  return 'D' // Standard
}

/**
 * Mapbox context item interface
 */
interface MapboxContextItem {
  id?: string
  text?: string
  text_en?: string
  short_code?: string
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Geocode address using Mapbox API
 */
async function geocodeAddress(addressString: string): Promise<GeocodedAddress | null> {
  if (!addressString || addressString.trim() === '') {
    return null
  }

  try {
    const encodedAddress = encodeURIComponent(addressString)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&language=en&limit=1&types=address,place&country=us`

    const response = await fetch(url)

    if (!response.ok) {
      console.warn(`⚠️  Mapbox API error for "${addressString}": ${response.status}`)
      return null
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const context: MapboxContextItem[] = feature.context || []

      // Extract city and state
      let city = ''
      let state = ''
      let postal = ''

      // Try to get from context
      for (const item of context) {
        if (item.id?.startsWith('place')) {
          city = item.text || item.text_en || ''
        } else if (item.id?.startsWith('region')) {
          state = item.short_code?.replace('US-', '') || item.text || ''
        } else if (item.id?.startsWith('postcode')) {
          postal = item.text || ''
        }
      }

      // Fallback: try to parse place_name
      if (!city || !state) {
        const parts = feature.place_name.split(',').map((p: string) => p.trim())
        if (parts.length >= 3) {
          city = city || parts[parts.length - 3]
          const statePart = parts[parts.length - 2]?.split(' ')[0]
          state = state || statePart || ''
        }
      }

      return {
        street: feature.address ? `${feature.address} ${feature.text}` : feature.text || '',
        city,
        state,
        postal,
        country: 'USA',
        longitude: feature.center[0],
        latitude: feature.center[1],
      }
    }

    return null
  } catch (error) {
    console.warn(`⚠️  Failed to geocode "${addressString}":`, error)
    return null
  }
}

/**
 * Parse CSV file
 */
function parseCSV(filePath: string): CSVRow[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n').filter((line) => line.trim())

  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows')
  }

  // Parse header
  const headers = lines[0].split(',')

  // Parse rows
  const rows: CSVRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const values: string[] = []
    let current = ''
    let inQuotes = false

    for (let j = 0; j < line.length; j++) {
      const char = line[j]

      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }
    values.push(current)

    // Create row object
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j].trim()
      const value = values[j] ? values[j].trim() : ''
      row[header] = value
    }

    rows.push(row as CSVRow)
  }

  return rows
}

/**
 * Process CSV row into structured user data
 */
async function processUser(row: CSVRow, index: number, total: number): Promise<ProcessedUser> {
  const [firstName, lastName] = splitName(row.name)
  const yearsExperience = Number.parseInt(row.years_of_experience) || 0
  const travelMileage = Number.parseInt(row.travel_mileage) || 0

  // Generate headline
  const headline = generateHeadline(row.description, yearsExperience)

  // Parse arrays
  const certifications = parsePostgresArray(row.certifications)
  const contactPrefs = parsePostgresArray(row.preferred_contact).map((p) => p.toLowerCase())
  const availability = parsePostgresArray(row.availability)

  // Parse drivers license
  const driversLicense = parseDriversLicense(row.drivers_license)

  // Parse hourly rate
  const hourlyRateCents = row.hourly_rate
    ? Math.round(Number.parseFloat(row.hourly_rate) * 100)
    : null

  // Get location data: First try WKB, then fall back to Mapbox geocoding
  let geocodedAddress: GeocodedAddress | null = null

  // Try WKB location data first (from CSV 'location' column)
  if (row.location && row.location.trim() !== '') {
    console.log(`🗺️  (${index + 1}/${total}): Using WKB location data`)
    const wkbCoords = parseWKB(row.location)

    if (wkbCoords) {
      // Extract city/state from address string if available
      const addressParts = row.address ? row.address.split(',').map((s) => s.trim()) : []

      geocodedAddress = {
        street: addressParts[0] || '',
        city: addressParts.length >= 2 ? addressParts[addressParts.length - 2] : '',
        state: addressParts.length >= 2 ? addressParts[addressParts.length - 1].split(' ')[0] : '',
        postal: '',
        country: 'USA',
        longitude: wkbCoords.longitude,
        latitude: wkbCoords.latitude,
      }
      console.log(
        `   ✓ ${geocodedAddress.city}, ${geocodedAddress.state} (${wkbCoords.longitude.toFixed(
          4
        )}, ${wkbCoords.latitude.toFixed(4)})`
      )
    }
  }

  // Fallback to Mapbox geocoding if no WKB data
  if (!geocodedAddress && row.address && row.address.trim() !== '') {
    console.log(`🗺️  Geocoding (${index + 1}/${total}): ${row.address}`)
    geocodedAddress = await geocodeAddress(row.address)

    if (geocodedAddress) {
      console.log(`   ✓ ${geocodedAddress.city}, ${geocodedAddress.state}`)
    } else {
      console.log(`   ⚠️  Could not geocode`)
    }

    // Rate limit for Mapbox API
    if (index < total - 1) {
      await sleep(RATE_LIMIT_MS)
    }
  } else if (!geocodedAddress) {
    console.log(`   (${index + 1}/${total}): No location data`)
  }

  return {
    id: row.id,
    name: row.name,
    firstName,
    lastName,
    email: row.email,
    username: row.username || `user-${row.id.substring(0, 8)}`,
    headline,
    bio: row.description || '',
    phone: row.phone || '',
    yearsExperience,
    travelMileage,
    veteran: parseBoolean(row.veteran),
    usResident: parseBoolean(row.us_resident),
    usPassport: parseBoolean(row.us_passport),
    educationLevel: row.education_level || '',
    hourlyRateCents,
    phoneOs: row.phone_os || '',
    certifications,
    driversLicense,
    contactPrefs,
    availability,
    geocodedAddress,
    locationLabel: row.address || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Escape SQL string
 */
function sqlEscape(str: string): string {
  if (!str) return ''
  return str.replace(/'/g, "''")
}

/**
 * Parse WKB (Well-Known Binary) PostGIS geometry to extract coordinates
 * WKB format for POINT (little-endian):
 * - Byte order (1 byte): 01 = little-endian
 * - WKB type (4 bytes): 01000000 = Point
 * - X coordinate (8 bytes): longitude as double
 * - Y coordinate (8 bytes): latitude as double
 */
function parseWKB(wkbHex: string): { longitude: number; latitude: number } | null {
  if (!wkbHex || wkbHex.trim() === '') return null

  try {
    const buffer = Buffer.from(wkbHex, 'hex')

    // Read byte order (0 = big-endian, 1 = little-endian)
    const isLittleEndian = buffer.readUInt8(0) === 1

    // Skip byte order (1) and WKB type (4) = 5 bytes offset
    const xOffset = 5
    const yOffset = 13

    const longitude = isLittleEndian ? buffer.readDoubleLE(xOffset) : buffer.readDoubleBE(xOffset)

    const latitude = isLittleEndian ? buffer.readDoubleLE(yOffset) : buffer.readDoubleBE(yOffset)

    return { longitude, latitude }
  } catch {
    console.warn(`⚠️  Failed to parse WKB: ${wkbHex.substring(0, 20)}...`)
    return null
  }
}

/**
 * Format SQL array
 */
function sqlArray(arr: string[]): string {
  if (arr.length === 0) return 'array[]::text[]'
  const escaped = arr.map((item) => `'${sqlEscape(item)}'`)
  return `array[${escaped.join(', ')}]`
}

/**
 * Generate SQL INSERT statements
 */
function generateSQL(users: ProcessedUser[]): string {
  const sql: string[] = []

  sql.push('-- =========================================================')
  sql.push('-- Production Users Import')
  sql.push(`-- Generated from production database CSV export on ${new Date().toISOString()}`)
  sql.push(`-- Total users: ${users.length}`)
  sql.push('-- =========================================================')
  sql.push('')
  sql.push('BEGIN;')
  sql.push('')

  // =========================================================
  // auth.users
  // =========================================================
  sql.push('-- =========================================================')
  sql.push('-- Insert into auth.users')
  sql.push('-- Note: Conflicting test users removed from 03_seed-users.sql')
  sql.push('-- =========================================================')
  sql.push('INSERT INTO auth.users (')
  sql.push('  id,')
  sql.push('  instance_id,')
  sql.push('  email,')
  sql.push('  encrypted_password,')
  sql.push('  email_confirmed_at,')
  sql.push('  last_sign_in_at,')
  sql.push('  raw_app_meta_data,')
  sql.push('  raw_user_meta_data,')
  sql.push('  aud,')
  sql.push('  role,')
  sql.push('  created_at,')
  sql.push('  updated_at,')
  sql.push('  is_super_admin,')
  sql.push('  confirmation_token,')
  sql.push('  recovery_token,')
  sql.push('  email_change_token_new,')
  sql.push('  email_change,')
  sql.push('  phone_change,')
  sql.push('  phone_change_token,')
  sql.push('  email_change_token_current,')
  sql.push('  reauthentication_token')
  sql.push(') VALUES')

  const authValues = users.map((user) => {
    const metadata = {
      provider: 'email',
      name: user.name,
      first_name: user.firstName,
      last_name: user.lastName,
      phone: user.phone,
      location: user.locationLabel,
    }

    const values = [
      `  ('${user.id}'`,
      `'00000000-0000-0000-0000-000000000000'::uuid`,
      `'${sqlEscape(user.email)}'`,
      `NULL`, // No password for magic link/Google
      `'${user.createdAt}'::timestamptz`,
      `'${user.updatedAt}'::timestamptz`,
      `'{"provider": "email"}'::jsonb`,
      `'${JSON.stringify(metadata).replace(/'/g, "''")}'::jsonb`,
      `'authenticated'`,
      `'authenticated'`,
      `'${user.createdAt}'::timestamptz`,
      `'${user.updatedAt}'::timestamptz`,
      `false`,
      `''`,
      `''`,
      `''`,
      `''`,
      `''`,
      `''`,
      `''`,
      `'')`,
    ]

    return values.join(', ')
  })

  sql.push(authValues.join(',\n'))
  sql.push('ON CONFLICT (id) DO NOTHING;')
  sql.push('')

  // =========================================================
  // public.users
  // =========================================================
  sql.push('-- =========================================================')
  sql.push('-- Insert into public.users')
  sql.push('-- =========================================================')
  sql.push('INSERT INTO public.users (')
  sql.push('  id,')
  sql.push('  username,')
  sql.push('  slug,')
  sql.push('  display_name,')
  sql.push('  headline,')
  sql.push('  bio,')
  sql.push('  industry_id,')
  sql.push('  avatar_url,')
  sql.push('  avatar_media_id,')
  sql.push('  open_to_work,')
  sql.push('  years_of_experience,')
  sql.push('  skills_summary,')
  sql.push('  created_at,')
  sql.push('  updated_at')
  sql.push(') VALUES')

  const userValues = users.map((user) => {
    const skillsSummary = {
      skills: user.certifications,
      primary_location: user.geocodedAddress
        ? { city: user.geocodedAddress.city, state: user.geocodedAddress.state }
        : {},
      travel_radius_miles: user.travelMileage,
    }

    const values = [
      `  ('${user.id}'`,
      `'${sqlEscape(user.username)}'`,
      `'${sqlEscape(user.username)}'`,
      `'${sqlEscape(user.name)}'`,
      `'${sqlEscape(user.headline)}'`,
      `'${sqlEscape(user.bio)}'`,
      `(SELECT id FROM public.industries WHERE slug = 'construction')`,
      `NULL`,
      `NULL`,
      `true`,
      `${user.yearsExperience}`,
      `'${JSON.stringify(skillsSummary).replace(/'/g, "''")}'::jsonb`,
      `'${user.createdAt}'::timestamptz`,
      `'${user.updatedAt}'::timestamptz)`,
    ]

    return values.join(', ')
  })

  sql.push(userValues.join(',\n'))
  sql.push('ON CONFLICT (id) DO NOTHING;')
  sql.push('')

  // =========================================================
  // public.users (legacy profiles table)
  // =========================================================
  sql.push('-- =========================================================')
  sql.push('-- Insert into public.users')
  sql.push('-- =========================================================')
  sql.push('INSERT INTO public.users (')
  sql.push('  id,')
  sql.push('  name,')
  sql.push('  about,')
  sql.push('  avatar_path,')
  sql.push('  created_at,')
  sql.push('  updated_at')
  sql.push(') VALUES')

  const profileValues = users.map((user) => {
    const values = [
      `  ('${user.id}'`,
      `'${sqlEscape(user.name)}'`,
      `'${sqlEscape(user.bio)}'`,
      `NULL`,
      `'${user.createdAt}'::timestamptz`,
      `'${user.updatedAt}'::timestamptz)`,
    ]

    return values.join(', ')
  })

  sql.push(profileValues.join(',\n'))
  sql.push('ON CONFLICT (id) DO NOTHING;')
  sql.push('')

  // =========================================================
  // private.profile
  // =========================================================
  sql.push('-- =========================================================')
  sql.push('-- Insert into private.profile')
  sql.push('-- =========================================================')
  sql.push('INSERT INTO private.profile (')
  sql.push('  user_id,')
  sql.push('  email,')
  sql.push('  phone,')
  sql.push('  first_name,')
  sql.push('  last_name,')
  sql.push('  address,')
  sql.push('  geo,')
  sql.push('  contact_prefs,')
  sql.push('  veteran,')
  sql.push('  us_resident,')
  sql.push('  us_passport,')
  sql.push('  travel_mileage,')
  sql.push('  education_level,')
  sql.push('  hourly_rate_cents,')
  sql.push('  location,')
  sql.push('  open_to_travel,')
  sql.push('  drivers_license_class,')
  sql.push('  phone_os,')
  sql.push('  availability,')
  sql.push('  certifications,')
  sql.push('  created_at,')
  sql.push('  updated_at')
  sql.push(') VALUES')

  const privateValues = users.map((user) => {
    const addressJsonb = user.geocodedAddress
      ? {
          street: user.geocodedAddress.street,
          city: user.geocodedAddress.city,
          state: user.geocodedAddress.state,
          postal: user.geocodedAddress.postal,
          country: user.geocodedAddress.country,
        }
      : null

    const geoPoint = user.geocodedAddress
      ? `st_setsrid(st_makepoint(${user.geocodedAddress.longitude}, ${user.geocodedAddress.latitude}), 4326)::geography`
      : `NULL`

    const values = [
      `  ('${user.id}'`,
      `'${sqlEscape(user.email)}'::citext`,
      user.phone ? `'${sqlEscape(user.phone)}'` : `NULL`,
      user.firstName ? `'${sqlEscape(user.firstName)}'` : `NULL`,
      user.lastName ? `'${sqlEscape(user.lastName)}'` : `NULL`,
      addressJsonb ? `'${JSON.stringify(addressJsonb).replace(/'/g, "''")}'::jsonb` : `NULL`,
      geoPoint,
      user.contactPrefs.length > 0 ? sqlArray(user.contactPrefs) : `NULL`,
      `${user.veteran}`,
      `${user.usResident}`,
      `${user.usPassport}`,
      `${user.travelMileage}`,
      user.educationLevel ? `'${sqlEscape(user.educationLevel)}'` : `NULL`,
      user.hourlyRateCents !== null ? `${user.hourlyRateCents}` : `NULL`,
      user.locationLabel ? `'${sqlEscape(user.locationLabel)}'` : `NULL`,
      `${user.travelMileage > 50}`,
      user.driversLicense ? `'${sqlEscape(user.driversLicense)}'` : `NULL`,
      user.phoneOs ? `'${sqlEscape(user.phoneOs)}'` : `NULL`,
      user.availability.length > 0 ? sqlArray(user.availability) : `NULL`,
      user.certifications.length > 0 ? sqlArray(user.certifications) : `NULL`,
      `'${user.createdAt}'::timestamptz`,
      `'${user.updatedAt}'::timestamptz)`,
    ]

    return values.join(', ')
  })

  sql.push(privateValues.join(',\n'))
  sql.push('ON CONFLICT (user_id) DO NOTHING;')
  sql.push('')

  sql.push('COMMIT;')
  sql.push('')

  return sql.join('\n')
}

// =========================================================
// Main Script
// =========================================================

async function main() {
  console.log('🌱 Production Users Import Script\n')
  console.log('='.repeat(60))

  // Check if CSV exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_PATH}`)
    process.exit(1)
  }

  // Parse CSV
  console.log(`📄 Reading CSV: ${CSV_PATH}`)
  const rows = parseCSV(CSV_PATH)
  console.log(`✓ Found ${rows.length} users\n`)

  // Process users with geocoding
  console.log('🗺️  Processing users with Mapbox geocoding...')
  console.log('   (Rate limited to avoid API throttling)\n')

  const users: ProcessedUser[] = []

  for (let i = 0; i < rows.length; i++) {
    const user = await processUser(rows[i], i, rows.length)
    users.push(user)
  }

  console.log('\n✓ All users processed\n')

  // Generate SQL
  console.log('📝 Generating SQL seed file...')
  const sql = generateSQL(users)

  // Write to file
  fs.writeFileSync(OUTPUT_PATH, sql, 'utf-8')
  console.log(`✓ Saved to: ${OUTPUT_PATH}\n`)

  // Display statistics
  console.log('='.repeat(60))
  console.log('📊 Import Statistics')
  console.log('='.repeat(60))
  console.log(`Total users: ${users.length}`)
  console.log(`Geocoded addresses: ${users.filter((u) => u.geocodedAddress !== null).length}`)
  console.log(`With phone: ${users.filter((u) => u.phone).length}`)
  console.log(`With certifications: ${users.filter((u) => u.certifications.length > 0).length}`)
  console.log(`Veterans: ${users.filter((u) => u.veteran).length}`)
  console.log(`US Passport holders: ${users.filter((u) => u.usPassport).length}`)
  console.log(
    `Average experience: ${Math.round(
      users.reduce((sum, u) => sum + u.yearsExperience, 0) / users.length
    )} years`
  )
  console.log('='.repeat(60))
  console.log('\n✅ Import complete!\n')
  console.log('💡 Next steps:')
  console.log('   1. Review the generated SQL file')
  console.log('   2. Apply to database: pnpm supa db reset')
  console.log(
    '   3. Or run directly: psql $DATABASE_URL -f packages/supabase/seeds/04_seed-production-users.sql\n'
  )
}

main().catch((error) => {
  console.error('\n💥 Import failed:', error)
  process.exit(1)
})
