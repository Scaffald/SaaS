/**
 * Profile reviews in display order: pinned reviews first, in pin order, then
 * the rest newest first (SC-30). Pure, so the widget can compute it before
 * any early return and it can be tested without React Native.
 */
export function orderReviews<R extends { id: string; created_at: string }>(
  reviews: readonly R[],
  pinPositionById: ReadonlyMap<string, number>
): R[] {
  return [...reviews].sort((a, b) => {
    const pa = pinPositionById.get(a.id)
    const pb = pinPositionById.get(b.id)
    if (pa !== undefined && pb !== undefined) return pa - pb
    if (pa !== undefined) return -1
    if (pb !== undefined) return 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })
}
