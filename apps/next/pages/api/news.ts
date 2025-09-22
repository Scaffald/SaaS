import type { NextApiRequest, NextApiResponse } from 'next'

import { NEWS_SOURCE_LOOKUP } from 'app/features/home/components/dashboard/right-rail/news-sources'

const CACHE_TTL_SECONDS = 300

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
      },
    })

    if (!response.ok) {
      res.status(502).json({ error: `Feed request failed with status ${response.status}` })
      return
    }

    const xml = await response.text()

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', `s-maxage=${CACHE_TTL_SECONDS}, stale-while-revalidate`)
    res.status(200).send(xml)
  } catch (error) {
    res.status(502).json({ error: 'Unable to reach RSS source' })
  }
}
