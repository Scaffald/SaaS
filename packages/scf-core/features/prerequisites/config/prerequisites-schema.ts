import { z } from 'zod'

/**
 * User Type Options
 * Defines the available user personas
 */
export const USER_TYPE_OPTIONS = [
  {
    value: 'worker',
    label: 'Worker seeking employment or keeping options open',
  },
  { value: 'employer', label: 'Employer seeking skilled talent' },
  { value: 'customer', label: 'Customer seeking support for my project' },
] as const

export type UserType = 'worker' | 'employer' | 'customer'

/**
 * Prerequisites Form Schema
 * All fields are required for first-time completion
 */
export const prerequisitesSchema = z.object({
  // Name fields
  first_name: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  last_name: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),

  // Full address required. SC-58: reject gibberish inputs (single char, all
  // digits in street, ZIP `00000`, free-text state, etc).
  address: z.object({
    street: z
      .string()
      .min(3, 'Street address is required')
      .regex(/[a-zA-Z]/, 'Street address must contain letters'),
    city: z
      .string()
      .min(2, 'City is required')
      .regex(/[a-zA-Z]/, 'City must contain letters'),
    state: z
      .string()
      .regex(/^[A-Z]{2}$/, 'Select a valid US state'),
    zip: z
      .string()
      .regex(/^\d{5}$/, 'ZIP code must be 5 digits')
      .refine((z) => z !== '00000', 'Please enter a valid ZIP code'),
    country: z.string().min(1, 'Country is required'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),

  // User types - at least one required
  user_types: z
    .array(z.enum(['worker', 'employer', 'customer']))
    .min(1, 'Please select at least one option'),

  // Primary industry required
  industry_id: z.string().min(1, 'Please select your primary industry'),

  // SC-110: legal acceptance must be explicit (defaults to false; the form
  // renders required checkboxes for both). The API mirrors this validation —
  // it will reject submissions with either field false rather than silently
  // stamp accepted_*_at timestamps.
  accepts_privacy_policy: z
    .boolean()
    .refine((v) => v === true, 'You must accept the Privacy Policy'),
  accepts_terms_of_service: z
    .boolean()
    .refine((v) => v === true, 'You must accept the Terms of Service'),
})

export type PrerequisitesFormData = z.infer<typeof prerequisitesSchema>

/**
 * Default values for the form
 */
export const prerequisitesDefaults: PrerequisitesFormData = {
  first_name: '',
  last_name: '',
  address: {
    street: '',
    city: '',
    state: '',
    zip: '',
    country: 'United States',
    latitude: undefined,
    longitude: undefined,
  },
  user_types: [],
  industry_id: '',
  accepts_privacy_policy: false,
  accepts_terms_of_service: false,
}
