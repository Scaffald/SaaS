import type { NextApiRequest, NextApiResponse } from 'next'

import {
  createFallbackArticles,
  parseRssFeed,
  type NewsArticle,
} from '@app/core/features/home/components/dashboard/right-rail/news-parser'
import { NEWS_SOURCE_LOOKUP } from '@app/core/features/home/components/dashboard/right-rail/news-sources'

const ARTICLE_LIMIT = 8

const CACHE_TTL_SECONDS = 300 // 5 minutes
const STALE_WHILE_REVALIDATE_SECONDS = 600 // 10 minutes

type NewsResponse = {
  articles: NewsArticle[]
}

const isProd = process.env.NODE_ENV === 'production'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<NewsResponse | { error: string }>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).end('Method Not Allowed')
    return
  }

  const source = typeof req.query.source === 'string' ? req.query.source : null
  if (!source) {
    res.status(400).json({ error: 'Missing source parameter' })
    return
  }

  const newsSource = NEWS_SOURCE_LOOKUP[source]
  if (!newsSource) {
    res.status(400).json({ error: 'Unsupported news source' })
    return
  }

  try {
    const response = await fetch(newsSource.feedUrl, {
      headers: {
        Accept: 'application/xml, text/xml;q=0.9, */*;q=0.8',
        'User-Agent': 'SCF-Neue/1.0 (+https://scaffald.com)',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(8000), // 8 second timeout
    })

    if (!response.ok) {
      res.status(502).json({ error: `Feed request failed with status ${response.status}` })
      return
    }

    const xml = await response.text()
    const articles = parseRssFeed(xml).slice(0, ARTICLE_LIMIT)

    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.setHeader(
      'Cache-Control',
      `s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate=${STALE_WHILE_REVALIDATE_SECONDS}`
    )
    res.setHeader('Vary', 'Accept-Encoding')
    res.status(200).json({ articles })
  } catch (error) {
    console.warn('News API error:', error)
    if (!isProd) {
      const fallbackArticles = createFallbackArticles(newsSource)
      res.status(200).json({ articles: fallbackArticles })
      return
    }

    res.status(502).json({ error: 'Unable to reach RSS source' })
  }
}
