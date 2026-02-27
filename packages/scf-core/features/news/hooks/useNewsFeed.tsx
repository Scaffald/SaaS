import { useMemo } from 'react'
import { calculateReadingTime } from '../utils/rss-parser'
import { useNewsByIndustry } from '@scf/core/utils/news-sdk-hooks'

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
  enabled,
}: {
  industryId: string
  maxItems?: number
  category?: string
  region?: string
  staleTime?: number
  enabled?: boolean
}) {
  // Validate industryId is a valid UUID before making the query
  // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const isValidUUID =
    industryId.length > 0 &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(industryId)

  const query = useNewsByIndustry(
    { industryId, limit: maxItems, category, region },
    {
      staleTime,
      retry: 2,
      enabled: enabled !== undefined ? enabled && isValidUUID : isValidUUID,
    }
  )

  // Transform and enhance items with reading time
  const enhancedData = useMemo(() => {
    if (!query.data) return undefined

    return query.data.map((item: (typeof query.data)[0]) => {
      // Ensure pubDate is a Date object (tRPC serializes Date to string)
      const pubDate =
        (item.pubDate as unknown) instanceof Date ? item.pubDate : new Date(item.pubDate as string)

      return {
        ...item,
        pubDate, // Ensure it's a Date object
        readTime: calculateReadingTime(item.description),
        image: item.imageUrl,
      }
    })
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
  enabled,
}: {
  industryId: string
  maxTotalItems?: number
  category?: string
  region?: string
  enabled?: boolean
}) {
  return useNewsFeedByIndustry({
    industryId,
    maxItems: maxTotalItems,
    category,
    region,
    enabled,
  })
}

// Legacy exports for backward compatibility during migration
// These will be removed in Task 12
export function useNewsFeed({
  feedUrl: _feedUrl,
  maxItems: _maxItems = 5,
  staleTime: _staleTime = 15 * 60 * 1000,
  retry: _retry = 2,
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

export function useMultipleNewsFeeds(_feedUrls: string[], _maxItemsPerFeed = 3) {
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
