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

  // Full address required
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    zip: z.string().min(1, 'ZIP code is required'),
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
}
