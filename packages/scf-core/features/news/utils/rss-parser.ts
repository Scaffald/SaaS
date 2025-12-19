import { XMLParser } from 'fast-xml-parser';
import type { NewsItem, ParsedRSSFeed } from '../config/types';

/**
 * RSS/XML Parser utility with cross-platform support
 * Handles RSS 2.0, Atom, and various feed formats
 */

// Type definitions for parsed RSS structures
interface ParsedXML {
  rss?: { channel: RSSChannel };
  feed?: AtomFeed;
  channel?: RSSChannel;
}

interface RSSChannel {
  title?: string;
  description?: string;
  lastBuildDate?: string;
  pubDate?: string;
  item?: RSSItem | RSSItem[];
}

interface RSSItem {
  title?: string;
  description?: string;
  summary?: string;
  content?: string;
  link?: string;
  pubDate?: string;
  guid?: string | { "#text": string };
  category?: string | Array<{ "#text": string }> | { "#text": string };
  author?: string;
  "dc:creator"?: string;
}

interface AtomFeed {
  title?: string | { "#text": string };
  subtitle?: string | { "#text": string };
  updated?: string;
  entry?: AtomEntry | AtomEntry[];
}

interface AtomEntry {
  id?: string;
  title?: string | { "#text": string };
  summary?: string | { "#text": string };
  content?: unknown;
  link?: { "@_href": string };
  published?: string;
  updated?: string;
  category?: unknown;
  author?: { name?: string };
}

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  textNodeName: "#text",
  parseTagValue: true,
  parseAttributeValue: true,
  trimValues: true,
  htmlEntities: true,
});

/**
 * Parse RSS/XML feed string into normalized NewsItem array
 */
export async function parseRSSFeed(xmlString: string): Promise<ParsedRSSFeed> {
  try {
    // Clean and sanitize XML
    const cleanXml = sanitizeXML(xmlString);
    const parsed = xmlParser.parse(cleanXml);

    return normalizeRSSFormat(parsed);
  } catch (error) {
    console.warn("RSS parsing failed:", error);
    return {
      title: "Unknown Feed",
      description: "Failed to parse RSS feed",
      items: [],
      lastUpdated: new Date(),
    };
  }
}

/**
 * Sanitize XML string to handle common issues
 */
