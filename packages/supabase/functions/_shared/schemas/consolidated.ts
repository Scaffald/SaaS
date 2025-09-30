import { z } from 'zod'

/**
 * Consolidated schemas for tRPC operations
 * These schemas are shared between client and server to ensure type consistency
 */

// Address schema used in multiple places
export const addressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional(),
  country: z.string().optional(),
})

// =============================================================================
// PROFILE GENERAL SCHEMAS
// =============================================================================

export const profileGeneralInputSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  avatar_path: z.union([z.string().url(), z.string().min(1), z.literal('')]).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  about: z.string().max(500).optional(),
})

export const profileGeneralOutputSchema = z.object({
  first_name: z.string(),
  last_name: z.string(),
  avatar_path: z.string(),
  email: z.string(),
  phone: z.string(),
  about: z.string(),
})

// =============================================================================
// PROFILE EMPLOYMENT SCHEMAS
// =============================================================================

// Constants for employment options
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

export const profileEmploymentInputSchema = z
  .object({
    // Home Address
    address: addressSchema.optional(),

    // Preferred work locations (up to 3)
    preferred_work_locations: z
      .array(z.string())
      .max(3, 'Maximum 3 work locations allowed')
      .optional(),

    // Travel preferences
    willing_to_travel: z.boolean().optional(),
    travel_distance_miles: z.number().min(5).max(100).optional(),

    // Residency (multiple countries but keep US boolean)
    us_resident: z.boolean().optional(),
    residency_countries: z.array(z.string()).max(3, 'Maximum 3 countries allowed').optional(),

    // Passport
    us_passport: z.boolean().optional(),

    // Drivers License (multi-select array)
    drivers_license_classes: z.array(z.enum(DRIVERS_LICENSE_OPTIONS)).optional(),

    // Military Status (multi-select)
    military_status: z.array(z.enum(MILITARY_STATUS_OPTIONS)).optional(),

    // Availability (multi-select)
    availability: z.array(z.enum(AVAILABILITY_OPTIONS)).optional(),

    // Hourly Rate
    hourly_rate: z.number().min(0).max(200).optional(),
  })
  .partial()

export const profileEmploymentOutputSchema = z.object({
  address: addressSchema.nullable(),
  preferred_work_locations: z.array(z.string()),
  willing_to_travel: z.boolean(),
  travel_distance_miles: z.number(),
  us_resident: z.boolean(),
  residency_countries: z.array(z.string()),
  us_passport: z.boolean(),
  drivers_license_classes: z.array(z.string()),
  military_status: z.array(z.string()),
  availability: z.array(z.string()),
  hourly_rate: z.number().nullable(),
})

// Default values for employment profile
export const profileEmploymentDefaults: Partial<EmploymentProfileFormData> = {
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

// =============================================================================
// PROFILE SKILLS SCHEMAS
// =============================================================================

export const profileSkillsInputSchema = z
  .object({
    // Skills array with proficiency
    skills: z
      .array(
        z.object({
          skill_id: z.string().uuid(),
          skill_name: z.string(),
          proficiency: z.number().min(1).max(5).default(3),
          years_experience: z.number().min(0).max(50).optional(),
          is_primary: z.boolean().default(false),
          endorsed_count: z.number().default(0).optional(),
        })
      )
      .optional(),

    // Industry focus
    primary_industry_id: z.string().uuid().optional(),
    secondary_industries: z.array(z.string().uuid()).max(3).optional(),

    // Skill categories of interest
    skill_categories: z.array(z.string()).optional(),
  })
  .partial()

export const profileSkillsOutputSchema = z.object({
  skills: z.array(
    z.object({
      skill_id: z.string(),
      skill_name: z.string(),
      proficiency: z.number(),
      years_experience: z.number().nullable(),
      is_primary: z.boolean(),
      endorsed_count: z.number(),
    })
  ),
  primary_industry_id: z.string().nullable(),
  secondary_industries: z.array(z.string()),
  skill_categories: z.array(z.string()),
})

// =============================================================================
// AVATAR UPLOAD SCHEMA
// =============================================================================

export const uploadAvatarInputSchema = z.object({
  file: z.string(), // Base64 encoded file
  fileName: z.string(),
  contentType: z.string(),
})

export const uploadAvatarOutputSchema = z.object({
  success: z.boolean(),
  avatarPath: z.string(),
})

// =============================================================================
// DATABASE UPDATE SCHEMAS
// =============================================================================

export const profileUpdateSchema = z.object({
  id: z.string(),
  updated_at: z.string(),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  avatar_path: z.string().optional(),
})

export const userPrivateUpdateSchema = z.object({
  user_id: z.string(),
  updated_at: z.string(),
  phone: z.string().optional(),
  about: z.string().optional(),
})

export const userPrivateEmploymentUpdateSchema = z.object({
  user_id: z.string(),
  updated_at: z.string(),
  employment_street: z.string().optional(),
  employment_city: z.string().optional(),
  employment_state: z.string().optional(),
  employment_zip: z.string().optional(),
  employment_country: z.string().optional(),
  preferred_work_locations: z.array(z.string()).optional(),
  willing_to_travel: z.boolean().optional(),
  travel_distance_miles: z.number().optional(),
  us_resident: z.boolean().optional(),
  residency_countries: z.array(z.string()).optional(),
  us_passport: z.boolean().optional(),
  drivers_license_classes: z.array(z.string()).optional(),
  military_status: z.array(z.string()).optional(),
  availability: z.array(z.string()).optional(),
  hourly_rate: z.number().optional(),
})

// =============================================================================
// INFERRED TYPES FOR EXPORT
// =============================================================================

export type ProfileGeneralInput = z.infer<typeof profileGeneralInputSchema>
export type ProfileGeneralOutput = z.infer<typeof profileGeneralOutputSchema>
export type ProfileEmploymentInput = z.infer<typeof profileEmploymentInputSchema>
export type ProfileEmploymentOutput = z.infer<typeof profileEmploymentOutputSchema>
export type ProfileSkillsInput = z.infer<typeof profileSkillsInputSchema>
export type ProfileSkillsOutput = z.infer<typeof profileSkillsOutputSchema>
export type UploadAvatarInput = z.infer<typeof uploadAvatarInputSchema>
export type UploadAvatarOutput = z.infer<typeof uploadAvatarOutputSchema>

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
export type UserPrivateUpdate = z.infer<typeof userPrivateUpdateSchema>
export type UserPrivateEmploymentUpdate = z.infer<typeof userPrivateEmploymentUpdateSchema>

// Form data type for client-side components
export type EmploymentProfileFormData = z.infer<typeof profileEmploymentInputSchema>
