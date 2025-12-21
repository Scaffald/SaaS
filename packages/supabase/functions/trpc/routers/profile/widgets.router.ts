import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { protectedProcedure, publicProcedure, t } from '../../middleware.ts';
import { enrichUserSkills } from '../utils/skill-enrichment.ts';

/**
 * Profile Widgets router - provides data queries for profile widget components
 * These queries support viewing own profile (protected) or other users' profiles (public)
 */

const userIdInputSchema = z.object({
  userId: z.string().optional(),
})

export const profileWidgetsRouter = t.router({
  /**
   * Get general info for display widget
   * Public endpoint - can view any user's public profile info
   */
  getGeneralInfo: publicProcedure
    .input(userIdInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const targetUserId = input?.userId || user?.id

      if (!targetUserId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User ID is required when not authenticated',
        })
      }

      // Get public profile data with industry name
      const { data: profile, error: profileError } = await supabase
        .schema('core')
        .from('users')
        .select(
          'id, username, slug, avatar_path, avatar_url, about, headline, display_name, industry_id, years_of_experience, open_to_work, industries(id, name, slug)'
        )
        .eq('id', targetUserId)
        .single()

      if (profileError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch profile: ${profileError.message}`,
        })
      }

      const { data: calculatedYears, error: yearsError } = await supabase.rpc(
        'calculate_years_of_experience',
        { p_user_id: targetUserId }
      )

      if (yearsError) {
        console.warn('[profile.widgets.getGeneralInfo] Failed to calculate years of experience', {
          userId: targetUserId,
          error: yearsError.message,
        })
      }

      // Get private data only if viewing own profile and authenticated
      let privateData = null
      if (user && targetUserId === user.id) {
        const { data, error: privateError } = await supabase
          .schema('core')
          .from('profile')
          .select('first_name, last_name, address, location')
          .eq('user_id', targetUserId)
          .single()

        if (privateError && privateError.code !== 'PGRST116') {
          console.warn('Failed to fetch private data:', privateError.message)
        } else {
          privateData = data
        }

        // Get email and phone from auth (only for own profile)
        if (ctx.userToken) {
          const { data: authUser, error: authError } = await supabase.auth.getUser(ctx.userToken)
          if (!authError && authUser?.user) {
            privateData = {
              ...privateData,
              email: authUser.user.email || '',
              phone: authUser.user.phone || '',
            }
          }
        }
      }

      const { data: idVerificationBadge, error: badgeError } = await supabase
        .schema('core')
        .from('v_id_verification_latest')
        .select('badge_status, badge_expires_at, verified_at')
        .eq('worker_user_id', targetUserId)
        .maybeSingle()

      if (badgeError && badgeError.code !== 'PGRST116') {
        console.warn('[profile.widgets.getGeneralInfo] Failed to load ID verification badge', {
          userId: targetUserId,
          error: badgeError.message,
        })
      }

      return {
        ...profile,
        calculatedYearsOfExperience: calculatedYears ?? profile?.years_of_experience ?? 0,
        privateData,
        idVerificationBadge,
      }
    }),

  /**
   * Get work experience for display widget
   * Public endpoint - can view any user's experience
   */
  getExperience: publicProcedure
    .input(userIdInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const targetUserId = input?.userId || user?.id

      if (!targetUserId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User ID is required when not authenticated',
        })
      }

      const { data, error } = await supabase
        .schema('core')
        .from('user_experience')
        .select('*')
        .eq('user_id', targetUserId)
        .order('start_date', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch experience: ${error.message}`,
        })
      }

      return data || []
    }),

  /**
   * Get education for display widget
   * Public endpoint - can view any user's education
   */
  getEducation: publicProcedure
    .input(userIdInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const targetUserId = input?.userId || user?.id

      if (!targetUserId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User ID is required when not authenticated',
        })
      }

      const { data, error } = await supabase
        .schema('core')
        .from('user_education')
        .select('*')
        .eq('user_id', targetUserId)
        .order('start_date', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch education: ${error.message}`,
        })
      }

      return data || []
    }),

  /**
   * Get skills for display widget
   * Public endpoint - can view any user's skills
   * Filters out soft_skills (only returns technical skills: csi and onet)
   */
  getSkills: publicProcedure.input(userIdInputSchema.optional()).query(async ({ ctx, input }) => {
    const { supabase, user } = ctx
    const targetUserId = input?.userId || user?.id

    if (!targetUserId) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'User ID is required when not authenticated',
      })
    }

    const { data, error } = await supabase
      .schema('core')
      .from('user_skills')
      .select('*')
      .eq('user_id', targetUserId)
      .in('skill_taxonomy', ['csi', 'onet'])
      .order('created_at', { ascending: false })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch skills: ${error.message}`,
      })
    }

    const enrichedSkills = await enrichUserSkills(supabase, data ?? [])
    
    // Filter out skills with "Unknown" labels (missing reference data)
    return enrichedSkills.filter(
      (skill) => skill.name !== 'Unknown Occupation' && skill.name !== 'Unknown CSI Skill'
    )
  }),

  /**
   * Get certifications for display widget
   * Public endpoint - can view any user's certifications
   */
  getCertifications: publicProcedure
    .input(userIdInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const { supabase, user } = ctx
      const targetUserId = input?.userId || user?.id

      if (!targetUserId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'User ID is required when not authenticated',
        })
      }

      const { data, error } = await supabase
        .schema('core')
        .from('user_certifications')
        .select('*')
        .eq('user_id', targetUserId)
        .order('issue_date', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch certifications: ${error.message}`,
        })
      }

      return data || []
    }),

  /**
   * Get work preferences for display widget
   * Protected endpoint - only for viewing own profile
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('profile')
      .select(
        'availability, preferred_work_locations, open_to_travel, travel_distance_miles, career_level, hourly_rate_cents, us_resident, us_passport, authorized_countries, veteran, military_status, drivers_license_classes'
      )
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch preferences: ${error.message}`,
      })
    }

    return data || {}
  }),
})
