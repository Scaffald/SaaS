import { z } from 'zod'

import { createTRPCRouter, protectedProcedure } from '../trpc'

const reactionInputSchema = z.object({
  subjectId: z.string().min(1, 'A subject is required to record feedback.'),
  direction: z.enum(['up', 'down']),
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
})
