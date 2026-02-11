import { useReviewAnalytics as useReviewAnalyticsSdk } from '@scf/core/utils/reviews-sdk-hooks';
import type { ReviewAnalytics } from '../types';

/**
 * Custom hook to fetch review analytics data for a user
 * Handles loading states and error handling
 */
export function useReviewAnalytics(userId: string | undefined) {
  const { data, isLoading, error } = useReviewAnalyticsSdk(
    {
      subjectId: userId || "",
      subjectType: "user",
    },
    {
      enabled: !!userId,
    },
  );

  return {
    analytics: data as ReviewAnalytics | null,
    isLoading,
    error,
    hasReviews: data !== null && data !== undefined,
  };
}
