import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, t } from '../middleware'

/**
 * Sites Router
 * Handles site (geographic boundary) operations
 */
export const sitesRouter = t.router({
  /**
   * Create a new site with boundary
   */
  create: protectedProcedure
    .input(
      z.object({
        site_identifier: z.string().optional(),
        boundary: z.array(z.array(z.number()).length(2)), // Array of [lng, lat] pairs
        area_sqft: z.number().optional(),
        zoning_classification: z.string().optional(),
        jurisdiction: z.string().optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Convert boundary coordinates to PostGIS POLYGON format
      // PostGIS expects: POLYGON((lng lat, lng lat, ...))
      const boundaryCoords = input.boundary.map((coord) => `${coord[0]} ${coord[1]}`).join(', ')

      // Ensure polygon is closed (first point = last point)
      const firstCoord = input.boundary[0]
      const lastCoord = input.boundary[input.boundary.length - 1]
      const closedCoords =
        firstCoord[0] === lastCoord[0] && firstCoord[1] === lastCoord[1]
          ? boundaryCoords
          : `${boundaryCoords}, ${firstCoord[0]} ${firstCoord[1]}`

      const boundaryWKT = `POLYGON((${closedCoords}))`

      // Check for overlaps before creating
      const { data: overlaps } = await ctx.supabase
        .rpc('check_site_overlaps', {
          p_site_id: null,
          p_boundary: boundaryWKT,
        })
        .catch(() => ({ data: [] }))

      const { data: site, error } = await ctx.supabase
        .schema('core')
        .from('sites')
        .insert({
          site_identifier: input.site_identifier || null,
          boundary: boundaryWKT,
          area_sqft: input.area_sqft || null,
          zoning_classification: input.zoning_classification || null,
          jurisdiction: input.jurisdiction || null,
          metadata: input.metadata || {},
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create site: ${error.message}`,
        })
      }

      // Note: Overlap notifications are created automatically by database trigger
      return {
        site,
        overlaps: overlaps || [],
      }
    }),

  /**
   * Update a site
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        site_identifier: z.string().optional().nullable(),
        boundary: z.array(z.array(z.number()).length(2)).optional(),
        area_sqft: z.number().optional().nullable(),
        zoning_classification: z.string().optional().nullable(),
        jurisdiction: z.string().optional().nullable(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { id, ...updates } = input

      const updateData: {
        site_identifier?: string
        area_sqft?: number | null
        zoning_classification?: string | null
        jurisdiction?: string | null
        [key: string]: unknown
      } = {}
      if (updates.site_identifier !== undefined)
        updateData.site_identifier = updates.site_identifier
      if (updates.area_sqft !== undefined) updateData.area_sqft = updates.area_sqft
      if (updates.zoning_classification !== undefined)
        updateData.zoning_classification = updates.zoning_classification
      if (updates.jurisdiction !== undefined) updateData.jurisdiction = updates.jurisdiction
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata

      // Handle boundary update
      if (updates.boundary) {
        const boundaryCoords = updates.boundary.map((coord) => `${coord[0]} ${coord[1]}`).join(', ')

        const firstCoord = updates.boundary[0]
        const lastCoord = updates.boundary[updates.boundary.length - 1]
        const closedCoords =
          firstCoord[0] === lastCoord[0] && firstCoord[1] === lastCoord[1]
            ? boundaryCoords
            : `${boundaryCoords}, ${firstCoord[0]} ${firstCoord[1]}`

        updateData.boundary = `POLYGON((${closedCoords}))`

        // Check for overlaps
        const { data: overlaps } = await ctx.supabase
          .rpc('check_site_overlaps', {
            p_site_id: id,
            p_boundary: updateData.boundary,
          })
          .catch(() => ({ data: [] }))

        // Store overlaps in response (notifications created by trigger)
        updateData._overlaps = overlaps || []
      }

      const { data: site, error } = await ctx.supabase
        .schema('core')
        .from('sites')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update site: ${error.message}`,
        })
      }

      return {
        site,
        overlaps: updateData._overlaps || [],
      }
    }),

  /**
   * Get a site by ID with associated projects and addresses
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: site, error } = await ctx.supabase
        .schema('core')
        .from('sites')
        .select(
          `
          *,
          project_sites(
            is_primary,
            project:projects(
              id,
              name,
              status,
              organization_id
            )
          ),
          addresses(
            id,
            address,
            geo,
            property_type
          )
        `
        )
        .eq('id', input.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Site not found: ${error.message}`,
        })
      }

      return { site }
    }),

  /**
   * Check for overlaps with existing sites
   */
  checkOverlap: protectedProcedure
    .input(
      z.object({
        boundary: z.array(z.array(z.number()).length(2)),
        site_id: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Convert boundary to PostGIS format
      const boundaryCoords = input.boundary.map((coord) => `${coord[0]} ${coord[1]}`).join(', ')

      const firstCoord = input.boundary[0]
      const lastCoord = input.boundary[input.boundary.length - 1]
      const closedCoords =
        firstCoord[0] === lastCoord[0] && firstCoord[1] === lastCoord[1]
          ? boundaryCoords
          : `${boundaryCoords}, ${firstCoord[0]} ${firstCoord[1]}`

      const boundaryWKT = `POLYGON((${closedCoords}))`

      const { data: overlaps, error } = await ctx.supabase.rpc('check_site_overlaps', {
        p_site_id: input.site_id || null,
        p_boundary: boundaryWKT,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to check overlaps: ${error.message}`,
        })
      }

      return { overlaps: overlaps || [] }
    }),
})
