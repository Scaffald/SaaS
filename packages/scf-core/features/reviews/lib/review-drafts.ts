/**
 * Which of the caller's reviews the wizard may resume (#1356).
 */
type ReviewLike = {
  id: string
  subject_id: string
  subject_type: string
  metadata?: Record<string, unknown> | null
}

/**
 * The api answers `GET /reviews/my-reviews` with `{ reviews: [...] }`, while
 * older SDK builds typed and returned it as a bare array. Accept either, and
 * anything else as "no reviews", so a shape mismatch can't throw inside the
 * wizard and leave it spinning.
 */
export function unwrapMyReviews<T>(result: unknown): T[] {
  if (Array.isArray(result)) return result as T[]
  const reviews = (result as { reviews?: unknown } | null | undefined)?.reviews
  return Array.isArray(reviews) ? (reviews as T[]) : []
}

/**
 * The caller's open draft for this person, if any. A submitted or released
 * review is never resumed: the wizard would edit a review that is already
 * out.
 */
export function findResumableDraft<T extends ReviewLike>(
  reviews: readonly T[],
  subjectId: string
): T | undefined {
  return reviews.find(
    (review) =>
      review.subject_id === subjectId &&
      review.subject_type === 'user' &&
      review.metadata?.status === 'draft'
  )
}
