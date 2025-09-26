import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '../trpc'

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

export const reviewsRouter = createTRPCRouter({
  react: protectedProcedure.input(reactionInputSchema).mutation(async ({ input }) => {
    // TODO: Integrate with persistence once backend is ready.
    return {
      subjectId: input.subjectId,
      direction: input.direction,
      success: true,
    }
  }),
  saveDraft: protectedProcedure.input(reviewDraftSchema).mutation(async ({ input }) => {
    // TODO: Persist drafts once backend storage is available.
    return {
      success: true,
      draft: input,
    }
  }),
  submit: protectedProcedure.input(reviewDraftSchema).mutation(async ({ input }) => {
    // TODO: Persist submitted reviews once backend storage is available.
    return {
      success: true,
      reviewId: input.reviewId,
    }
  }),
})
