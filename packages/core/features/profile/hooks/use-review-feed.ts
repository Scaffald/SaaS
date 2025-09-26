import { api } from '@app/core/utils/api'

export type ReviewFeedPage = NonNullable<
  ReturnType<typeof api.reviews.list.useInfiniteQuery>['data']
>['pages'][number]

export type ReviewFeedItem = ReviewFeedPage['items'][number]

export const useReviewFeed = (subjectId: string, limit = 5) =>
  api.reviews.list.useInfiniteQuery(
    { subjectId, limit },
    {
      enabled: Boolean(subjectId),
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    }
  )
