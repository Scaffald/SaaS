import type { NewsSource } from './news-sources'

export type NewsArticle = {
  id: string
  title: string
  excerpt: string
  imageUrl?: string
  link: string
  publishedAt?: string
}

const CDATA_REGEX = /<!\[CDATA\[|\]\]>/g
const HTML_TAG_REGEX = /<[^>]+>/g
const WHITESPACE_REGEX = /\s+/g

const decodeEntities = (value: string) =>
  value
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")

const stripCdata = (input: string) => input.replace(CDATA_REGEX, '')

const stripHtml = (input: string) =>
  decodeEntities(input.replace(HTML_TAG_REGEX, ' ')).replace(WHITESPACE_REGEX, ' ').trim()

const extractTag = (source: string, tag: string) => {
  const regex = new RegExp(`<${tag}>([\s\S]*?)</${tag}>`, 'i')
  const match = source.match(regex)
  return match ? stripCdata(match[1]).trim() : ''
}

const extractAttribute = (source: string, tag: string, attribute: string) => {
  const regex = new RegExp(`<${tag}[^>]*${attribute}="([^"]+)"[^>]*>`, 'i')
  const match = source.match(regex)
  return match ? match[1] : ''
}

export const parseRssFeed = (xml: string): NewsArticle[] =>
  xml
    .split('<item>')
    .slice(1)
    .map((chunk) => chunk.split('</item>')[0])
    .map((item) => {
      const title = decodeEntities(stripCdata(extractTag(item, 'title')))
      const link = extractTag(item, 'link')
      const guid = extractTag(item, 'guid')
      const description = extractTag(item, 'description')
      const imageUrl = extractAttribute(item, 'enclosure', 'url')
      const publishedAt = extractTag(item, 'pubDate')

      return {
        id: guid || link || title,
        title,
        link,
        excerpt: stripHtml(description),
        imageUrl: imageUrl || undefined,
        publishedAt: publishedAt || undefined,
      }
    })
    .filter((article) => article.title && article.link)

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
