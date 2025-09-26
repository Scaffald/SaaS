import { TRPCError } from '@trpc/server'
import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'

import type { Database } from '@app/supabase/types'
import { createTRPCRouter, protectedProcedure } from '../trpc'

type TypedSupabaseClient = SupabaseClient<Database>

type ReviewRow = Database['public']['Tables']['reviews']['Row']
type ReviewAspectInsert = Database['public']['Tables']['review_aspects']['Insert']
type ReviewSkillRatingInsert = Database['public']['Tables']['review_skill_ratings']['Insert']

type StoredReviewMetadata = {
  reaction?: 'up' | 'down'
  strengths?: string[]
  areasToImprove?: string[]
  softSkills?: string[]
  recommendedSkills?: string[]
  isPublic?: boolean
  status?: 'draft' | 'submitted'
  submittedAt?: string
}

type ReviewStatus = NonNullable<StoredReviewMetadata['status']>

type ReviewSummary = {
  averageRating: number
  totalReviews: number
  positivePercent: number
  negativePercent: number
  lastUpdated: string
}

type ReviewListItem = {
  id: string
  comment: string
  reaction: StoredReviewMetadata['reaction'] | null
  status: ReviewStatus
  isPublic: boolean
  updatedAt: string
  submittedAt: string | null
}

const reactionInputSchema = z.object({
  subjectId: z.string().min(1, 'A subject is required to record feedback.'),
  direction: z.enum(['up', 'down']),
})

const reviewDraftSchema = z.object({
  reviewId: z.string().uuid('A valid review id is required.'),
  subjectId: z.string().min(1, 'A subject id is required.'),
  strengths: z.array(z.string()).default([]),
  areasToImprove: z.array(z.string()).default([]),
  softSkills: z.array(z.string()).default([]),
  recommendedSkills: z.array(z.string()).default([]),
  comment: z.string().min(1, 'A comment helps readers understand your feedback.'),
  isPublic: z.boolean(),
})

const resumeInputSchema = z.object({
  reviewId: z.string().uuid('A valid review id is required.'),
})

const subjectInputSchema = z.object({
  subjectId: z.string().min(1, 'A subject id is required.'),
})

const STRENGTH_SCORE = 5
const IMPROVEMENT_SCORE = 2
const SOFT_SKILL_SCORE = 4
const RECOMMENDATION_SCORE = 3

const REVIEW_SUBJECT_TYPE = 'user'
const REVIEW_KIND = 'review'

const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const normalizeSkillName = (value: string) => value.trim().toLowerCase()

type ErrorContext = {
  message: string
  error?: PostgrestError | null
}

const raiseInternalError = ({ message, error }: ErrorContext) => {
  if (error) {
    console.error(message, error)
  }
  throw new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message,
  })
}

const parseMetadata = (metadata: ReviewRow['metadata']): StoredReviewMetadata => {
  if (!metadata || typeof metadata !== 'object') {
    return {}
  }
  return { ...(metadata as StoredReviewMetadata) }
}

const formatSummaryDate = (value: string | null | undefined) => {
  if (!value) {
    return 'Updated recently'
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Updated recently'
  }

  return `Updated ${date.toLocaleString('default', { month: 'long', year: 'numeric' })}`
}

const resolveSubjectUserId = async (
  supabase: TypedSupabaseClient,
  subjectId: string,
): Promise<string> => {
  const lookups: Array<keyof Database['public']['Tables']['users']['Row']> = []

  if (isUuid(subjectId)) {
    lookups.push('id')
  }

  lookups.push('username', 'slug')

  for (const column of lookups) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq(column as string, subjectId)
      .maybeSingle()

    if (error) {
      raiseInternalError({
        message: 'Unable to resolve the review subject.',
        error,
      })
    }

    if (data?.id) {
      return data.id
    }
  }

  throw new TRPCError({
    code: 'NOT_FOUND',
    message: 'The requested subject could not be found.',
  })
}

const ensureAuthorReview = async (
  supabase: TypedSupabaseClient,
  reviewId: string,
  authorId: string,
) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('id, subject_id, metadata, body, updated_at')
    .eq('id', reviewId)
    .eq('author_user_id', authorId)
    .maybeSingle()

  if (error) {
    raiseInternalError({
      message: 'Unable to load the requested review.',
      error,
    })
  }

  if (!data) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found.' })
  }

  return data
}

