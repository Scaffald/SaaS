import { z } from 'zod'

import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc'

const reactionInputSchema = z.object({
  subjectId: z.string().min(1, 'A subject is required to record feedback.'),
  direction: z.enum(['up', 'down']),
})

const summaryInputSchema = z.object({
  subjectId: z.string().min(1, 'A subject is required to load review insights.'),
})

const listInputSchema = z.object({
  subjectId: z.string().min(1, 'A subject is required to load reviews.'),
  cursor: z.number().int().nonnegative().nullish(),
  limit: z.number().int().min(1).max(20).default(5),
})

type MockReview = {
  id: string
  rating: number
  comment: string
  createdAt: string
  isPublic: boolean
  reviewer: {
    name: string
    role: string
  }
}

const mockReviews: MockReview[] = [
  {
    id: 'review-1',
    rating: 5,
    comment:
      'Alicia kept the outage on schedule and never hesitated to jump in with the crew when the pressure was on.',
    createdAt: new Date('2024-04-18').toISOString(),
    isPublic: true,
    reviewer: {
      name: 'Michael Chen',
      role: 'Turnaround Manager',
    },
  },
  {
    id: 'review-2',
    rating: 4,
    comment:
      'Great at setting expectations during shift handoffs. Would love to see pre-shift checklists shared a bit earlier.',
    createdAt: new Date('2024-03-02').toISOString(),
    isPublic: false,
    reviewer: {
      name: 'Danielle Ortiz',
      role: 'Electrical Superintendent',
    },
  },
  {
    id: 'review-3',
    rating: 5,
    comment:
      'Crew morale improved immediately when Alicia took the lead—keeps communication tight and the job plan clear.',
    createdAt: new Date('2024-01-26').toISOString(),
    isPublic: true,
    reviewer: {
      name: 'Gregory Shaw',
      role: 'Project Director',
    },
  },
  {
    id: 'review-4',
    rating: 3,
    comment:
      'Solid execution overall. There were a few delays on material requests but nothing that impacted turnover.',
    createdAt: new Date('2023-11-12').toISOString(),
    isPublic: true,
    reviewer: {
      name: 'Priya Patel',
      role: 'Operations Engineer',
    },
  },
  {
    id: 'review-5',
    rating: 4,
    comment:
      'Dependable lead tech. Appreciated the bilingual safety briefings with clear action items for apprentices.',
    createdAt: new Date('2023-09-03').toISOString(),
    isPublic: false,
    reviewer: {
      name: 'Evan Brooks',
      role: 'Maintenance Planner',
    },
  },
  {
    id: 'review-6',
    rating: 5,
    comment:
      'Consistently delivers clean turnover packages and keeps punch lists short. Crews ask for her back.',
    createdAt: new Date('2023-06-22').toISOString(),
    isPublic: true,
    reviewer: {
      name: 'Sonia Alvarez',
      role: 'QA/QC Lead',
    },
  },
]

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

  getSummary: publicProcedure.input(summaryInputSchema).query(({ input, ctx }) => {
    const averageRating =
      mockReviews.reduce((total, review) => total + review.rating, 0) / mockReviews.length

    const viewerDraft = ctx.user
      ? {
          reviewId: 'draft-review-001',
          href: `/reviews/${input.subjectId}/draft-review-001`,
        }
      : null

    return {
      subjectId: input.subjectId,
      averageRating,
      totalReviews: mockReviews.length,
      strengths: [
        'Keeps crews aligned during outages',
        'Raises safety concerns early',
        'Communicates clearly in the field',
      ],
      improvements: ['Could share pre-shift checklists sooner', 'Occasional delays on material requests'],
      viewerDraft,
    }
  }),
  
  list: publicProcedure.input(listInputSchema).query(({ input }) => {
    const cursor = input.cursor ?? 0
    const items = mockReviews.slice(cursor, cursor + input.limit)
    const nextCursor = cursor + input.limit < mockReviews.length ? cursor + input.limit : null

    return {
      subjectId: input.subjectId,
      items,
      nextCursor
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
