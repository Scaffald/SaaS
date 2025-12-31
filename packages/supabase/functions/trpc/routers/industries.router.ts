import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { publicProcedure, t } from '../middleware.ts'

/**
 * Industries router - handles industry lookup operations
 */
export const industriesRouter = t.router({
  /**
   * Get industry by slug
   * Returns industry details for a given slug
   */
  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx

      const { data, error } = await supabase
        .schema('core')
        .from('industries')
        .select('id, name, slug, description')
        .eq('slug', input.slug)
        .single()

      if (error) {
        // If not found, return null instead of throwing
        if (error.code === 'PGRST116') {
          return null
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch industry: ${error.message}`,
        })
      }

      return data
    }),

  /**
   * Get all industries
   * Returns list of all industries
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    const { supabase } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('industries')
      .select('id, name, slug, description')
      .order('name', { ascending: true })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch industries: ${error.message}`,
      })
    }

    return data || []
  }),
})
