import { z } from 'zod';

/**
 * Coordinate pair schema [longitude, latitude]
 */
export const coordinateSchema = z.tuple([z.number(), z.number()])

/**
 * Boundary schema - array of coordinate pairs forming a polygon
 */
export const boundarySchema = z
  .array(coordinateSchema)
  .min(3, 'Boundary must have at least 3 points')

/**
 * Site create schema
 */
export const siteCreateSchema = z.object({
  site_identifier: z.string().optional(),
  boundary: boundarySchema,
  area_sqft: z.number().positive().optional(),
  zoning_classification: z.string().optional(),
  jurisdiction: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Site update schema
 */
export const siteUpdateSchema = z.object({
  id: z.string().uuid('Invalid site ID'),
  site_identifier: z.string().optional().nullable(),
  boundary: boundarySchema.optional(),
  area_sqft: z.number().positive().optional().nullable(),
  zoning_classification: z.string().optional().nullable(),
  jurisdiction: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/**
 * Site overlap check schema
 */
export const siteOverlapCheckSchema = z.object({
  boundary: boundarySchema,
  site_id: z.string().uuid('Invalid site ID').optional(),
})

export type Coordinate = z.infer<typeof coordinateSchema>
export type Boundary = z.infer<typeof boundarySchema>
export type SiteCreateInput = z.infer<typeof siteCreateSchema>
export type SiteUpdateInput = z.infer<typeof siteUpdateSchema>
export type SiteOverlapCheckInput = z.infer<typeof siteOverlapCheckSchema>
