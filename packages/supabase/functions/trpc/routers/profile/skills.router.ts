import { createClient } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'
import {
  addUserSkillInputSchema,
  getSkillChildrenInputSchema,
  profileSkillsInputSchema,
  removeUserSkillInputSchema,
  searchParentSkillsInputSchema,
  searchSkillsInputSchema,
  updateUserSkillInputSchema,
  // @ts-expect-error - Deno requires .ts extension
} from '../../../_shared/schemas/consolidated.ts'
import { supabaseAnonKey, supabaseUrl } from '../../context.ts'
import { protectedProcedure, t } from '../../middleware.ts'

/**
 * Profile Skills router - handles skills management
 */
export const profileSkillsRouter = t.router({
  /**
   * Get list of industries for selector
   */
  getIndustries: protectedProcedure.query(async ({ ctx }) => {
    const { supabase } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('industries')
      .select('id, name, slug')
      .order('name')

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch industries: ${error.message}`,
      })
    }

    return { industries: data || [] }
  }),

  /**
   * Search parent skills only (simplified cascading approach)
   */
  searchParentSkills: protectedProcedure
    .input(searchParentSkillsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx

      const { data, error } = await supabase.rpc('search_parent_skills', {
        p_query: input.query,
        p_industry_id: input.industryId,
        p_limit: input.limit || 20,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to search parent skills: ${error.message}`,
        })
      }

      return { skills: data || [] }
    }),

  /**
   * Get all children of a parent skill
   */
  getSkillChildren: protectedProcedure
    .input(getSkillChildrenInputSchema)
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx

      const { data, error } = await supabase.rpc('get_skill_children', {
        p_parent_id: input.parentId,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get skill children: ${error.message}`,
        })
      }

      return { children: data || [] }
    }),

  /**
   * DEPRECATED: Search skills with hierarchy (use searchParentSkills instead)
   * Kept for backwards compatibility
   */
  searchSkills: protectedProcedure
    .input(searchSkillsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase } = ctx

      const { data, error } = await supabase.rpc('search_skills_with_hierarchy', {
        p_query: input.query,
        p_industry_id: input.industryId,
        p_limit: input.limit || 20,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to search skills: ${error.message}`,
        })
      }

      return { skills: data || [] }
    }),

  /**
   * Get skill details by ID
   */
  getSkillDetails: protectedProcedure
    .input(removeUserSkillInputSchema)
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx

      const { data, error } = await supabase.rpc('get_skill_details', {
        p_skill_id: input.skillId,
      })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch skill details: ${error.message}`,
        })
      }

      if (!data || data.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Skill not found',
        })
      }

      return { skill: data[0] }
    }),

  /**
   * Get user's skills with hierarchy
   */
  getUserSkills: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx

    const { data, error } = await supabase.rpc('get_user_skills_with_parents', {
      p_user_id: user.id,
    })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch user skills: ${error.message}`,
      })
    }

    // Separate explicit and implied skills
    const explicitSkills = (data || []).filter(
      (skill: { is_explicit: boolean }) => skill.is_explicit
    )
    const impliedSkills = (data || []).filter(
      (skill: { is_explicit: boolean }) => !skill.is_explicit
    )

    return {
      explicitSkills,
      impliedSkills,
      allSkills: data || [],
    }
  }),

  /**
   * Add skill to user profile
   */
  addUserSkill: protectedProcedure
    .input(addUserSkillInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, userToken } = ctx

      console.log('addUserSkill attempt:', {
        userId: user.id,
        skillId: input.skillId,
        hasToken: !!userToken,
        tokenLength: userToken?.length,
      })

      // Create a user-scoped client with anon key to properly respect RLS
      const userScopedClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })

      // Verify the user context is set properly
      const { data: authCheck, error: authError } = await userScopedClient.auth.getUser()
      console.log('Auth check before insert:', {
        hasAuthData: !!authCheck,
        authUserId: authCheck?.user?.id,
        authError: authError?.message,
      })

      const { data, error } = await userScopedClient.schema('core').from('user_skills').insert({
        user_id: user.id,
        skill_id: input.skillId,
        proficiency: input.proficiency,
        source: 'self',
      })

      console.log('Insert result:', {
        hasData: !!data,
        hasError: !!error,
        errorCode: error?.code,
        errorMessage: error?.message,
        errorDetails: error?.details,
      })

      if (error) {
        // Handle duplicate key error
        if (error.code === '23505') {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'You have already added this skill',
          })
        }

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to add skill: ${error.message}`,
        })
      }

      return { success: true }
    }),

  /**
   * Update user skill
   */
  updateUserSkill: protectedProcedure
    .input(updateUserSkillInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, userToken } = ctx

      const updateData: {
        proficiency?: number
        updated_at?: string
      } = {}

      if (input.proficiency !== undefined) {
        updateData.proficiency = input.proficiency
      }

      if (Object.keys(updateData).length === 0) {
        return { success: true }
      }

      // Create a user-scoped client with anon key to properly respect RLS
      const userScopedClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })

      const { error } = await userScopedClient
        .schema('core')
        .from('user_skills')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('skill_id', input.skillId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update skill: ${error.message}`,
        })
      }

      return { success: true }
    }),

  /**
   * Remove user skill
   */
  removeUserSkill: protectedProcedure
    .input(removeUserSkillInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { user, userToken } = ctx

      // Create a user-scoped client with anon key to properly respect RLS
      const userScopedClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: {
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        },
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })

      const { error } = await userScopedClient
        .schema('core')
        .from('user_skills')
        .delete()
        .eq('user_id', user.id)
        .eq('skill_id', input.skillId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to remove skill: ${error.message}`,
        })
      }

      return { success: true }
    }),

  /**
   * LEGACY: Get skills (backwards compatibility)
   */
  getSkills: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx

    // Get user's primary industry from users table
    const { data: userData } = await supabase
      .schema('core')
      .from('users')
      .select('industry_id')
      .eq('id', user.id)
      .single()

    // Get user's explicit skills
    const { data: skillsData } = await supabase
      .schema('core')
      .from('user_skills')
      .select(`
        skill_id,
        proficiency,
        skills!inner (
          id,
          name
        )
      `)
      .eq('user_id', user.id)

    const skills = (skillsData || []).map((us) => {
      // Handle both object and array cases from Supabase typing
      const skillsRelation = us.skills as
        | { id: string; name: string }
        | { id: string; name: string }[]
        | null

      const skillName = Array.isArray(skillsRelation)
        ? skillsRelation[0]?.name
        : skillsRelation?.name

      return {
        skill_id: us.skill_id,
        skill_name: skillName || '',
        proficiency: us.proficiency,
        years_experience: 0,
        is_primary: false,
        endorsed_count: 0,
      }
    })

    return {
      skills,
      primary_industry_id: userData?.industry_id || null,
      secondary_industries: [],
      skill_categories: [],
    }
  }),

  /**
   * LEGACY: Update skills (backwards compatibility)
   */
  updateSkills: protectedProcedure
    .input(profileSkillsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      // Update primary industry if provided
      if (input.industry_id !== undefined) {
        const { error: industryError } = await supabase
          .schema('core')
          .from('users')
          .update({
            industry_id: input.industry_id,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id)

        if (industryError) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to update industry: ${industryError.message}`,
          })
        }
      }

      return { success: true }
    }),
})
