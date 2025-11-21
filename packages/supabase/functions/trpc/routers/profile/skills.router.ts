import { createClient } from '@supabase/supabase-js'
import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { softSkillsUpdateSchema } from '../../../_shared/profile-schemas.ts'
import {
  addUserSkillInputSchema,
  getSkillChildrenInputSchema,
  profileSkillsInputSchema,
  removeUserSkillInputSchema,
  searchParentSkillsInputSchema,
  updateUserSkillInputSchema,
} from '@app/trpc/schemas'
import { supabaseAnonKey, supabaseUrl } from '../../context.ts'
import { protectedProcedure, t } from '../../middleware.ts'

const publicProcedure = t.procedure

const SOFT_SKILL_CATEGORIES = ['reliability', 'collaboration', 'professionalism', 'technical'] as const

const softSkillRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  category: z.enum(SOFT_SKILL_CATEGORIES),
  description: z.string().nullable(),
  order_index: z.number().int().nullable(),
})

type SoftSkillCategory = (typeof SOFT_SKILL_CATEGORIES)[number]
type CategoryAverages = Record<SoftSkillCategory, number>
type MaybeArray<T> = T | T[] | null

interface SoftSkillCatalogEntry {
  id: string
  name: string
  category: SoftSkillCategory
  description: string | null
  orderIndex: number
}

interface SoftSkillView extends SoftSkillCatalogEntry {
  rating: number | null
  selfAssessedAt: string | null
}

const defaultCategoryAverages = (): CategoryAverages => ({
  reliability: 0,
  collaboration: 0,
  professionalism: 0,
  technical: 0,
})

const calculateCategoryAverages = (entries: Array<{ category: SoftSkillCategory; rating: number | null }>): CategoryAverages => {
  const totals: Record<SoftSkillCategory, { total: number; count: number }> = {
    reliability: { total: 0, count: 0 },
    collaboration: { total: 0, count: 0 },
    professionalism: { total: 0, count: 0 },
    technical: { total: 0, count: 0 },
  }

  for (const entry of entries) {
    if (entry.rating === null || entry.rating === undefined) continue
    totals[entry.category].total += entry.rating
    totals[entry.category].count += 1
  }

  return {
    reliability: totals.reliability.count ? Number((totals.reliability.total / totals.reliability.count).toFixed(2)) : 0,
    collaboration: totals.collaboration.count ? Number((totals.collaboration.total / totals.collaboration.count).toFixed(2)) : 0,
    professionalism: totals.professionalism.count ? Number((totals.professionalism.total / totals.professionalism.count).toFixed(2)) : 0,
    technical: totals.technical.count ? Number((totals.technical.total / totals.technical.count).toFixed(2)) : 0,
  }
}

const calculateAlignmentScore = (self?: CategoryAverages | null, peer?: CategoryAverages | null): number | null => {
  if (!self || !peer) {
    return null
  }

  const totalDiff = SOFT_SKILL_CATEGORIES.reduce((sum, category) => sum + Math.abs(self[category] - peer[category]), 0)
  const avgDiff = totalDiff / SOFT_SKILL_CATEGORIES.length
  const alignment = Math.max(0, 1 - avgDiff / 4)
  return Math.round(alignment * 100)
}

const resolveRelation = <T>(relation: MaybeArray<T>): T | undefined => {
  if (Array.isArray(relation)) {
    return relation[0]
  }
  return relation ?? undefined
}

