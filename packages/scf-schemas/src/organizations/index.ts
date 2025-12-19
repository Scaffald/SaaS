import { z } from 'zod';
import { addressSchema } from '../common/address.ts';

const locationTypeSchema = z.enum(['headquarters', 'branch', 'job_site', 'remote', 'other'])

export const organizationLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required'),
  locationType: locationTypeSchema.default('other'),
  address: addressSchema.optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  timezone: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Enter a valid email').optional(),
  isActive: z.boolean().default(true),
})

export const organizationCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().min(1, 'Vanity URL is required').toLowerCase(),
  industry_id: z.string().uuid().optional(),
  logo_url: z.string().url().optional().or(z.literal('')),
  visibility: z.enum(['public', 'private']).default('public'),
  address: addressSchema.optional(),
  locations: z.array(organizationLocationSchema).min(1, 'At least one location is required'),
})

export const organizationUpdateSchema = organizationCreateSchema.extend({
  id: z.string().uuid(),
})

export const organizationRequestSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name is too long'),
  slug: z
    .string()
    .min(1, 'Vanity URL is required')
    .max(120, 'Vanity URL must be 120 characters or fewer')
    .transform((value) => value.trim().toLowerCase())
    .refine((value) => /^[a-z0-9-]+$/.test(value), {
      message: 'Vanity URL can only contain lowercase letters, numbers, and hyphens',
    }),
  website: z
    .string()
    .trim()
    .url('Please enter a valid website URL')
    .max(255, 'Website URL is too long')
    .optional(),
  notes: z.string().trim().max(1000, 'Notes must be 1000 characters or fewer').optional(),
})

export const organizationInviteSchema = z.object({
  email: z.string().email('Invite email is required').max(255),
  roleName: z.string().min(1, 'Role is required').max(120).default('member'),
  message: z.string().max(1000, 'Message is too long').optional(),
})

export const organizationSettingsSchema = z.object({
  timezone: z.string().min(1, 'Timezone is required'),
  locale: z.string().min(2, 'Locale is required'),
  defaultCurrency: z.string().min(3, 'Currency is required'),
  enforceMfa: z.boolean().default(false),
  sessionTimeoutMinutes: z.number().min(15).max(720).default(60),
  ipAllowList: z.array(z.string()).default([]),
  notificationPreferences: z.record(z.string(), z.unknown()).default({}),
  securityPreferences: z.record(z.string(), z.unknown()).default({}),
  privacyPreferences: z.record(z.string(), z.unknown()).default({}),
})

export const organizationDocumentUploadSchema = z.object({
  name: z.string().min(1, 'Document name is required'),
  folderId: z.string().uuid().nullable().optional(),
  category: z.enum([
    'contracts',
    'templates',
    'compliance',
    'certifications',
    'onboarding',
    'general',
    'other',
  ]),
  fileName: z.string().min(1, 'File name required'),
  mimeType: z.string().min(1, 'Mime type required'),
  fileSize: z.number().positive('File size must be positive'),
})

export type OrganizationLocation = z.infer<typeof organizationLocationSchema>
export type OrganizationCreate = z.infer<typeof organizationCreateSchema>
export type OrganizationUpdate = z.infer<typeof organizationUpdateSchema>
export type OrganizationRequest = z.infer<typeof organizationRequestSchema>
export type OrganizationInvite = z.infer<typeof organizationInviteSchema>
export type OrganizationSettingsInput = z.infer<typeof organizationSettingsSchema>
export type OrganizationDocumentUpload = z.infer<typeof organizationDocumentUploadSchema>
