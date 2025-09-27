import type { NewsSource } from './news-sources'
import { XMLParser } from 'fast-xml-parser'

export type NewsArticle = {
  id: string
  title: string
  excerpt: string
  imageUrl?: string
  link: string
  publishedAt?: string
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  textNodeName: '#text',
})

const decodeHtmlEntities = (text: string): string => {
  const entities: Record<string, string> = {
    '&': '&',
    '<': '<',
    '>': '>',
    '"': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
  }

  return text.replace(/&[a-zA-Z0-9#]+;/g, (entity) => entities[entity] || entity)
}

const stripHtmlTags = (html: string): string => {
  return html
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

export const parseRssFeed = (xml: string): NewsArticle[] => {
  try {
    const result = parser.parse(xml)

    if (!result.rss?.channel?.item) {
      console.warn('RSS feed does not have expected structure')
      return []
    }

    const items = Array.isArray(result.rss.channel.item)
      ? result.rss.channel.item
      : [result.rss.channel.item]

    return items
      .filter((item) => item && item.title && item.link)
      .map((item): NewsArticle => {
        // Handle CDATA in description
        const description =
          typeof item.description === 'string'
            ? item.description
            : item.description?.['#text'] || item.description?.['#cdata'] || ''

        // Extract image from enclosure
        const imageUrl = item.enclosure?.url || item.enclosure?.['@_url']

        return {
          id: item.guid?.['#text'] || item.guid || item.link || item.title,
          title: decodeHtmlEntities(String(item.title || '')),
          link: String(item.link || ''),
          excerpt: stripHtmlTags(decodeHtmlEntities(description)),
          imageUrl: imageUrl ? String(imageUrl) : undefined,
          publishedAt: item.pubDate ? String(item.pubDate) : undefined,
        }
      })
  } catch (error) {
    console.error('Failed to parse RSS feed:', error)
    return []
  }
}

export const createFallbackArticles = (source?: NewsSource): NewsArticle[] => {
  const now = new Date()
  const isoDate = Number.isNaN(now.getTime()) ? undefined : now.toISOString()
  const siteUrl = source?.siteUrl ?? source?.feedUrl ?? 'https://www.enr.com/'

  return [
    {
      id: `${source?.id ?? 'fallback'}-1`,
      title: source?.label
        ? `${source.label} headlines coming soon`
        : 'Industry headlines coming soon',
      excerpt:
        'We will load the latest construction industry headlines as soon as the RSS feed becomes available. In the meantime, visit the ENR newsroom to stay up to date.',
      link: siteUrl,
      publishedAt: isoDate,
    },
  ]
}