const buildAspectRows = (
  reviewId: string,
  input: Pick<z.infer<typeof reviewDraftSchema>,
    'strengths' | 'areasToImprove' | 'softSkills' | 'recommendedSkills'>,
): ReviewAspectInsert[] => {
  const rows: ReviewAspectInsert[] = []
  const usedKeys = new Set<string>()

  const appendRows = (items: string[], prefix: string, score: number) => {
    items.forEach((rawItem, index) => {
      const trimmed = rawItem.trim()
      if (!trimmed) {
        return
      }

      const slug = slugify(trimmed)
      const keyBase = slug || `${prefix}-${index}`
      const key = `${prefix}:${keyBase}`

      if (usedKeys.has(key)) {
        return
      }

      usedKeys.add(key)
      rows.push({
        review_id: reviewId,
        key,
        score,
      })
    })
  }

  appendRows(input.strengths, 'strength', STRENGTH_SCORE)
  appendRows(input.areasToImprove, 'improve', IMPROVEMENT_SCORE)
  appendRows(input.softSkills, 'soft', SOFT_SKILL_SCORE)
  appendRows(input.recommendedSkills, 'recommend', RECOMMENDATION_SCORE)

  return rows
}

const upsertReviewAspects = async (
  supabase: TypedSupabaseClient,
  reviewId: string,
  draft: z.infer<typeof reviewDraftSchema>,
) => {
  const aspectRows = buildAspectRows(reviewId, draft)

  const { error: deleteError } = await supabase
    .from('review_aspects')
    .delete()
    .eq('review_id', reviewId)

  if (deleteError) {
    raiseInternalError({
      message: 'Failed to reset existing review aspects.',
      error: deleteError,
    })
  }

  if (aspectRows.length === 0) {
    return
  }

  const { error: insertError } = await supabase
    .from('review_aspects')
    .upsert(aspectRows, { onConflict: 'review_id,key' })

  if (insertError) {
    raiseInternalError({
      message: 'Failed to persist review aspects.',
      error: insertError,
    })
  }
}

const collectSkillRatings = async (
  supabase: TypedSupabaseClient,
  reviewId: string,
  draft: Pick<z.infer<typeof reviewDraftSchema>, 'strengths' | 'areasToImprove'>,
): Promise<ReviewSkillRatingInsert[]> => {
  type SkillRatingEntry = { key: string; name: string; score: number }

  const mapSkillEntries = (skills: string[], score: number): SkillRatingEntry[] =>
    skills
      .map((skill) => {
        const trimmed = skill.trim()
        if (!trimmed) {
          return null
        }

        const key = normalizeSkillName(trimmed)
        if (!key) {
          return null
        }

        return { key, name: trimmed, score }
      })
      .filter((entry): entry is SkillRatingEntry => Boolean(entry && entry.key))

  const entries = [
    ...mapSkillEntries(draft.strengths, STRENGTH_SCORE),
    ...mapSkillEntries(draft.areasToImprove, IMPROVEMENT_SCORE),
  ]

  if (entries.length === 0) {
    return []
  }

  const uniqueNames = Array.from(
    entries.reduce((acc, entry) => {
      if (!acc.has(entry.key)) {
        acc.set(entry.key, entry.name)
      }
      return acc
    }, new Map<string, string>()).values(),
  )

  if (uniqueNames.length === 0) {
    return []
  }

  const { data, error } = await supabase
    .from('skills')
    .select('id, name')
    .in('name', uniqueNames)

  if (error) {
    raiseInternalError({
      message: 'Failed to load skills for review ratings.',
      error,
    })
  }

  const normalizedNameToId = new Map<string, string>()
  data?.forEach((row) => {
    if (row?.id && row?.name) {
      normalizedNameToId.set(normalizeSkillName(row.name), row.id)
    }
  })

  const ratingMap = new Map<string, number>()

  entries.forEach(({ key, score }) => {
    if (!key) {
      return
    }

    const skillId = normalizedNameToId.get(key)
    if (!skillId) {
      return
    }

    const existing = ratingMap.get(skillId)
    ratingMap.set(skillId, existing ? Math.max(existing, score) : score)
  })

  return Array.from(ratingMap.entries()).map<ReviewSkillRatingInsert>(([skillId, score]) => ({
    review_id: reviewId,
    skill_id: skillId,
    score,
  }))
}

