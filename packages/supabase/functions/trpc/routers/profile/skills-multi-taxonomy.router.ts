import { createClient } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { supabaseAnonKey, supabaseUrl } from '../../context.ts'
import { protectedProcedure, t } from '../../middleware.ts'

/**
 * Multi-Taxonomy Skills Router
 * Supports CSI (Construction only) and O*NET (all industries)
 */

// Input schemas
const addSkillInputSchema = z.object({
  taxonomy: z.enum(['csi', 'onet']),
  skillId: z.string(), // UUID for CSI, code for O*NET
  proficiencyLevel: z.number().min(0).max(5),
  yearsExperience: z.number().optional(),
  notes: z.string().optional(),
})

const updateSkillInputSchema = z.object({
  userSkillId: z.string().uuid(),
  proficiencyLevel: z.number().min(0).max(5).optional(),
  yearsExperience: z.number().optional(),
  notes: z.string().optional(),
})

const removeSkillInputSchema = z.object({
  userSkillId: z.string().uuid(),
})

export const skillsMultiTaxonomyRouter = t.router({
  /**
   * Get available industries
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
   * Get user's skills with details from both taxonomies
   */
  getUserSkills: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('user_skills')
      .select(`
        id,
        skill_taxonomy,
        csi_skill_id,
        onet_occupation_id,
        proficiency_level,
        years_experience,
        verified,
        notes,
        created_at
      `)
      .eq('user_id', user.id)
      .in('skill_taxonomy', ['csi', 'onet'])
      .order('created_at', { ascending: false })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch user skills: ${error.message}`,
      })
    }

    // Enrich with skill details
    const enrichedSkills = await Promise.all(
      (data || []).map(
        async (skill: {
          skill_taxonomy?: string | null
          csi_skill_id?: string | null
          [key: string]: unknown
        }) => {
          if (skill.skill_taxonomy === 'csi' && skill.csi_skill_id) {
            const { data: csiData } = await supabase
              .schema('data')
              .from('masterformat')
              .select('code_key, code_display, name, depth')
              .eq('id', skill.csi_skill_id)
              .single()

            return {
              ...skill,
              skill_details: csiData
                ? {
                    code: csiData.code_key,
                    display_code: csiData.code_display,
                    name: csiData.name,
                    hierarchy_level: csiData.depth,
                  }
                : null,
            }
          }

          if (skill.skill_taxonomy === 'onet' && skill.onet_occupation_id) {
            const { data: onetData } = await supabase
              .schema('onet')
              .from('occupation_data')
              .select('onetsoc_code, title, description')
              .eq('onetsoc_code', skill.onet_occupation_id)
              .single()

            return {
              ...skill,
              skill_details: onetData
                ? {
                    code: onetData.onetsoc_code,
                    display_code: onetData.onetsoc_code,
                    name: onetData.title,
                    description: onetData.description,
                    hierarchy_level: null,
                  }
                : null,
            }
          }

          return { ...skill, skill_details: null }
        }
      )
    )

    // Filter out skills without valid details (shouldn't happen with the taxonomy filter above, but safety check)
    const validSkills = enrichedSkills.filter((skill) => skill.skill_details !== null)

    return { skills: validSkills }
  }),

  /**
   * Add a skill to user's profile
   * Automatically adds parent skills if the selected skill is a child (CSI only)
   */
  addSkill: protectedProcedure.input(addSkillInputSchema).mutation(async ({ ctx, input }) => {
    const { user, userToken, supabase } = ctx

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

    // Helper function to ensure a skill is added (handles duplicates gracefully)
    const ensureSkillAdded = async (
      skillId: string,
      taxonomy: 'csi' | 'onet',
      proficiencyLevel: number,
      yearsExperience?: number,
      notes?: string
    ): Promise<void> => {
      const skillData: {
        user_id: string
        skill_taxonomy: 'csi' | 'onet'
        proficiency_level: number
        csi_skill_id?: string
        onet_occupation_id?: string
        years_experience?: number
        notes?: string
      } = {
        user_id: user.id,
        skill_taxonomy: taxonomy,
        proficiency_level: proficiencyLevel,
      }

      if (taxonomy === 'csi') {
        skillData.csi_skill_id = skillId
      } else {
        skillData.onet_occupation_id = skillId
      }

      if (yearsExperience !== undefined) {
        skillData.years_experience = yearsExperience
      }

      if (notes) {
        skillData.notes = notes
      }

      const { error } = await userScopedClient.schema('core').from('user_skills').insert(skillData)

      // Ignore duplicate errors (user already has this skill)
      if (error && error.code !== '23505') {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to add skill: ${error.message}`,
        })
      }
    }

    // For CSI skills, check if it has parents and add them first
    if (input.taxonomy === 'csi') {
      // Get all parent IDs for this skill
      const { data: parentIds, error: parentError } = await supabase.rpc('get_skill_parent_ids', {
        p_skill_id: input.skillId,
      })

      if (parentError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to get parent skills: ${parentError.message}`,
        })
      }

      // Add parent skills first (from root to immediate parent)
      if (parentIds && parentIds.length > 0) {
        for (const parentId of parentIds) {
          await ensureSkillAdded(
            parentId,
            'csi',
            input.proficiencyLevel, // Use same proficiency for parents
            input.yearsExperience,
            input.notes
          )
        }
      }
    }

    // Add the selected skill (handles duplicates gracefully)
    try {
      await ensureSkillAdded(
        input.skillId,
        input.taxonomy,
        input.proficiencyLevel,
        input.yearsExperience,
        input.notes
      )
    } catch (error) {
      // Re-throw TRPCError as-is
      if (error instanceof TRPCError) {
        throw error
      }
      // Handle unexpected errors
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to add skill: ${error instanceof Error ? error.message : 'Unknown error'}`,
      })
    }

    return { success: true }
  }),

  /**
   * Update a user skill
   */
  updateSkill: protectedProcedure.input(updateSkillInputSchema).mutation(async ({ ctx, input }) => {
    const { user, userToken } = ctx

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

    const updateData: {
      proficiency_level?: number
      years_experience?: number
      notes?: string
    } = {}
    if (input.proficiencyLevel !== undefined) {
      updateData.proficiency_level = input.proficiencyLevel
    }
    if (input.yearsExperience !== undefined) {
      updateData.years_experience = input.yearsExperience
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes
    }

    if (Object.keys(updateData).length === 0) {
      return { success: true }
    }

    const { error } = await userScopedClient
      .schema('core')
      .from('user_skills')
      .update(updateData)
      .eq('id', input.userSkillId)
      .eq('user_id', user.id)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to update skill: ${error.message}`,
      })
    }

    return { success: true }
  }),

  /**
   * Remove a user skill
   */
  removeSkill: protectedProcedure.input(removeSkillInputSchema).mutation(async ({ ctx, input }) => {
    const { user, userToken } = ctx

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
      .eq('id', input.userSkillId)
      .eq('user_id', user.id)

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to remove skill: ${error.message}`,
      })
    }

    return { success: true }
  }),

  /**
   * Get user's primary industry
   */
  getPrimaryIndustry: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('users')
      .select('industry_id, industries(id, name, slug)')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch primary industry: ${error.message}`,
      })
    }

    return {
      primary_industry_id: data?.industry_id || null,
      industry: data?.industries || null,
    }
  }),

  /**
   * Update user's primary industry
   */
  updatePrimaryIndustry: protectedProcedure
    .input(z.object({ industryId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { supabase, user } = ctx

      const { error } = await supabase
        .schema('core')
        .from('users')
        .update({
          industry_id: input.industryId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to update primary industry: ${error.message}`,
        })
      }

      return { success: true }
    }),
})
