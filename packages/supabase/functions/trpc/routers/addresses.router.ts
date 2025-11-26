// @ts-nocheck
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, t } from '../middleware.ts'

/**
 * Helper function to geocode address using Mapbox API
 */
async function geocodeAddress(address: {
  street?: string
  city?: string
  state?: string
  zip?: string
  country?: string
}): Promise<{ latitude: number; longitude: number } | null> {
  const mapboxToken = Deno.env.get('EXPO_PUBLIC_MAPBOX_TOKEN') || Deno.env.get('MAPBOX_TOKEN')

  if (!mapboxToken) {
    console.warn('Mapbox token not found, skipping geocoding')
    return null
  }

  // Build address string
  const addressParts = [
    address.street,
    address.city,
    address.state,
    address.zip,
    address.country,
  ].filter(Boolean)

  if (addressParts.length === 0) {
    return null
  }

  const addressString = addressParts.join(', ')
  const encodedAddress = encodeURIComponent(addressString)

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${mapboxToken}&limit=1&types=address,place`

    const response = await fetch(url)

    if (!response.ok) {
      console.warn(`Mapbox API error: ${response.status} for address "${addressString}"`)
      return null
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const [longitude, latitude] = feature.center // Mapbox returns [lng, lat]

      return { latitude, longitude }
    }

    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * Addresses Router
 * Handles address operations with geocoding and validation
 */
export const addressesRouter = t.router({
  /**
   * Create a new address with geocoding
   */
  create: protectedProcedure
    .input(
      z.object({
        site_id: z.string().uuid().optional(),
        address: z.object({
          street: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          zip: z.string().optional(),
          country: z.string().optional(),
          latitude: z.number().optional(),
          longitude: z.number().optional(),
        }),
        property_type: z
          .enum(['residential', 'commercial', 'industrial', 'mixed_use', 'other'])
          .optional(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      // Geocode address if coordinates not provided
      let latitude = input.address.latitude
      let longitude = input.address.longitude

      if (!latitude || !longitude) {
        const geocoded = await geocodeAddress(input.address)
        if (geocoded) {
          latitude = geocoded.latitude
          longitude = geocoded.longitude
        }
      }

      // Build address JSONB with coordinates
      const addressData = {
        ...input.address,
        latitude: latitude || null,
        longitude: longitude || null,
      }

      // Create PostGIS point if coordinates available
      let geoPoint: string | null = null
      if (latitude && longitude) {
        geoPoint = `POINT(${longitude} ${latitude})` // PostGIS uses lng lat order
      }

      // Note: Containment validation will be done after address is created

      const { data: address, error } = await ctx.supabase
        .schema('core')
        .from('addresses')
        .insert({
          site_id: input.site_id || null,
          address: addressData,
          geo: geoPoint,
          property_type: input.property_type || null,
          metadata: input.metadata || {},
        })
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create address: ${error.message}`,
        })
      }

      // Validate containment after creation if site_id provided
      let containmentWarning = null
      if (input.site_id && address.id && geoPoint) {
        const { data: isContained, error: containmentError } = await ctx.supabase.rpc(
          'validate_address_in_site',
          {
            p_address_id: address.id,
            p_site_id: input.site_id,
          }
        )

        if (containmentError) {
          console.warn('Containment validation error:', containmentError)
        } else if (!isContained) {
          containmentWarning = 'Property address may be outside site boundary. Please verify.'
        }
      }

      return {
        address,
        containmentWarning,
      }
    }),

  /**
   * Update an address
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        site_id: z.string().uuid().optional().nullable(),
        address: z
          .object({
            street: z.string().optional(),
            city: z.string().optional(),
            state: z.string().optional(),
            zip: z.string().optional(),
            country: z.string().optional(),
            latitude: z.number().optional(),
            longitude: z.number().optional(),
          })
          .optional(),
        property_type: z
          .enum(['residential', 'commercial', 'industrial', 'mixed_use', 'other'])
          .optional()
          .nullable(),
        metadata: z.record(z.any()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user) {
        throw new TRPCError({ code: 'UNAUTHORIZED' })
      }

      const { id, ...updates } = input

      const updateData: any = {}
      if (updates.site_id !== undefined) updateData.site_id = updates.site_id
      if (updates.property_type !== undefined) updateData.property_type = updates.property_type
      if (updates.metadata !== undefined) updateData.metadata = updates.metadata

      // Handle address update and re-geocode if needed
      if (updates.address) {
        // Get existing address to merge
        const { data: existing } = await ctx.supabase
          .schema('core')
          .from('addresses')
          .select('address')
          .eq('id', id)
          .single()

        const mergedAddress = {
          ...(existing?.address || {}),
          ...updates.address,
        }

        // Re-geocode if address changed and no coordinates provided
        let latitude = mergedAddress.latitude
        let longitude = mergedAddress.longitude

        if (!latitude || !longitude) {
          const geocoded = await geocodeAddress(mergedAddress)
          if (geocoded) {
            latitude = geocoded.latitude
            longitude = geocoded.longitude
          }
        }

        updateData.address = {
          ...mergedAddress,
          latitude: latitude || null,
          longitude: longitude || null,
        }

        // Update PostGIS point
        if (latitude && longitude) {
          updateData.geo = `POINT(${longitude} ${latitude})`
        } else {
          updateData.geo = null
        }
      }

      const { data: address, error } = await ctx.supabase
        .schema('core')
        .from('addresses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update address: ${error.message}`,
        })
      }

      // Validate containment if site_id provided
      let containmentWarning = null
      if (updateData.site_id && address.id) {
        const { data: isContained } = await ctx.supabase
          .rpc('validate_address_in_site', {
            p_address_id: address.id,
            p_site_id: updateData.site_id,
          })
          .catch(() => ({ data: false }))

        if (!isContained) {
          containmentWarning = 'Property address may be outside site boundary. Please verify.'
        }
      }

      return {
        address,
        containmentWarning,
      }
    }),

  /**
   * Get an address by ID with associated site and projects
   */
  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const { data: address, error } = await ctx.supabase
        .schema('core')
        .from('addresses')
        .select(
          `
          *,
          site:sites(
            id,
            site_identifier,
            boundary,
            area_sqft
          ),
          project_addresses(
            is_primary,
            project:projects(
              id,
              name,
              status,
              organization_id
            )
          )
        `
        )
        .eq('id', input.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Address not found: ${error.message}`,
        })
      }

      return { address }
    }),

  /**
   * Validate if address is contained within a site boundary
   */
  validateContainment: protectedProcedure
    .input(
      z.object({
        address_id: z.string().uuid(),
        site_id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: isContained, error } = await ctx.supabase.rpc('validate_address_in_site', {
        p_address_id: input.address_id,
        p_site_id: input.site_id,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to validate containment: ${error.message}`,
        })
      }

      return { contained: isContained || false }
    }),
})
