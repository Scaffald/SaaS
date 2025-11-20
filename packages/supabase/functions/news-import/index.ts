// @ts-expect-error - Deno imports are not recognized by TypeScript in non-Deno environments
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from '@supabase/supabase-js'
import { corsHeaders } from '../_shared/cors.ts'
import type { Database } from '../_shared/database.types.ts'

interface NewsArticle {
  guid: string
  title: string
  description?: string
  link: string
  pubDate: string
  imageUrl?: string
}

// Decode HTML entities
function decodeHtmlEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  }
  return text.replace(/&[#\w]+;/g, (entity) => entities[entity] || entity)
}

// Strip HTML tags
function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Parse RSS feed
async function parseRSSFeed(url: string): Promise<NewsArticle[]> {
  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/xml, text/xml;q=0.9, */*;q=0.8',
        'User-Agent': 'SCF-Neue/1.0 (+https://scaffald.com)',
      },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const xml = await response.text()

    // Simple XML parsing for RSS feeds
    const items: NewsArticle[] = []
    const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/g
    let match: RegExpExecArray | null = itemRegex.exec(xml)

    while (match !== null) {
      const itemXml = match[1]

      const titleMatch =
        itemXml.match(/<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) ||
        itemXml.match(/<title[^>]*>([\s\S]*?)<\/title>/)
      const linkMatch = itemXml.match(/<link[^>]*>([\s\S]*?)<\/link>/)
      const descriptionMatch =
        itemXml.match(/<description[^>]*><!\[CDATA\[([\s\S]*?)\]\]><\/description>/) ||
        itemXml.match(/<description[^>]*>([\s\S]*?)<\/description>/)
      const guidMatch = itemXml.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)
      const pubDateMatch = itemXml.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)
      const imageMatch =
        itemXml.match(/<enclosure[^>]*url="([^"]*)"[^>]*type="image\/([^"]*)"[^>]*>/) ||
        itemXml.match(/<media:content[^>]*url="([^"]*)"[^>]*>/)

      if (titleMatch && linkMatch) {
        const title = decodeHtmlEntities(stripHtmlTags(titleMatch[1].trim()))
        const link = linkMatch[1].trim()
        const description = descriptionMatch
          ? stripHtmlTags(decodeHtmlEntities(descriptionMatch[1].trim()))
          : undefined
        const guid = guidMatch ? guidMatch[1].trim() : link
        const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString()
        const imageUrl = imageMatch ? imageMatch[1].trim() : undefined

        // Parse pubDate to ISO string
        let pubDateISO: string
        try {
          pubDateISO = new Date(pubDate).toISOString()
        } catch {
          pubDateISO = new Date().toISOString()
        }

        items.push({
          guid,
          title,
          description,
          link,
          pubDate: pubDateISO,
          imageUrl,
        })
      }
      match = itemRegex.exec(xml)
    }

    return items
  } catch (error) {
    console.error('Error parsing RSS feed:', error)
    throw error
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get active feeds
    const { data: feeds, error: feedsError } = await supabase
      .schema('core')
      .from('news_feeds')
      .select('*')
      .eq('is_active', true)

    if (feedsError) throw feedsError

    console.log(`Processing ${feeds?.length || 0} feeds`)

    const results = {
      processed: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      feeds_processed: 0,
      feeds_failed: 0,
    }

    for (const feed of feeds || []) {
      try {
        console.log(`Processing feed: ${feed.name} (${feed.url})`)

        // Parse feed based on type
        let articles: NewsArticle[] = []

        if (feed.feed_type === 'rss' || feed.feed_type === 'atom') {
          articles = await parseRSSFeed(feed.url)
        } else {
          console.warn(`Unsupported feed type: ${feed.feed_type}`)
          results.skipped++
          continue
        }

        console.log(`Found ${articles.length} articles in feed`)
        results.processed += articles.length

        // Delete existing articles for this feed (replace strategy)
        const { error: deleteError } = await supabase
          .schema('core')
          .from('cached_news_articles')
          .delete()
          .eq('feed_id', feed.id)

        if (deleteError) {
          console.error(`Error deleting old articles for feed ${feed.name}:`, deleteError)
        }

        // Process each article
        let importedCount = 0
        for (const article of articles) {
          try {
            // Insert article
            const { error: insertError } = await supabase
              .schema('core')
              .from('cached_news_articles')
              .upsert(
                {
                  feed_id: feed.id,
                  industry_id: feed.industry_id,
                  guid: article.guid,
                  title: article.title,
                  description: article.description || null,
                  link: article.link,
                  pub_date: article.pubDate,
                  image_url: article.imageUrl || null,
                  source_name: feed.name,
                },
                {
                  onConflict: 'feed_id,guid',
                  ignoreDuplicates: false,
                }
              )

            if (insertError) {
              console.error('Insert error:', insertError)
              results.errors++
            } else {
              importedCount++
              results.imported++
            }
          } catch (articleError) {
            console.error('Error processing article:', articleError)
            results.errors++
          }
        }

        // Update feed metadata
        const { error: updateError } = await supabase
          .schema('core')
          .from('news_feeds')
          .update({
            last_fetched_at: new Date().toISOString(),
            last_fetch_status: 'success',
            last_error_message: null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', feed.id)

        if (updateError) {
          console.error(`Error updating feed metadata for ${feed.name}:`, updateError)
        }

        console.log(`✓ Imported ${importedCount} articles from ${feed.name}`)
        results.feeds_processed++
      } catch (feedError) {
        console.error(`Error processing feed ${feed.name}:`, feedError)

        // Update feed with error status
        const errorMessage =
          feedError instanceof Error
            ? feedError.message.substring(0, 500)
            : String(feedError).substring(0, 500)

        await supabase
          .schema('core')
          .from('news_feeds')
          .update({
            last_fetched_at: new Date().toISOString(),
            last_fetch_status: 'failed',
            last_error_message: errorMessage,
            updated_at: new Date().toISOString(),
          })
          .eq('id', feed.id)

        results.feeds_failed++
        results.errors++
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
