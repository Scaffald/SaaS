// @ts-nocheck
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import type { Context } from '../context.ts'
import { t } from '../middleware.ts'
import { enrichUserSkills } from './utils/skill-enrichment.ts'

async function userHasPlatformRole(ctx: Context): Promise<boolean> {
  if (!ctx.user?.id) return false
  const { data, error } = await (ctx.supabaseAdmin ?? ctx.supabase)
    .schema('core')
    .from('role_assignments')
    .select('role:roles(name, scope)')
    .eq('user_id', ctx.user.id)

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Unable to verify platform roles: ${error.message}`,
    })
  }

  return Boolean(
    data?.some(
      (assignment: { role?: { scope?: string; name?: string | null } | null; [key: string]: unknown }) =>
        assignment.role?.scope === 'platform' &&
        ['office', 'super_admin'].includes(assignment.role?.name ?? '')
    )
  )
}

async function ensureOrganizationAccess(ctx: Context, organizationId: string) {
  if (!ctx.user?.id) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  if (await userHasPlatformRole(ctx)) {
    return
  }

  const supabase = ctx.supabaseAdmin ?? ctx.supabase
  const { data: organization, error: orgError } = await supabase
    .schema('core')
    .from('organizations')
    .select('id, owner_user_id')
    .eq('id', organizationId)
    .maybeSingle()

  if (orgError) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load organization: ${orgError.message}`,
    })
  }

  if (!organization) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Organization not found',
    })
  }

  if (organization.owner_user_id === ctx.user.id) {
    return
  }

  const { data: assignment } = await supabase
    .schema('core')
    .from('role_assignments')
    .select('scope_org_id')
    .eq('user_id', ctx.user.id)
    .eq('scope_org_id', organizationId)
    .maybeSingle()

  if (!assignment) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have access to this organization',
    })
  }
}

