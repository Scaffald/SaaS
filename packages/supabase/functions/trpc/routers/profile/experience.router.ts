import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { addressSchema } from '@scf/trpc/schemas'
import { protectedProcedure, t } from '../../middleware.ts'

/**
 * Location formatting helper
 * Computes formattedAddress from standard address object
 */
function formatLocation(location: string | object | null | undefined, isRemote: boolean): string {
  if (!location) return ''

  if (typeof location === 'string') {
    return isRemote ? `${location} (Remote)` : location
  }

  if (typeof location === 'object' && location !== null) {
    const addr = location as Record<string, unknown>

    // If formattedAddress exists (backward compatibility), use it
    if ('formattedAddress' in addr && typeof addr.formattedAddress === 'string') {
      const locationStr = addr.formattedAddress || ''
      return isRemote ? `${locationStr} (Remote)` : locationStr
    }

    // Otherwise, compute from standard address fields
    const street = typeof addr.street === 'string' ? addr.street : ''
    const city = typeof addr.city === 'string' ? addr.city : ''
    const state = typeof addr.state === 'string' ? addr.state : ''
    const zip = typeof addr.zip === 'string' ? addr.zip : ''

    // Build formatted address from available parts
    const addressParts = [street, city, state, zip].filter(Boolean)
    const locationStr =
      addressParts.length > 0
        ? addressParts.join(', ')
        : city && state
          ? `${city}, ${state}`
          : city || state || ''

    return isRemote ? `${locationStr} (Remote)` : locationStr
  }

  return ''
}

/**
 * Convert location to structured format for storage
 */
function getStructuredLocation(location: string | object | null | undefined): object | null {
  if (!location) return null
  if (typeof location === 'object') return location
  // If it's a string, we can't convert it reliably - return null and keep using text column
  return null
}

/**
 * Get formatted location string for display/storage in TEXT column
 */
function getFormattedLocationString(
  location: string | object | null | undefined,
  isRemote: boolean
): string | null {
  const formatted = formatLocation(location, isRemote)
  return formatted || null
}

/**
 * Experience Input/Output Schemas
 * Location uses standard address schema (all fields optional)
 */
const locationSchema = z
  .union([
    z.string(), // Backward compatibility
    // biome-ignore lint/suspicious/noExplicitAny: Address schema type compatibility
    addressSchema as any, // Standard address format (street, city, state, zip, country, latitude, longitude - all optional)
  ])
  .optional()
  .nullable()

const experienceEntrySchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  organization_id: z.string().uuid().optional().nullable(),
  job_title: z.string().min(1, 'Job title is required'),
  company_name: z.string().min(1, 'Company name is required'),
  employment_type: z.string().optional().nullable(),
  location: locationSchema,
  is_remote: z.boolean().default(false),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  is_current: z.boolean().default(false),
  description: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
})

const getExperienceOutputSchema = z.array(experienceEntrySchema)

const saveExperienceInputSchema = z.object({
  career_level: z.string().optional().nullable(),
  experience_entries: z.array(experienceEntrySchema),
})

const saveExperienceOutputSchema = z.object({
  success: z.boolean(),
  experience_entries: z.array(experienceEntrySchema),
})

const deleteExperienceInputSchema = z.object({
  experienceId: z.string().uuid(),
})

const deleteExperienceOutputSchema = z.object({
  success: z.boolean(),
})

/**
 * Profile Experience router - handles work experience CRUD operations
 */
export const profileExperienceRouter = t.router({
  /**
   * Get user's experience entries
   */
  // biome-ignore lint/suspicious/noExplicitAny: Output schema type compatibility
  getExperience: protectedProcedure
    .output(getExperienceOutputSchema as any)
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx

      const { data, error } = await supabase
        .schema('core')
        .from('user_experience')
        .select('*')
        .eq('user_id', user.id)
        .order('start_date', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch experience: ${error.message}`,
        })
      }

      // Transform data to prefer location_structured, fallback to location TEXT
      return (data || []).map(
        (exp: {
          location_structured?: string | null
          location?: string | null
          [key: string]: unknown
        }) => ({
          ...exp,
          location: exp.location_structured || exp.location || null,
        })
      )
    }),

  /**
   * Get experience summary from private.profile
   */
  getExperienceSummary: protectedProcedure
    .output(
      z.object({
        career_level: z.string().nullable(),
      })
    )
    .query(async ({ ctx }) => {
      const { supabase, user } = ctx

      const { data, error } = await supabase
        .schema('core')
        .from('profile')
        .select('career_level')
        .eq('user_id', user.id)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch experience summary: ${error.message}`,
        })
      }

      return {
        career_level: data?.career_level || null,
      }
    }),

  /**
   * Save experience (create/update bulk)
   */
  saveExperience: protectedProcedure
    .input(saveExperienceInputSchema)
    .output(saveExperienceOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      try {
        // Update experience summary in private.profile if provided
        if (input.career_level !== undefined) {
          const updateData: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
            career_level: input.career_level,
          }

          const { error: summaryError } = await supabase
            .schema('core')
            .from('profile')
            .update(updateData)
            .eq('user_id', user.id)

          if (summaryError) {
            throw new TRPCError({
              code: 'INTERNAL_SERVER_ERROR',
              message: `Failed to update experience summary: ${summaryError.message}`,
            })
          }
        }

        const savedExperience = []

        for (const exp of input.experience_entries) {
          // Prepare location data - write to both columns for backward compatibility
          const structuredLocation = getStructuredLocation(exp.location)
          const formattedLocationString = getFormattedLocationString(exp.location, exp.is_remote)

          const updateData: Record<string, unknown> = {
            organization_id: exp.organization_id || null,
            job_title: exp.job_title,
            company_name: exp.company_name,
            employment_type: exp.employment_type || null,
            location: formattedLocationString,
            location_structured: structuredLocation,
            is_remote: exp.is_remote,
            start_date: exp.start_date || null,
            end_date: exp.end_date || null,
            is_current: exp.is_current,
            description: exp.description || null,
          }

          if (exp.id) {
            // Update existing experience
            updateData.updated_at = new Date().toISOString()

            const { data, error } = await supabase
              .schema('core')
              .from('user_experience')
              .update(updateData)
              .eq('id', exp.id)
              .eq('user_id', user.id)
              .select()
              .single()

            if (error) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Failed to update experience: ${error.message}`,
              })
            }

            // Transform response to prefer location_structured
            savedExperience.push({
              ...data,
              location: data.location_structured || data.location || null,
            })
          } else {
            // Create new experience
            const { data, error } = await supabase
              .schema('core')
              .from('user_experience')
              .insert({
                user_id: user.id,
                ...updateData,
              })
              .select()
              .single()

            if (error) {
              throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: `Failed to create experience: ${error.message}`,
              })
            }

            // Transform response to prefer location_structured
            savedExperience.push({
              ...data,
              location: data.location_structured || data.location || null,
            })
          }
        }

        return {
          success: true,
          experience_entries: savedExperience,
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Save experience error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to save experience: ${errorMessage}`,
        })
      }
    }),

  /**
   * Delete experience entry
   */
  deleteExperience: protectedProcedure
    .input(deleteExperienceInputSchema)
    .output(deleteExperienceOutputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      try {
        const { error } = await supabase
          .schema('core')
          .from('user_experience')
          .delete()
          .eq('id', input.experienceId)
          .eq('user_id', user.id)

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to delete experience: ${error.message}`,
          })
        }

        return { success: true }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.error('Delete experience error:', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to delete experience: ${errorMessage}`,
        })
      }
    }),
})
