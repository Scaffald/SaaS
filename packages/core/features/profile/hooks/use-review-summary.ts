import { api } from '@app/core/utils/api'

export const useReviewSummary = (subjectId: string) =>
  api.reviews.getSummary.useQuery(
    { subjectId },
    {
      enabled: Boolean(subjectId),
    }
  )

export type UseReviewSummaryResult = ReturnType<typeof useReviewSummary>
export type ReviewSummaryPayload = NonNullable<UseReviewSummaryResult['data']>
export type ReviewSummaryViewerDraft = ReviewSummaryPayload['viewerDraft']
