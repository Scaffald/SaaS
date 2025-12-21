import { z } from 'zod';
import { addressSchema } from '../common/address.ts';

/**
 * Property type enum
 */
export const propertyTypeSchema = z.enum([
  'residential',
  'commercial',
  'industrial',
  'mixed_use',
  'other',
])

/**
 * Address create schema (extends common addressSchema)
 * Address is required but individual fields within it are optional
 */
export const addressCreateSchema = z.object({
  site_id: z.string().uuid('Invalid site ID').optional(),
  address: addressSchema.refine((addr) => addr !== null && addr !== undefined, {
    message: 'Address is required',
  }),
  property_type: propertyTypeSchema.optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Address update schema
 */
export const addressUpdateSchema = z.object({
  id: z.string().uuid('Invalid address ID'),
  site_id: z.string().uuid('Invalid site ID').optional().nullable(),
  address: addressSchema.optional(),
  property_type: propertyTypeSchema.optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Address containment validation schema
 */
export const addressContainmentSchema = z.object({
  address_id: z.string().uuid('Invalid address ID'),
  site_id: z.string().uuid('Invalid site ID'),
})

export type PropertyType = z.infer<typeof propertyTypeSchema>
export type AddressCreateInput = z.infer<typeof addressCreateSchema>
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>
export type AddressContainmentInput = z.infer<typeof addressContainmentSchema>
