import { XMLParser } from 'fast-xml-parser'
import type { NewsItem, ParsedRSSFeed } from '../config/types'

/**
 * RSS/XML Parser utility with cross-platform support
 * Handles RSS 2.0, Atom, and various feed formats
 */

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true,
  htmlEntities: true,
})

/**
 * Parse RSS/XML feed string into normalized NewsItem array
 */
export async function parseRSSFeed(xmlString: string): Promise<ParsedRSSFeed> {
  try {
    // Clean and sanitize XML
    const cleanXml = sanitizeXML(xmlString)
    const parsed = xmlParser.parse(cleanXml)

    return normalizeRSSFormat(parsed)
  } catch (error) {
    console.warn('RSS parsing failed:', error)
    return {
      title: 'Unknown Feed',
      description: 'Failed to parse RSS feed',
      items: [],
      lastUpdated: new Date(),
    }
  }
}

/**
 * Sanitize XML string to handle common issues
 */
function sanitizeXML(xmlString: string): string {
  return xmlString
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove invalid control characters
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#)/g, '&amp;') // Fix unescaped ampersands
    .trim()
}

/**
 * Normalize different RSS formats into consistent structure
 */
function normalizeRSSFormat(parsed: any): ParsedRSSFeed {
  // Handle RSS 2.0 format
  if (parsed.rss?.channel) {
    return normalizeRSS2Format(parsed.rss.channel)
  }

  // Handle Atom format
  if (parsed.feed) {
    return normalizeAtomFormat(parsed.feed)
  }

  // Handle direct channel (some feeds omit the rss wrapper)
  if (parsed.channel) {
    return normalizeRSS2Format(parsed.channel)
  }

  throw new Error('Unrecognized RSS feed format')
}

/**
 * Normalize RSS 2.0 format
 */
function normalizeRSS2Format(channel: any): ParsedRSSFeed {
  const items = Array.isArray(channel.item) ? channel.item : channel.item ? [channel.item] : []

  return {
    title: decodeHtmlEntities(channel.title || 'Unknown Feed'),
    description: decodeHtmlEntities(channel.description || ''),
    items: items.map(formatRSSItem).filter(Boolean),
    lastUpdated: parseDate(channel.lastBuildDate || channel.pubDate) || new Date(),
  }
}

/**
 * Normalize Atom format
 */
function normalizeAtomFormat(feed: any): ParsedRSSFeed {
  const entries = Array.isArray(feed.entry) ? feed.entry : feed.entry ? [feed.entry] : []

  return {
    title: decodeHtmlEntities(feed.title?.['#text'] || feed.title || 'Unknown Feed'),
    description: decodeHtmlEntities(feed.subtitle?.['#text'] || feed.subtitle || ''),
    items: entries.map(formatAtomEntry).filter(Boolean),
    lastUpdated: parseDate(feed.updated) || new Date(),
  }
}

/**
 * Format RSS 2.0 item into NewsItem
 */
function formatRSSItem(item: any): NewsItem | null {
  try {
    const title = decodeHtmlEntities(item.title || '')
    const link = item.link || item.guid?.['#text'] || item.guid

    if (!title || !link) {
      return null
    }

    return {
      id: item.guid?.['#text'] || item.guid || link,
      title,
      description: decodeHtmlEntities(stripHtmlTags(item.description || item.summary || '')),
      link,
      pubDate: parseDate(item.pubDate) || new Date(),
      category: extractCategory(item.category),
      image: extractImageFromContent(item.description || item.content) || undefined,
      author: item.author || item['dc:creator'] || undefined,
    }
  } catch (error) {
    console.warn('Failed to format RSS item:', error)
    return null
  }
}

/**
 * Format Atom entry into NewsItem
 */
function formatAtomEntry(entry: any): NewsItem | null {
  try {
    const title = decodeHtmlEntities(entry.title?.['#text'] || entry.title || '')
    const link = entry.link?.['@_href'] || entry.id

    if (!title || !link) {
      return null
    }

    return {
      id: entry.id || link,
      title,
      description: decodeHtmlEntities(
        stripHtmlTags(entry.summary?.['#text'] || entry.summary || '')
      ),
      link,
      pubDate: parseDate(entry.published || entry.updated) || new Date(),
      category: extractCategory(entry.category),
      image: extractImageFromContent(entry.content || entry.summary) || undefined,
      author: entry.author?.name || undefined,
    }
  } catch (error) {
    console.warn('Failed to format Atom entry:', error)
    return null
  }
}

/**
 * Extract category from various category formats
 */
function extractCategory(category: any): string | undefined {
  if (!category) return undefined

  if (typeof category === 'string') {
    return category
  }

  if (Array.isArray(category)) {
    return category[0]?.['#text'] || category[0] || undefined
  }

  if (category['#text']) {
    return category['#text']
  }

  if (category['@_term']) {
    return category['@_term']
  }

  return undefined
}

/**
 * Extract image URL from content/description HTML
 */
function extractImageFromContent(content: any): string | null {
  if (!content) return null

  const htmlContent = typeof content === 'object' ? content['#text'] || '' : content.toString()

  // Look for img tags
  const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
  if (imgMatch) {
    return imgMatch[1]
  }

  // Look for common image URLs in text
  const urlMatch = htmlContent.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i)
  if (urlMatch) {
    return urlMatch[0]
  }

  return null
}

/**
 * Parse various date formats into Date object
 */
function parseDate(dateString: any): Date | null {
  if (!dateString) return null

  const dateStr =
    typeof dateString === 'object'
      ? dateString['#text'] || dateString.toString()
      : dateString.toString()

  try {
    const date = new Date(dateStr)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  if (typeof text !== 'string') return ''

  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
}

/**
 * Strip HTML tags from text
 */
function stripHtmlTags(html: string): string {
  if (typeof html !== 'string') return ''

  return html
    .replace(/<[^>]*>/g, '') // Remove all HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
}

/**
 * Calculate estimated reading time
 */
export function calculateReadingTime(text: string): string {
  const wordsPerMinute = 200
  const wordCount = text.split(/\s+/).length
  const minutes = Math.ceil(wordCount / wordsPerMinute)

  if (minutes < 1) return '< 1 min read'
  if (minutes === 1) return '1 min read'
  return `${minutes} min read`
}