const upsertReviewSkillRatings = async (
  supabase: TypedSupabaseClient,
  reviewId: string,
  draft: z.infer<typeof reviewDraftSchema>,
) => {
  const rows = await collectSkillRatings(supabase, reviewId, draft)

  const { error: deleteError } = await supabase
    .from('review_skill_ratings')
    .delete()
    .eq('review_id', reviewId)

  if (deleteError) {
    raiseInternalError({
      message: 'Failed to reset existing skill ratings.',
      error: deleteError,
    })
  }

  if (rows.length === 0) {
    return
  }

  const { error: insertError } = await supabase
    .from('review_skill_ratings')
    .upsert(rows, { onConflict: 'review_id,skill_id' })

  if (insertError) {
    raiseInternalError({
      message: 'Failed to persist skill ratings for the review.',
      error: insertError,
    })
  }
}

const persistReviewDraft = async (
  supabase: TypedSupabaseClient,
  authorId: string,
  input: z.infer<typeof reviewDraftSchema>,
  status: ReviewStatus,
) => {
  const subjectUserId = await resolveSubjectUserId(supabase, input.subjectId)
  const review = await ensureAuthorReview(supabase, input.reviewId, authorId)

  if (review.subject_id !== subjectUserId) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'You cannot modify a review for a different subject.',
    })
  }

  const existingMetadata = parseMetadata(review.metadata)
  const now = new Date().toISOString()

  const nextMetadata: StoredReviewMetadata = {
    ...existingMetadata,
    strengths: input.strengths,
    areasToImprove: input.areasToImprove,
    softSkills: input.softSkills,
    recommendedSkills: input.recommendedSkills,
    isPublic: input.isPublic,
    status,
  }

  if (status === 'submitted') {
    nextMetadata.submittedAt = now
  } else if (nextMetadata.submittedAt) {
    delete nextMetadata.submittedAt
  }

  const { error: updateError } = await supabase
    .from('reviews')
    .update({
      body: input.comment,
      metadata: nextMetadata,
      updated_at: now,
    })
    .eq('id', input.reviewId)

  if (updateError) {
    raiseInternalError({
      message: 'Failed to persist the review draft.',
      error: updateError,
    })
  }

  await upsertReviewAspects(supabase, input.reviewId, input)
  await upsertReviewSkillRatings(supabase, input.reviewId, input)

  return { reviewId: input.reviewId, metadata: nextMetadata }
}

const computeSummary = (reviews: ReviewRow[]): ReviewSummary => {
  const submitted = reviews.filter((review) => {
    const metadata = parseMetadata(review.metadata)
    return (metadata.status ?? 'draft') === 'submitted'
  })

  if (submitted.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      positivePercent: 0,
      negativePercent: 0,
      lastUpdated: 'Updated recently',
    }
  }

  const summaryValues = submitted.map((review) => {
    const metadata = parseMetadata(review.metadata)
    const reaction = metadata.reaction ?? (review.rating && review.rating >= 3 ? 'up' : 'down')

    return {
      rating: review.rating ?? (reaction === 'up' ? STRENGTH_SCORE : IMPROVEMENT_SCORE),
      reaction,
      updatedAt: review.updated_at,
    }
  })

  const totalReviews = summaryValues.length
  const ratingTotal = summaryValues.reduce((total, item) => total + (item.rating ?? 0), 0)
  const averageRating = Math.round((ratingTotal / totalReviews) * 10) / 10
  const positiveCount = summaryValues.filter((item) => item.reaction === 'up').length
  const negativeCount = summaryValues.filter((item) => item.reaction === 'down').length
  const latestUpdate = summaryValues.reduce<string | null>((latest, item) => {
    if (!latest) {
      return item.updatedAt
    }
    return item.updatedAt > latest ? item.updatedAt : latest
  }, null)

  return {
    averageRating,
    totalReviews,
    positivePercent: Math.round((positiveCount / totalReviews) * 100),
    negativePercent: Math.round((negativeCount / totalReviews) * 100),
    lastUpdated: formatSummaryDate(latestUpdate),
  }
}

