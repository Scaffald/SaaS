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

export type OrganizationLocation = z.infer<typeof organizationLocationSchema>
export type OrganizationCreate = z.infer<typeof organizationCreateSchema>
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>
