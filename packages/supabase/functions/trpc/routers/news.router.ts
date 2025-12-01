import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { officeProcedure, publicProcedure, t } from '../middleware'

/**
 * News router - handles news feed and cached article operations
 */
export const newsRouter = t.router({
  /**
   * Get cached articles by industry
   * Returns list of cached news articles filtered by industry, category, and region
   */
  getByIndustry: publicProcedure
    .input(
      z.object({
        industryId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(10),
        category: z.string().optional(),
        region: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { supabase } = ctx

      // Build query with join to news_feeds for filtering
      let query = supabase
        .schema('core')
        .from('cached_news_articles')
        .select(`
          id,
          title,
          description,
          link,
          pub_date,
          image_url,
          source_name,
          cached_at,
          feed_id,
          feed:news_feeds!inner(
            id,
            name,
            category,
            region
          )
        `)
        .eq('industry_id', input.industryId)

      // Apply optional filters on the joined feed
      if (input.category) {
        query = query.eq('news_feeds.category', input.category)
      }

      if (input.region) {
        query = query.eq('news_feeds.region', input.region)
      }

      const { data, error } = await query

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to fetch news articles: ${error.message}`,
        })
      }

      // Sort and limit after fetching (Supabase doesn't support limit with joins easily)
      const sorted = (data || [])
        .sort((a: { pub_date: string | Date; [key: string]: unknown }, b: { pub_date: string | Date; [key: string]: unknown }) => {
          const dateA = a.pub_date instanceof Date ? a.pub_date : new Date(a.pub_date)
          const dateB = b.pub_date instanceof Date ? b.pub_date : new Date(b.pub_date)
          return dateB.getTime() - dateA.getTime()
        })
        .slice(0, input.limit)

      // Transform to match NewsItem format expected by frontend
      return sorted.map((article: { id: string; title?: string | null; description?: string | null; link?: string | null; pub_date: string | Date; image_url?: string | null; source_name?: string | null; cached_at?: string | null; feed_id?: string | null; feed?: unknown; [key: string]: unknown }) => {
        // Ensure pub_date is converted to a Date object
        const pubDate =
          article.pub_date instanceof Date ? article.pub_date : new Date(article.pub_date)

        // Validate the date is valid
        if (Number.isNaN(pubDate.getTime())) {
          console.warn(`Invalid date for article ${article.id}: ${article.pub_date}`)
        }

        return {
          id: article.id,
          title: article.title,
          description: article.description || '',
          link: article.link,
          pubDate,
          imageUrl: article.image_url || undefined,
          source: article.source_name,
          category: (article.feed as { category?: string } | null)?.category || undefined,
          region: (article.feed as { region?: string } | null)?.region || undefined,
        }
      })
    }),

  /**
   * Get all active feeds (for admin management)
   * Returns all news feeds with their status
   */
  getFeeds: officeProcedure.query(async ({ ctx }) => {
    const { supabase } = ctx

    const { data, error } = await supabase
      .schema('core')
      .from('news_feeds')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to fetch news feeds: ${error.message}`,
      })
    }

    return data || []
  }),

  /**
   * Manually trigger news import (office only)
   * Calls the import_news_articles() database function
   */
  triggerImport: officeProcedure.mutation(async ({ ctx }) => {
    const { supabase } = ctx

    const { data, error } = await supabase.rpc('import_news_articles')

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Failed to trigger news import: ${error.message}`,
      })
    }

    return {
      success: data?.success || false,
      results: data?.results || null,
      error: data?.error || null,
    }
  }),
})
