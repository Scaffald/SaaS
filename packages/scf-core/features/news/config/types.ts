/**
 * TypeScript interfaces for the NewsWidget system
 */

export interface NewsItem {
  id: string
  title: string
  description: string
  link: string
  pubDate: Date
  category?: string
  image?: string
  author?: string
  readTime?: string
  source?: string | null
  region?: string | null
}

export interface NewsFeed {
  id: string
  name: string
  url: string
  category?: string
  region?: string
}

export interface IndustryFeeds {
  name: string
  national: NewsFeed[]
  regional: NewsFeed[]
  topical: NewsFeed[]
}

export interface NewsWidgetProps {
  industry?: string
  maxItems?: number
  onArticleClick?: (article: NewsItem) => void
}

export interface UseNewsFeedOptions {
  feedUrl: string
  maxItems?: number
  staleTime?: number
  retry?: number
}

export interface ParsedRSSFeed {
  title?: string
  description?: string
  items: NewsItem[]
  lastUpdated?: Date
}

export type NewsCategory =
  | 'safety'
  | 'technology'
  | 'regulations'
  | 'equipment'
  | 'projects'
  | 'workforce'
  | 'sustainability'
  | 'finance'
  | 'general'

export interface NewsFeedError {
  feedUrl: string
  error: string
  timestamp: Date
}