export const reviewsRouter = createTRPCRouter({
  getSummary: protectedProcedure.input(subjectInputSchema).query(async ({ ctx, input }) => {
    const subjectUserId = await resolveSubjectUserId(ctx.supabase, input.subjectId)

    const { data, error } = await ctx.supabase
      .from('reviews')
      .select('id, rating, metadata, updated_at')
      .eq('kind', REVIEW_KIND)
      .eq('subject_type', REVIEW_SUBJECT_TYPE)
      .eq('subject_id', subjectUserId)

    if (error) {
      raiseInternalError({
        message: 'Unable to load review summary.',
        error,
      })
    }

    return computeSummary(data ?? [])
  }),
  list: protectedProcedure.input(subjectInputSchema).query(async ({ ctx, input }) => {
    const subjectUserId = await resolveSubjectUserId(ctx.supabase, input.subjectId)

    const { data, error } = await ctx.supabase
      .from('reviews')
      .select('id, body, metadata, updated_at')
      .eq('kind', REVIEW_KIND)
      .eq('subject_type', REVIEW_SUBJECT_TYPE)
      .eq('subject_id', subjectUserId)
      .eq('author_user_id', ctx.user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      raiseInternalError({
        message: 'Unable to load reviews for the current user.',
        error,
      })
    }

    const reviews: ReviewListItem[] = (data ?? []).map((row) => {
      const metadata = parseMetadata(row.metadata)

      return {
        id: row.id,
        comment: row.body ?? '',
        reaction: metadata.reaction ?? null,
        status: metadata.status ?? 'draft',
        isPublic: metadata.isPublic ?? false,
        updatedAt: row.updated_at,
        submittedAt: metadata.submittedAt ?? null,
      }
    })

    return { reviews }
  }),
  react: protectedProcedure.input(reactionInputSchema).mutation(async ({ ctx, input }) => {
    const { supabase, user } = ctx
    const subjectUserId = await resolveSubjectUserId(supabase, input.subjectId)

    const { data: existing, error: existingError } = await supabase
      .from('reviews')
      .select('id, metadata')
      .eq('kind', REVIEW_KIND)
      .eq('subject_type', REVIEW_SUBJECT_TYPE)
      .eq('subject_id', subjectUserId)
      .eq('author_user_id', user.id)
      .maybeSingle()

    if (existingError) {
      raiseInternalError({
        message: 'Unable to load existing review reaction.',
        error: existingError,
      })
    }

    const now = new Date().toISOString()
    const rating = input.direction === 'up' ? STRENGTH_SCORE : IMPROVEMENT_SCORE

    if (existing?.id) {
      const currentMetadata = parseMetadata(existing.metadata)
      const nextMetadata: StoredReviewMetadata = {
        ...currentMetadata,
        reaction: input.direction,
        status: currentMetadata.status ?? 'draft',
      }

      const { error: updateError, data: updated } = await supabase
        .from('reviews')
        .update({
          rating,
          metadata: nextMetadata,
          updated_at: now,
        })
        .eq('id', existing.id)
        .select('id')
        .maybeSingle()

      if (updateError) {
        raiseInternalError({
          message: 'Failed to update the review reaction.',
          error: updateError,
        })
      }

      return { reviewId: (updated ?? existing).id }
    }

    const metadata: StoredReviewMetadata = {
      reaction: input.direction,
      status: 'draft',
    }

    const { data: inserted, error: insertError } = await supabase
      .from('reviews')
      .insert({
        kind: REVIEW_KIND,
        subject_type: REVIEW_SUBJECT_TYPE,
        subject_id: subjectUserId,
        author_user_id: user.id,
        rating,
        metadata,
      })
      .select('id')
      .single()

    if (insertError || !inserted) {
      raiseInternalError({
        message: 'Failed to create a review reaction.',
        error: insertError,
      })
    }

    return { reviewId: inserted.id }
  }),
  saveDraft: protectedProcedure.input(reviewDraftSchema).mutation(async ({ ctx, input }) => {
    const result = await persistReviewDraft(ctx.supabase, ctx.user.id, input, 'draft')
    return { reviewId: result.reviewId }
  }),
  submit: protectedProcedure.input(reviewDraftSchema).mutation(async ({ ctx, input }) => {
    const result = await persistReviewDraft(ctx.supabase, ctx.user.id, input, 'submitted')
    return { reviewId: result.reviewId, submittedAt: result.metadata.submittedAt ?? null }
  }),
  resume: protectedProcedure.input(resumeInputSchema).query(async ({ ctx, input }) => {
    const review = await ensureAuthorReview(ctx.supabase, input.reviewId, ctx.user.id)
    const metadata = parseMetadata(review.metadata)

    return {
      reviewId: review.id,
      subjectId: review.subject_id,
      comment: review.body ?? '',
      strengths: metadata.strengths ?? [],
      areasToImprove: metadata.areasToImprove ?? [],
      softSkills: metadata.softSkills ?? [],
      recommendedSkills: metadata.recommendedSkills ?? [],
      isPublic: metadata.isPublic ?? false,
      reaction: metadata.reaction ?? null,
      status: metadata.status ?? 'draft',
      submittedAt: metadata.submittedAt ?? null,
      updatedAt: review.updated_at,
    }
  }),
})
