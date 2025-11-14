import { useMemo } from 'react'
import { api } from '@app/core/utils/api'
import { calculateReadingTime } from '../utils/rss-parser'
import type { NewsItem } from '../config/types'

// Note: parseRSSFeed is no longer used but kept for backward compatibility
// during migration period. It can be removed after confirming no other code uses it.

/**
 * Hook for fetching cached news articles by industry via tRPC
 * Replaces the old proxy-based RSS fetching
 */
export function useNewsFeedByIndustry({
  industryId,
  maxItems = 10,
  category,
  region,
  staleTime = 15 * 60 * 1000, // 15 minutes
}: {
  industryId: string
  maxItems?: number
  category?: string
  region?: string
  staleTime?: number
}) {
  const query = api.news.getByIndustry.useQuery(
    {
      industryId,
      limit: maxItems,
      category,
      region,
    },
    {
      staleTime,
      retry: 2,
    }
  )

  // Transform and enhance items with reading time
  const enhancedData = useMemo(() => {
    if (!query.data) return undefined

    return query.data.map((item) => ({
      ...item,
      readTime: calculateReadingTime(item.description),
      image: item.imageUrl,
    }))
  }, [query.data])

  return {
    ...query,
    data: enhancedData,
  }
}

/**
 * Hook to get aggregated news items from cached articles
 * Combines and sorts items by publication date
 * Replaces the old useAggregatedNews that fetched from RSS feeds
 */
export function useAggregatedNews({
  industryId,
  maxTotalItems = 10,
  category,
  region,
}: {
  industryId: string
  maxTotalItems?: number
  category?: string
  region?: string
}) {
  return useNewsFeedByIndustry({
    industryId,
    maxItems: maxTotalItems,
    category,
    region,
  })
}

// Legacy exports for backward compatibility during migration
// These will be removed in Task 12
export function useNewsFeed({
  feedUrl,
  maxItems = 5,
  staleTime = 15 * 60 * 1000,
  retry = 2,
}: {
  feedUrl: string
  maxItems?: number
  staleTime?: number
  retry?: number
}) {
  // This is deprecated - use useNewsFeedByIndustry instead
  console.warn(
    'useNewsFeed with feedUrl is deprecated. Use useNewsFeedByIndustry with industryId instead.'
  )
  return {
    data: undefined,
    isLoading: false,
    isError: true,
    error: new Error('useNewsFeed with feedUrl is deprecated'),
  }
}

export function useMultipleNewsFeeds(feedUrls: string[], maxItemsPerFeed = 3) {
  // This is deprecated - use useNewsFeedByIndustry instead
  console.warn(
    'useMultipleNewsFeeds is deprecated. Use useNewsFeedByIndustry with industryId instead.'
  )
  return {
    data: {},
    isLoading: false,
    isError: true,
    error: new Error('useMultipleNewsFeeds is deprecated'),
  }
}