function sanitizeXML(xmlString: string): string {
  return xmlString
    .split("") // Split into characters
    .filter((char) => {
      const code = char.charCodeAt(0);
      // Remove control characters (keep tab, newline, carriage return)
      return !(
        code <= 8 ||
        code === 11 ||
        code === 12 ||
        (code >= 14 && code <= 31) ||
        code === 127
      );
    })
    .join("")
    .replace(/&(?!amp;|lt;|gt;|quot;|apos;|#)/g, "&amp;") // Fix unescaped ampersands
    .trim();
}

/**
 * Normalize different RSS formats into consistent structure
 */
function normalizeRSSFormat(parsed: ParsedXML): ParsedRSSFeed {
  // Handle RSS 2.0 format
  if (parsed.rss?.channel) {
    return normalizeRSS2Format(parsed.rss.channel);
  }

  // Handle Atom format
  if (parsed.feed) {
    return normalizeAtomFormat(parsed.feed);
  }

  // Handle direct channel (some feeds omit the rss wrapper)
  if (parsed.channel) {
    return normalizeRSS2Format(parsed.channel);
  }

  throw new Error("Unrecognized RSS feed format");
}

/**
 * Normalize RSS 2.0 format
 */
function normalizeRSS2Format(channel: RSSChannel): ParsedRSSFeed {
  const items = Array.isArray(channel.item)
    ? channel.item
    : channel.item
    ? [channel.item]
    : [];

  return {
    title: decodeHtmlEntities(channel.title || "Unknown Feed"),
    description: decodeHtmlEntities(channel.description || ""),
    items: items.map(formatRSSItem).filter((item): item is NewsItem =>
      item !== null
    ),
    lastUpdated: parseDate(channel.lastBuildDate || channel.pubDate || "") ||
      new Date(),
  };
}

/**
 * Normalize Atom format
 */
function normalizeAtomFormat(feed: AtomFeed): ParsedRSSFeed {
  const entries = Array.isArray(feed.entry)
    ? feed.entry
    : feed.entry
    ? [feed.entry]
    : [];

  const feedTitle =
    typeof feed.title === "object" && feed.title !== null &&
      "#text" in feed.title
      ? feed.title["#text"]
      : typeof feed.title === "string"
      ? feed.title
      : 'Unknown Feed';

  const feedSubtitle =
    typeof feed.subtitle === 'object' && feed.subtitle !== null &&
      '#text' in feed.subtitle
      ? feed.subtitle['#text']
      : typeof feed.subtitle === 'string'
      ? feed.subtitle
      : '';

  return {
    title: decodeHtmlEntities(feedTitle),
    description: decodeHtmlEntities(feedSubtitle),
    items: entries.map(formatAtomEntry).filter((item): item is NewsItem =>
      item !== null
    ),
    lastUpdated: parseDate(feed.updated || "") || new Date(),
  };
}

/**
 * Format RSS 2.0 item into NewsItem
 */
function formatRSSItem(item: RSSItem): NewsItem | null {
  try {
    const title = decodeHtmlEntities(item.title || "");
    const guidText =
      typeof item.guid === "object" && item.guid !== null &&
        "#text" in item.guid
        ? item.guid["#text"]
        : typeof item.guid === "string"
        ? item.guid
        : undefined;
    const link = item.link || guidText || '';

    if (!title || !link) {
      return null;
    }

    return {
      id: guidText || link,
      title,
      description: decodeHtmlEntities(
        stripHtmlTags(item.description || item.summary || ""),
      ),
      link,
      pubDate: parseDate(item.pubDate || "") || new Date(),
      category: extractCategory(item.category),
      image: extractImageFromContent(item.description || item.content) ||
        undefined,
      author: item.author || item["dc:creator"] || undefined,
    };
  } catch (error) {
    console.warn("Failed to format RSS item:", error);
    return null;
  }
}

/**
 * Format Atom entry into NewsItem
 */
function formatAtomEntry(entry: AtomEntry): NewsItem | null {
  try {
    const title = decodeHtmlEntities(
      (typeof entry.title === "object"
        ? entry.title?.["#text"]
        : entry.title) || "",
    );
    const link = entry.link?.["@_href"] || entry.id;

    if (!title || !link) {
      return null;
    }

    return {
      id: entry.id || link,
      title,
      description: decodeHtmlEntities(
        stripHtmlTags(
          (typeof entry.summary === "object"
            ? entry.summary?.["#text"]
            : entry.summary) || "",
        ),
      ),
      link,
      pubDate: parseDate(entry.published || entry.updated || "") || new Date(),
      category: extractCategory(entry.category),
      image: extractImageFromContent(entry.content || entry.summary) ||
        undefined,
      author: entry.author?.name || undefined,
    };
  } catch (error) {
    console.warn("Failed to format Atom entry:", error);
    return null;
  }
}

/**
 * Extract category from various category formats
 */
function extractCategory(category: unknown): string | undefined {
  if (!category) return undefined;

  if (typeof category === "string") {
    return category;
  }

  if (Array.isArray(category)) {
    const first = category[0];
    if (typeof first === "object" && first !== null && "#text" in first) {
      return first["#text"] as string;
    }
    return typeof first === "string" ? first : undefined;
  }

  if (typeof category === "object" && category !== null) {
    if ("#text" in category) {
      return category["#text"] as string;
    }
    if ("@_term" in category) {
      return category["@_term"] as string;
    }
  }

  return undefined;
}

/**
 * Extract image URL from content/description HTML
 */
function extractImageFromContent(content: unknown): string | null {
  if (!content) return null;

  const htmlContent =
    typeof content === 'object' && content !== null && '#text' in content
      ? (content['#text'] as string) || ''
      : content?.toString() || '';

  // Look for img tags
  const imgMatch = htmlContent.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i);
  if (imgMatch) {
    return imgMatch[1];
  }

  // Look for common image URLs in text
  const urlMatch = htmlContent.match(
    /https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp)/i,
  );
  if (urlMatch) {
    return urlMatch[0];
  }

  return null;
}

/**
 * Parse various date formats into Date object
 */
function parseDate(dateString: Date | string): Date | null {
  if (!dateString) return null;

  const dateStr =
    typeof dateString === "object" && dateString !== null &&
      "#text" in dateString
      ? (dateString["#text"] as string) || dateString.toString()
      : dateString.toString();

  try {
    const date = new Date(dateStr);
    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Decode HTML entities
 */
function decodeHtmlEntities(text: string): string {
  if (typeof text !== 'string') return '';

  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, dec) => String.fromCharCode(dec))
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_match, hex) => String.fromCharCode(Number.parseInt(hex, 16)),
    );
}

/**
 * Strip HTML tags from text
 */
function stripHtmlTags(html: string): string {
  if (typeof html !== 'string') return '';

  return html
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();
}

/**
 * Calculate estimated reading time
 */
export function calculateReadingTime(text: string): string {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);

  if (minutes < 1) return '< 1 min read';
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}