export const userProfileRouter = t.router({
  /**
   * Get lightweight user profile preview for map view
   * Returns optimized data for quick loading in map context
   */
  getPreview: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get basic user info
      const { data: user, error: userError } = await ctx.supabase
        .schema('core')
        .from('users')
        .select('id, display_name, username, avatar_path, avatar_url, headline')
        .eq('id', input.userId)
        .single()

      if (userError || !user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `User profile not found: ${userError?.message || 'Unknown error'}`,
        })
      }

      // Get top 3-5 skills
      const { data: skills } = await ctx.supabase
        .schema('core')
        .from('user_skills')
        .select('proficiency_level, skill_taxonomy, csi_skill_id, onet_occupation_id')
        .eq('user_id', input.userId)
        .order('proficiency_level', { ascending: false })
        .limit(5)

      // Get location from profile
      const { data: profile } = await ctx.supabase
        .schema('core')
        .from('profile')
        .select('location, employment_city, employment_state')
        .eq('user_id', input.userId)
        .single()

      // Build location string
      const locationParts = []
      if (profile?.employment_city) {
        locationParts.push(profile.employment_city)
      }
      if (profile?.employment_state) {
        locationParts.push(profile.employment_state)
      }
      const location =
        locationParts.length > 0 ? locationParts.join(', ') : profile?.location || null

      // Build display name
      const displayName = user.display_name || user.username || 'User'

      return {
        id: user.id,
        displayName,
        avatarUrl: user.avatar_url,
        avatarPath: user.avatar_path,
        headline: user.headline,
        location,
        topSkills: (skills || []).slice(0, 5).map((skill: { proficiency_level?: number | null; skill_taxonomy?: string | null; csi_skill_id?: string | null; onet_occupation_id?: string | null; [key: string]: unknown }) => ({
          proficiency: skill.proficiency_level || 0,
          taxonomy: skill.skill_taxonomy,
          csiSkillId: skill.csi_skill_id,
          onetOccupationId: skill.onet_occupation_id,
        })),
      }
    }),
  // Get comprehensive user profile
  getUserProfile: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: profile, error } = await ctx.supabase
        .schema('core')
        .from('v_profile_search')
        .select(
          `
          id,
          name,
          avatar_url,
          headline,
          bio,
          industry_name,
          years_of_experience,
          gamified_score,
          location,
          availability,
          certifications,
          hourly_rate_cents,
          open_to_travel,
          travel_mileage,
          open_to_work,
          education_level
        `
        )
        .eq('id', input.userId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch user profile: ${error.message}`)
      }

      const { data: calculatedYears, error: yearsError } = await ctx.supabase.rpc(
        'calculate_years_of_experience',
        { p_user_id: input.userId }
      )

      if (yearsError) {
        console.warn('[userProfile.getUserProfile] Unable to calculate years of experience', {
          userId: input.userId,
          error: yearsError.message,
        })
      }

      return {
        ...profile,
        calculatedYearsOfExperience: calculatedYears ?? profile?.years_of_experience ?? 0,
      }
    }),

  // Get user skills with proficiency
  // Note: Uses polymorphic taxonomy (CSI/O*NET) from 002_data.sql
  getUserSkills: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: skills, error } = await ctx.supabase
        .schema('core')
        .from('user_skills')
        .select('*')
        .eq('user_id', input.userId)
        .order('proficiency_level', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch user skills: ${error.message}`)
      }

      return await enrichUserSkills(ctx.supabase, skills ?? [])
    }),

  // Get user certifications
  getUserCertifications: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: certifications, error } = await ctx.supabase
        .schema('core')
        .from('user_certifications')
        .select('*')
        .eq('user_id', input.userId)
        .eq('is_active', true)
        .order('issue_date', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch certifications: ${error.message}`)
      }

      return certifications || []
    }),

  // Get user work experience
  getUserExperience: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: experience, error } = await ctx.supabase
        .schema('core')
        .from('user_experience')
        .select('*')
        .eq('user_id', input.userId)
        .order('is_current', { ascending: false })
        .order('start_date', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch work experience: ${error.message}`)
      }

      return experience || []
    }),

  // Get user education
  getUserEducation: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { data: education, error } = await ctx.supabase
        .schema('core')
        .from('user_education')
        .select('*')
        .eq('user_id', input.userId)
        .order('is_current', { ascending: false })
        .order('start_date', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch education: ${error.message}`)
      }

      return education || []
    }),

  // Get user reviews summary
  getUserReviewsSummary: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      // Get reviews for this user (simplified for current schema)
      const { data: reviews, error: reviewsError } = await ctx.supabase
        .schema('core')
        .from('reviews')
        .select('*')
        .eq('subject_id', input.userId)
        .eq('subject_type', 'user')
        .order('created_at', { ascending: false })

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError)
        // Return empty data structure instead of throwing
        return {
          averageRating: 0,
          totalReviews: 0,
          ratings: {},
          strengths: [],
          improvements: [],
          reviews: [],
        }
      }

      const reviewsList = reviews || []
      const totalReviews = reviewsList.length

      // Calculate average rating if rating field exists
      const ratingsArray = reviewsList.filter((r: { rating?: number | null; [key: string]: unknown }) => r.rating != null).map((r: { rating?: number | null; [key: string]: unknown }) => r.rating)
      const averageRating =
        ratingsArray.length > 0
          ? Math.round(
              (ratingsArray.reduce((sum: number, val: number | null | undefined) => sum + (val ?? 0), 0) / ratingsArray.length) * 10
            ) / 10
          : 0

      // Return simplified structure (full review system not yet implemented in schema)
      return {
        averageRating,
        totalReviews,
        ratings: {},
        strengths: [],
        improvements: [],
        reviews: reviewsList.slice(0, 10).map((review: { id: string; headline?: string | null; body?: string | null; created_at: string; rating?: number | null; author_user_id?: string | null; [key: string]: unknown }) => ({
          id: review.id,
          headline: review.headline || '',
          body: review.body || '',
          date: review.created_at,
          rating: review.rating || 0,
          authorId: review.author_user_id,
        })),
      }
    }),

  // Get user contact info (requires authentication or permission)
  getUserContactInfo: t.procedure
    .input(
      z.object({
        userId: z.string().uuid(),
        organizationId: z.string().uuid(),
        applicationId: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      await ensureOrganizationAccess(ctx, input.organizationId)

      const supabaseAdmin = ctx.supabaseAdmin ?? ctx.supabase
      const { data: successFee } = await supabaseAdmin
        .schema('core')
        .from('success_fees')
        .select('id')
        .eq('organization_id', input.organizationId)
        .eq('application_id', input.applicationId)
        .eq('worker_user_id', input.userId)
        .eq('status', 'upfront_paid')
        .maybeSingle()

      if (!successFee) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Success fee payment is required to access worker contact information.',
        })
      }

      const { data: contactInfo, error } = await ctx.supabase
        .schema('core')
        .from('profile')
        .select(
          `
          email,
          phone,
          location,
          employment_city,
          employment_state,
          employment_zip
        `
        )
        .eq('user_id', input.userId)
        .single()

      if (error) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Contact information not found',
        })
      }

      return contactInfo
    }),
})
