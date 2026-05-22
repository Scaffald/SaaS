/**
 * SC-30: review pin hooks.
 *
 * Pins are stored in `core.review_pins` and managed through two Postgres
 * RPCs (core.pin_review, core.unpin_review). We talk to Supabase
 * directly here rather than extending the @scaffald/sdk surface — the
 * pin UX is self-contained and the RPCs already encapsulate auth +
 * validation.
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@scf/core/utils/supabase/client'

export type ReviewPin = {
  review_id: string
  position: number
}

const QUERY_KEY = ['review-pins'] as const

/**
 * Pinned review IDs for a profile subject, ordered by position (0..2).
 * Renders publicly — no auth required.
 */
export function usePinnedReviews(subjectUserId: string | null | undefined) {
  return useQuery<ReviewPin[]>({
    queryKey: [...QUERY_KEY, subjectUserId],
    queryFn: async () => {
      if (!subjectUserId) return []
      const { data, error } = await supabase
        .schema('core')
        .from('review_pins')
        .select('review_id, position')
        .eq('subject_user_id', subjectUserId)
        .order('position', { ascending: true })
      if (error) throw error
      return (data ?? []) as ReviewPin[]
    },
    enabled: !!subjectUserId,
    staleTime: 30_000,
  })
}

/** Pin a review to the caller's profile at position 0..2. */
export function usePinReviewMutation(subjectUserId: string | null | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ reviewId, position }: { reviewId: string; position: number }) => {
      const { error } = await supabase.schema('core').rpc('pin_review', {
        p_review_id: reviewId,
        p_position: position,
      })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, subjectUserId] })
    },
  })
}

/** Remove a review from the caller's profile pins. */
export function useUnpinReviewMutation(subjectUserId: string | null | undefined) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase.schema('core').rpc('unpin_review', {
        p_review_id: reviewId,
      })
      if (error) throw error
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...QUERY_KEY, subjectUserId] })
    },
  })
}

export const REVIEW_PIN_LIMIT = 3
