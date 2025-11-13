import React, { useMemo } from 'react'
import { Platform } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { parseRSSFeed, calculateReadingTime } from '../utils/rss-parser'
import type { UseNewsFeedOptions, NewsItem } from '../config/types'

/**
 * CORS proxy for web browsers - only needed for web, not React Native
 * Uses Supabase Edge Function to proxy RSS feeds with proper CORS headers
 */
function getProxiedUrl(originalUrl: string): string {
  // Only use proxy for web browsers, React Native doesn't have CORS restrictions
  if (Platform.OS === 'web') {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
    if (!supabaseUrl) {
      console.warn('EXPO_PUBLIC_SUPABASE_URL is not set, falling back to direct fetch')
      return originalUrl
    }
    return `${supabaseUrl}/functions/v1/news?url=${encodeURIComponent(originalUrl)}`
  }
  return originalUrl
}

/**
 * Parse response based on whether we're using CORS proxy or direct fetch
 * Supabase proxy returns XML directly, not JSON-wrapped
 */
function parseProxyResponse(_response: Response, text: string): string {
  // Supabase Edge Function returns XML directly, so no parsing needed
  // React Native uses direct fetch, so also no parsing needed
  return text
}

/**
 * Hook for fetching and parsing RSS feeds with React Query
 */
export function useNewsFeed({
  feedUrl,
  maxItems = 5,
  staleTime = 15 * 60 * 1000, // 15 minutes
  retry = 2,
}: UseNewsFeedOptions) {
  return useQuery({
    queryKey: ['news-feed', feedUrl, maxItems],
    queryFn: async (): Promise<NewsItem[]> => {
      try {
        // Fetch RSS feed with CORS proxy for web
        const proxiedUrl = getProxiedUrl(feedUrl)
        const response = await fetch(proxiedUrl)

        if (!response.ok) {
          throw new Error(`Failed to fetch feed: ${response.status} ${response.statusText}`)
        }

        const responseText = await response.text()
        const xmlText = parseProxyResponse(response, responseText)

        // Parse RSS feed
        const parsedFeed = await parseRSSFeed(xmlText)

        // Enhance items with reading time and limit results
        const enhancedItems = parsedFeed.items.slice(0, maxItems).map((item) => ({
          ...item,
          readTime: calculateReadingTime(item.description),
        }))

        return enhancedItems
      } catch (error) {
        console.warn(`Failed to fetch news feed from ${feedUrl}:`, error)
        throw error
      }
    },
    staleTime,
    retry,
  })
}

/**
 * Hook for fetching multiple RSS feeds
 */
export function useMultipleNewsFeeds(feedUrls: string[], maxItemsPerFeed = 3) {
  const queries = useQuery({
    queryKey: ['multiple-news-feeds', feedUrls, maxItemsPerFeed],
    queryFn: async (): Promise<{ [feedUrl: string]: NewsItem[] }> => {
      const feedPromises = feedUrls.map(async (feedUrl) => {
        try {
          const proxiedUrl = getProxiedUrl(feedUrl)
          const response = await fetch(proxiedUrl)
          if (!response.ok) {
            throw new Error(`Failed to fetch ${feedUrl}`)
          }

          const responseText = await response.text()
          const xmlText = parseProxyResponse(response, responseText)
          const parsedFeed = await parseRSSFeed(xmlText)

          const enhancedItems = parsedFeed.items.slice(0, maxItemsPerFeed).map((item) => ({
            ...item,
            readTime: calculateReadingTime(item.description),
          }))

          return { feedUrl, items: enhancedItems }
        } catch (error) {
          console.warn(`Failed to fetch feed ${feedUrl}:`, error)
          return { feedUrl, items: [] }
        }
      })

      const results = await Promise.allSettled(feedPromises)
      const feedResults: { [feedUrl: string]: NewsItem[] } = {}

      for (const result of results) {
        if (result.status === 'fulfilled') {
          feedResults[result.value.feedUrl] = result.value.items
        }
      }

      return feedResults
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    retry: 1,
  })

  return queries
}

/**
 * Hook to get aggregated news items from multiple feeds
 * Combines and sorts items by publication date
 */
export function useAggregatedNews(feedUrls: string[], maxTotalItems = 10) {
  const multipleFeeds = useMultipleNewsFeeds(feedUrls)

  const aggregatedItems: NewsItem[] = useMemo(() => {
    if (!multipleFeeds.data) return []

    const allItems: NewsItem[] = []

    for (const items of Object.values(multipleFeeds.data)) {
      allItems.push(...items)
    }

    // Sort by publication date (newest first) and limit
    return allItems
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
      .slice(0, maxTotalItems)
  }, [multipleFeeds.data, maxTotalItems])

  return {
    ...multipleFeeds,
    data: aggregatedItems,
  }
}