const fetchSoftSkillsCatalog = async (supabase: ReturnType<typeof createClient>): Promise<SoftSkillCatalogEntry[]> => {
  const { data, error } = await supabase
    .schema('core')
    .from('soft_skills')
    .select('id, name, category, description, order_index')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (error) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load soft skills catalog: ${error.message}`,
      cause: error,
    })
  }

  if (!data || data.length === 0) {
    return []
  }

  const parsed = z.array(softSkillRecordSchema).safeParse(data)

  if (!parsed.success) {
    console.error('[profileSkillsRouter] Invalid soft skills catalog payload', parsed.error.flatten())
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Soft skills catalog is misconfigured',
    })
  }

  return parsed.data.map((record) => ({
    id: record.id,
    name: record.name,
    category: record.category,
    description: record.description,
    orderIndex: record.order_index ?? 0,
  }))
}

const loadLatestSoftSkillRatings = async (
  supabase: ReturnType<typeof createClient>,
  userId: string,
): Promise<{ version: number | null; ratings: Map<string, number>; selfAssessedAt: string | null }> => {
  const { data: latestVersionRow, error: latestVersionError } = await supabase
    .schema('core')
    .from('user_skills')
    .select('version')
    .eq('user_id', userId)
    .eq('skill_taxonomy', 'soft_skills')
    .order('version', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latestVersionError && latestVersionError.code !== 'PGRST116') {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load latest soft skill version: ${latestVersionError.message}`,
      cause: latestVersionError,
    })
  }

  const version = latestVersionRow?.version ?? null

  if (!version) {
    return { version: null, ratings: new Map(), selfAssessedAt: null }
  }

  const { data: rows, error: rowsError } = await supabase
    .schema('core')
    .from('user_skills')
    .select('soft_skill_id, proficiency_level, self_assessed_at')
    .eq('user_id', userId)
    .eq('skill_taxonomy', 'soft_skills')
    .eq('version', version)

  if (rowsError) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to load soft skill ratings: ${rowsError.message}`,
      cause: rowsError,
    })
  }

  const ratings = new Map<string, number>()
  let timestamp: string | null = null

  for (const row of rows ?? []) {
    if (!row.soft_skill_id) continue
    if (typeof row.proficiency_level === 'number') {
      ratings.set(row.soft_skill_id, row.proficiency_level)
    }
    if (!timestamp && row.self_assessed_at) {
      timestamp = row.self_assessed_at
    }
  }

  return { version, ratings, selfAssessedAt: timestamp }
}

const createUserScopedClient = (userToken?: string) => {
  if (!userToken) {
    throw new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'Missing user token for soft skills mutation',
    })
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
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
}

const canViewSoftSkills = async (
  supabase: ReturnType<typeof createClient>,
  targetUserId: string,
  viewerUserId: string | null,
): Promise<boolean> => {
  if (viewerUserId && viewerUserId === targetUserId) {
    return true
  }

  const { data, error } = await supabase
    .schema('core')
    .from('preferences')
    .select('profile_visibility')
    .eq('user_id', targetUserId)
    .maybeSingle()

  if (error && error.code !== 'PGRST116') {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `Failed to evaluate profile visibility: ${error.message}`,
      cause: error,
    })
  }

  const visibility = (data?.profile_visibility as Record<string, unknown> | null | undefined)?.skills

  if (visibility === undefined || visibility === null) {
    return true
  }

  if (typeof visibility === 'boolean') {
    return visibility
  }

  if (typeof visibility === 'string') {
    return visibility.toLowerCase() === 'true'
  }

  return true
}

const getSoftSkillsInputSchema = z.object({
  userId: z.string().uuid().optional(),
  version: z.number().int().min(1).optional(),
})

/**
 * Profile Skills router - handles skills management
 */
export const profileSkillsRouter = t.router({
  getSoftSkills: publicProcedure
    .input(getSoftSkillsInputSchema.optional())
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx
      const viewerId = ctx.user?.id ?? null
      const targetUserId = input?.userId ?? viewerId

      if (!targetUserId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'userId is required to view soft skills',
        })
      }

      const isVisible = await canViewSoftSkills(supabase, targetUserId, viewerId)

      if (!isVisible) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Soft skills are private for this user',
        })
      }

      const catalog = await fetchSoftSkillsCatalog(supabase)

      if (catalog.length === 0) {
        return {
          version: null,
          lastUpdated: null,
          categoryAverages: defaultCategoryAverages(),
          skills: [] as SoftSkillView[],
        }
      }

      let version = input?.version ?? null
      const ratingMap = new Map<string, { rating: number | null; updatedAt: string | null }>()
      let lastUpdated: string | null = null

      if (!version) {
        const { version: latestVersion, ratings, selfAssessedAt } = await loadLatestSoftSkillRatings(supabase, targetUserId)
        version = latestVersion
        if (selfAssessedAt) {
          lastUpdated = selfAssessedAt
        }
        ratings.forEach((rating, skillId) => {
          ratingMap.set(skillId, { rating, updatedAt: selfAssessedAt })
        })
      } else {
        const { data, error } = await supabase
          .schema('core')
          .from('user_skills')
          .select('soft_skill_id, proficiency_level, self_assessed_at')
          .eq('user_id', targetUserId)
          .eq('skill_taxonomy', 'soft_skills')
          .eq('version', version)

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to load soft skills: ${error.message}`,
            cause: error,
          })
        }

        for (const row of data ?? []) {
          if (!row.soft_skill_id) continue
          const ratingValue = typeof row.proficiency_level === 'number' ? row.proficiency_level : null
          const updatedAt = row.self_assessed_at ?? null
          ratingMap.set(row.soft_skill_id, { rating: ratingValue, updatedAt })
          if (updatedAt && (!lastUpdated || updatedAt > lastUpdated)) {
            lastUpdated = updatedAt
          }
        }
      }

      if (!version) {
        return {
          version: null,
          lastUpdated: null,
          categoryAverages: defaultCategoryAverages(),
          skills: catalog.map((skill) => ({
            ...skill,
            rating: null,
            selfAssessedAt: null,
          })),
        }
      }

      const skills = catalog.map<SoftSkillView>((skill) => {
        const record = ratingMap.get(skill.id)
        return {
          ...skill,
          rating: record?.rating ?? null,
          selfAssessedAt: record?.updatedAt ?? null,
        }
      })

      const categoryAverages = calculateCategoryAverages(
        skills.map((skill) => ({
          category: skill.category,
          rating: skill.rating,
        })),
      )

      return {
        version,
        lastUpdated,
        categoryAverages,
        skills,
      }
    }),

  updateSoftSkills: protectedProcedure
    .input(softSkillsUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const { supabase, user, userToken } = ctx
      const catalog = await fetchSoftSkillsCatalog(supabase)

      if (catalog.length === 0) {
        throw new TRPCError({
          code: 'FAILED_PRECONDITION',
          message: 'Soft skills catalog is not configured',
        })
      }

      const catalogIds = new Set(catalog.map((skill) => skill.id))
      const providedIds = new Set(input.skills.map((skill) => skill.skill_id))

      if (providedIds.size !== input.skills.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Duplicate soft skill entries are not allowed',
        })
      }

      if (providedIds.size !== catalogIds.size || Array.from(providedIds).some((skillId) => !catalogIds.has(skillId))) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'All catalog soft skills must be rated',
        })
      }

      const ratingMap = new Map(input.skills.map((skill) => [skill.skill_id, skill.rating]))

      const { version: latestVersion, ratings: latestRatings } = await loadLatestSoftSkillRatings(supabase, user.id)

      const shouldCreateNewVersion =
        !latestVersion ||
        latestRatings.size === 0 ||
        Array.from(ratingMap.entries()).some(([skillId, rating]) => {
          const previous = latestRatings.get(skillId)
          if (previous === undefined) {
            return true
          }
          return Math.abs(previous - rating) > 1
        })

      if (!shouldCreateNewVersion && !latestVersion) {
        throw new TRPCError({
          code: 'FAILED_PRECONDITION',
          message: 'Unable to determine current soft skills version',
        })
      }

      const targetVersion = shouldCreateNewVersion ? (latestVersion ?? 0) + 1 : latestVersion!
      const timestamp = new Date().toISOString()

      const payload = Array.from(ratingMap.entries()).map(([skillId, rating]) => ({
        user_id: user.id,
        skill_taxonomy: 'soft_skills',
        soft_skill_id: skillId,
        csi_skill_id: null,
        onet_occupation_id: null,
        proficiency_level: rating,
        version: targetVersion,
        self_assessed_at: timestamp,
        updated_at: timestamp,
      }))

      const userScopedClient = createUserScopedClient(userToken)

      const mutation = shouldCreateNewVersion
        ? userScopedClient.schema('core').from('user_skills').insert(payload)
        : userScopedClient
            .schema('core')
            .from('user_skills')
            .upsert(payload, {
              onConflict: 'user_id,skill_taxonomy,csi_skill_id,onet_occupation_id,soft_skill_id,version',
            })

      const { error } = await mutation

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to save soft skills: ${error.message}`,
          cause: error,
        })
      }

      const categoryAverages = calculateCategoryAverages(
        catalog.map((skill) => ({
          category: skill.category,
          rating: ratingMap.get(skill.id) ?? null,
        })),
      )

      return {
        version: targetVersion,
        selfAssessedAt: timestamp,
        createdNewVersion: shouldCreateNewVersion,
        categoryAverages,
      }
    }),

  getSoftSkillsHistory: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx
    const catalog = await fetchSoftSkillsCatalog(supabase)

    if (catalog.length === 0) {
      return { versions: [] as Array<{ version: number; selfAssessedAt: string | null; categoryAverages: CategoryAverages }> }
    }

    const categoryBySkillId = new Map(catalog.map((skill) => [skill.id, skill.category]))

    const { data, error } = await supabase
      .schema('core')
      .from('user_skills')
      .select('version, soft_skill_id, proficiency_level, self_assessed_at')
      .eq('user_id', user.id)
      .eq('skill_taxonomy', 'soft_skills')
      .order('version', { ascending: false })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load soft skills history: ${error.message}`,
        cause: error,
      })
    }

    if (!data || data.length === 0) {
      return { versions: [] as Array<{ version: number; selfAssessedAt: string | null; categoryAverages: CategoryAverages }> }
    }

    const historyMap = new Map<
      number,
      {
        version: number
        selfAssessedAt: string | null
        entries: Array<{ category: SoftSkillCategory; rating: number | null }>
      }
    >()

    for (const row of data) {
      if (!row.soft_skill_id || row.version === null) continue
      const category = categoryBySkillId.get(row.soft_skill_id as string)
      if (!category) continue
      if (!historyMap.has(row.version)) {
        historyMap.set(row.version, {
          version: row.version,
          selfAssessedAt: row.self_assessed_at ?? null,
          entries: [],
        })
      }
      const bucket = historyMap.get(row.version)!
      if (!bucket.selfAssessedAt && row.self_assessed_at) {
        bucket.selfAssessedAt = row.self_assessed_at
      }
      bucket.entries.push({
        category,
        rating: typeof row.proficiency_level === 'number' ? row.proficiency_level : null,
      })
    }

    const versions = Array.from(historyMap.values())
      .sort((a, b) => b.version - a.version)
      .map((bucket) => ({
        version: bucket.version,
        selfAssessedAt: bucket.selfAssessedAt,
        categoryAverages: calculateCategoryAverages(bucket.entries),
      }))

    return { versions }
  }),

  getSoftSkillsComparison: protectedProcedure.query(async ({ ctx }) => {
    const { supabase, user } = ctx
    const catalog = await fetchSoftSkillsCatalog(supabase)

    if (catalog.length === 0) {
      return {
        version: null,
        self: null,
        peer: null,
        peerSampleSize: 0,
        alignmentScore: null,
      }
    }

    const { version, ratings } = await loadLatestSoftSkillRatings(supabase, user.id)

    const selfAverages =
      version === null
        ? null
        : calculateCategoryAverages(
            catalog.map((skill) => ({
              category: skill.category,
              rating: ratings.get(skill.id) ?? null,
            })),
          )

    const { data: peerRows, error: peerError } = await supabase
      .schema('core')
      .from('review_soft_skill_votes')
      .select(
        `
          review_id,
          rating,
          soft_skills:soft_skill_id (
            id,
            category
          ),
          reviews!inner (
            subject_id,
            subject_type
          )
        `,
      )
      .eq('reviews.subject_id', user.id)
      .eq('reviews.subject_type', 'user')
      .not('rating', 'is', null)

    if (peerError) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to load peer soft skills: ${peerError.message}`,
        cause: peerError,
      })
    }

    const peerTotals: Record<SoftSkillCategory, { total: number; count: number }> = {
      reliability: { total: 0, count: 0 },
      collaboration: { total: 0, count: 0 },
      professionalism: { total: 0, count: 0 },
      technical: { total: 0, count: 0 },
    }

    const reviewIds = new Set<string>()

    for (const row of peerRows ?? []) {
      if (typeof row.rating !== 'number') continue
      if (row.review_id) {
        reviewIds.add(row.review_id as string)
      }
      const relation = resolveRelation<{ id: string; category: SoftSkillCategory }>(row.soft_skills)
      if (!relation || !SOFT_SKILL_CATEGORIES.includes(relation.category)) continue
      peerTotals[relation.category].total += row.rating
      peerTotals[relation.category].count += 1
    }

    const peerAverages =
      reviewIds.size === 0
        ? null
        : ((): CategoryAverages => ({
            reliability: peerTotals.reliability.count
              ? Number((peerTotals.reliability.total / peerTotals.reliability.count).toFixed(2))
              : 0,
            collaboration: peerTotals.collaboration.count
              ? Number((peerTotals.collaboration.total / peerTotals.collaboration.count).toFixed(2))
              : 0,
            professionalism: peerTotals.professionalism.count
              ? Number((peerTotals.professionalism.total / peerTotals.professionalism.count).toFixed(2))
              : 0,
            technical: peerTotals.technical.count
              ? Number((peerTotals.technical.total / peerTotals.technical.count).toFixed(2))
              : 0,
          }))()

    const alignmentScore = calculateAlignmentScore(selfAverages, peerAverages)

    return {
      version,
      self: selfAverages,
      peer: peerAverages,
      peerSampleSize: reviewIds.size,
      alignmentScore,
    }
  }),

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
