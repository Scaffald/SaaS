import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, publicProcedure, t } from '../../middleware.ts';

/**
 * Profile Vanity URL router - handles slug-based profile access and management
 */

const slugInputSchema = z.object({
  slug: z.string().min(3).max(50),
})

export const profileVanityRouter = t.router({
  /**
   * Get profile by slug (public endpoint)
   * Returns public profile data for vanity URL access
   */
  bySlug: publicProcedure.input(slugInputSchema).query(async ({ ctx, input }) => {
    const { supabase } = ctx

    // Find user by slug
    const { data: user, error: userError } = await supabase
      .schema('core')
      .from('users')
      .select(
        'id, username, slug, avatar_path, avatar_url, about, headline, display_name, industry_id, years_of_experience, open_to_work, industries(id, name, slug)'
      )
      .eq('slug', input.slug.toLowerCase())
      .single()

    if (userError || !user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: `Profile with slug "${input.slug}" not found`,
      })
    }

    // Get profile visibility settings
    const { data: preferences } = await supabase
      .schema('core')
      .from('preferences')
      .select('profile_visibility')
      .eq('user_id', user.id)
      .single()

    const visibility = preferences?.profile_visibility || {
      work_experience: true,
      education: true,
      skills: true,
      certifications: true,
      reviews: true,
      contact_info: false,
    }

    return {
      ...user,
      visibility,
    }
  }),

  /**
   * Check if a slug is available
   * Public endpoint for real-time availability checking
   * Excludes current user's slug if authenticated
   */
  checkSlug: publicProcedure.input(slugInputSchema).query(async ({ ctx, input }) => {
    const { supabase, user } = ctx

    const slug = input.slug.toLowerCase().trim()

    // Build query - exclude current user's slug if authenticated
    let query = supabase.schema('core').from('users').select('id, slug').eq('slug', slug)

    // If user is authenticated, exclude their own slug from the check
    if (user?.id) {
      query = query.neq('id', user.id)
    }

    const { data: existingUser, error } = await query.maybeSingle()

    if (error && error.code !== 'PGRST116') {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to check slug availability: ${error.message}`,
      })
    }

    const available = !existingUser

    // Generate suggestions if not available
    let suggestions: string[] = []
    if (!available) {
      // Get similar slugs to generate suggestions
      const { data: similarUsers } = await supabase
        .schema('core')
        .from('users')
        .select('slug')
        .like('slug', `${slug}%`)
        .limit(10)

      const existingSlugs = (similarUsers || []).map((u: { slug?: string | null; [key: string]: unknown }) => u.slug || '').filter(Boolean)
      suggestions = generateSlugSuggestions(slug, existingSlugs)
    }

    return {
      available,
      suggestions: available ? [] : suggestions,
    }
  }),

  /**
   * Update user's slug (protected endpoint)
   * Enforces 30-day cooldown between changes
   */
  updateSlug: protectedProcedure.input(slugInputSchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx

    const newSlug = input.slug.toLowerCase().trim()

    // Check 30-day cooldown
    const { data: lastChange, error: historyError } = await supabase
      .schema('core')
      .from('slug_change_history')
      .select('changed_at')
      .eq('user_id', user.id)
      .order('changed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (historyError && historyError.code !== 'PGRST116') {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to check slug change history: ${historyError.message}`,
      })
    }

    if (lastChange) {
      const daysSinceChange =
        (Date.now() - new Date(lastChange.changed_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceChange < 30) {
        const daysRemaining = Math.ceil(30 - daysSinceChange)
        const nextChangeDate = new Date(
          new Date(lastChange.changed_at).getTime() + 30 * 24 * 60 * 60 * 1000
        )
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Slug can only be changed once every 30 days. Next change available in ${daysRemaining} days (${nextChangeDate.toLocaleDateString()})`,
        })
      }
    }

    // Get current slug
    const { data: currentUser } = await supabase
      .schema('core')
      .from('users')
      .select('slug')
      .eq('id', user.id)
      .single()

    // Check if new slug is available
    const { data: existingUser } = await supabase
      .schema('core')
      .from('users')
      .select('id')
      .eq('slug', newSlug)
      .maybeSingle()

    if (existingUser && existingUser.id !== user.id) {
      // Generate suggestions
      const { data: similarUsers } = await supabase
        .schema('core')
        .from('users')
        .select('slug')
        .like('slug', `${newSlug}%`)
        .limit(10)

      const existingSlugs = (similarUsers || []).map((u: { slug?: string | null; [key: string]: unknown }) => u.slug || '').filter(Boolean)
      const suggestions = generateSlugSuggestions(newSlug, existingSlugs)

      throw new TRPCError({
        code: 'CONFLICT',
        message: `Slug "${newSlug}" is already taken`,
        cause: { suggestions },
      })
    }

    // Update slug
    const { error: updateError } = await supabase
      .schema('core')
      .from('users')
      .update({ slug: newSlug, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (updateError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to update slug: ${updateError.message}`,
      })
    }

    // Record in history
    const { error: historyInsertError } = await supabase
      .schema('core')
      .from('slug_change_history')
      .insert({
        user_id: user.id,
        old_slug: currentUser?.slug || null,
        new_slug: newSlug,
      })

    if (historyInsertError) {
      console.error('Failed to record slug change history:', historyInsertError)
      // Don't fail the request, just log the error
    }

    // Calculate next change date
    const nextChangeDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

    return {
      success: true,
      slug: newSlug,
      nextChangeAllowed: nextChangeDate.toISOString(),
    }
  }),

  /**
   * Get slug change history and next allowed change date
   * Protected endpoint for viewing own slug change history
   */
  getSlugHistory: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx

    const { data: history, error } = await supabase
      .schema('core')
      .from('slug_change_history')
      .select('old_slug, new_slug, changed_at')
      .eq('user_id', user.id)
      .order('changed_at', { ascending: false })
      .limit(10)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch slug history: ${error.message}`,
      })
    }

    // Get last change date
    const lastChange = history?.[0]
    let nextChangeAllowed: string | null = null
    let daysRemaining: number | null = null

    if (lastChange) {
      const daysSinceChange =
        (Date.now() - new Date(lastChange.changed_at).getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceChange < 30) {
        daysRemaining = Math.ceil(30 - daysSinceChange)
        nextChangeAllowed = new Date(
          new Date(lastChange.changed_at).getTime() + 30 * 24 * 60 * 60 * 1000
        ).toISOString()
      }
    }

    return {
      history: history || [],
      nextChangeAllowed,
      daysRemaining,
    }
  }),
})

/**
 * Generate slug suggestions when slug is taken
 */
function generateSlugSuggestions(baseSlug: string, existingSlugs: string[]): string[] {
  const suggestions: string[] = []
  const existingSet = new Set(existingSlugs.map((s) => s.toLowerCase()))

  // Strategy 1: Add numeric suffix
  for (let i = 2; i <= 5; i++) {
    const candidate = `${baseSlug}-${i}`
    if (!existingSet.has(candidate)) {
      suggestions.push(candidate)
      if (suggestions.length >= 3) break
    }
  }

  // Strategy 2: Add common suffixes
  if (suggestions.length < 3) {
    const suffixes = ['dev', 'pro', 'official']
    for (const suffix of suffixes) {
      if (suggestions.length >= 3) break
      const candidate = `${baseSlug}-${suffix}`
      if (!existingSet.has(candidate)) {
        suggestions.push(candidate)
      }
    }
  }

  // Strategy 3: Remove dashes
  if (suggestions.length < 3) {
    const candidate = baseSlug.replace(/-/g, '')
    if (candidate.length >= 3 && !existingSet.has(candidate)) {
      suggestions.push(candidate)
    }
  }

  return suggestions.slice(0, 3)
}
