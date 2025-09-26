import { api } from '@app/core/utils/api'

export type ReviewReactionDirection = 'up' | 'down'

export type ReviewReactionInput = {
  subjectId: string
  direction: ReviewReactionDirection
}

export const useReviewReaction = () => {
  const mutation = api.reviews.react.useMutation()

  const react = (input: ReviewReactionInput) => mutation.mutateAsync(input)

  return {
    ...mutation,
    react,
  }
}
