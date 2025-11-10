import { z } from 'zod'

// Schema for individual location
export const organizationLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  address: z.record(z.unknown()), // Address autocomplete provides structured address data
})

export const organizationCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Slug is required').toLowerCase(),
  industry_id: z.string().uuid().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  visibility: z.enum(['public', 'private']).default('public'),
  address: z.record(z.unknown()).optional(),
  locations: z.array(organizationLocationSchema).min(1, 'At least one location is required'),
})

export const organizationUpdateSchema = organizationCreateSchema.extend({
  id: z.string().uuid(),
})

export const organizationRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(120, 'Slug must be 120 characters or fewer')
    .transform((value) => value.trim().toLowerCase())
    .refine((value) => /^[a-z0-9-]+$/.test(value), {
      message: 'Slug can only contain lowercase letters, numbers, and hyphens',
    }),
  website: z
    .string()
    .trim()
    .url('Please enter a valid website URL')
    .max(255, 'Website URL is too long')
    .optional(),
  notes: z.string().trim().max(1000, 'Notes must be 1000 characters or fewer').optional(),
})

export type OrganizationLocation = z.infer<typeof organizationLocationSchema>
export type OrganizationCreate = z.infer<typeof organizationCreateSchema>
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>
export type OrganizationRequest = z.infer<typeof organizationRequestSchema>
