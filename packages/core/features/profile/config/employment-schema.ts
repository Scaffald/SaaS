import { z } from 'zod'

/**
 * Employment Profile Form Schema
 * Fields: Home Address, Preferred work locations, Travel, Residency, Military, etc.
 */
export const employmentProfileSchema = z.object({
  // Home Address
  address: z
    .object({
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),

  // Preferred work locations (up to 3)
  preferred_work_locations: z
    .array(z.string())
    .max(3, 'Maximum 3 work locations allowed')
    .optional(),

  // Travel preferences
  willing_to_travel: z.boolean().default(false),
  travel_distance_miles: z.number().min(10).max(100).default(25),

  // Residency (multiple countries but keep US boolean)
  us_resident: z.boolean().default(false),
  residency_countries: z.array(z.string()).max(3, 'Maximum 3 countries allowed').optional(),

  // Passport
  us_passport: z.boolean().default(false),

  // Drivers License (multi-select array)
  drivers_license_classes: z
    .array(z.enum(['Class M', 'Class A', 'Class B', 'Class C', 'CDL A', 'CDL B', 'CDL C']))
    .optional(),

  // Military Status (multi-select)
  military_status: z
    .array(z.enum(['Active Duty', 'Reserve', 'National Guard', 'Veteran', 'Retired']))
    .optional(),

  // Availability (multi-select)
  availability: z
    .array(
      z.enum([
        'Part-time',
        'Contract',
        'Full-time',
        'Weekend',
        'Night Shift',
        'Day Shift',
        'Temporary',
        'Short Notice',
      ])
    )
    .optional(),

  // Hourly Rate
  hourly_rate: z.number().min(0).max(200).optional(),
})

export type EmploymentProfileFormData = z.infer<typeof employmentProfileSchema>

export const employmentProfileDefaults: Partial<EmploymentProfileFormData> = {
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
  },
  preferred_work_locations: [],
  willing_to_travel: false,
  travel_distance_miles: 25,
  us_resident: false,
  residency_countries: [],
  us_passport: false,
  drivers_license_classes: [],
  military_status: [],
  availability: [],
  hourly_rate: undefined,
}

// Helper constants for form options
export const DRIVERS_LICENSE_OPTIONS = [
  'Class M',
  'Class A',
  'Class B',
  'Class C',
  'CDL A',
  'CDL B',
  'CDL C',
] as const

export const MILITARY_STATUS_OPTIONS = [
  'Active Duty',
  'Reserve',
  'National Guard',
  'Veteran',
  'Retired',
] as const

export const AVAILABILITY_OPTIONS = [
  'Part-time',
  'Contract',
  'Full-time',
  'Weekend',
  'Night Shift',
  'Day Shift',
  'Temporary',
  'Short Notice',
] as const
