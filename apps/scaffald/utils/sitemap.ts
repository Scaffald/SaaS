/**
 * Shared helpers for the sitemap API routes. Server-only.
 */

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

export const SITE_ORIGIN = process.env.EXPO_PUBLIC_URL || 'https://scaffald.com'

/** Sitemaps are regenerated on demand; cache at the edge for an hour. */
export const SITEMAP_HEADERS = {
  'Content-Type': 'application/xml; charset=utf-8',
  'Cache-Control': 'public, max-age=3600, s-maxage=3600',
} as const

export type SitemapEntry = {
  loc: string
  lastmod?: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
}

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')

export function renderUrlSet(entries: SitemapEntry[]): string {
  const urls = entries
    .map((entry) => {
      const parts = [`    <loc>${escapeXml(entry.loc)}</loc>`]
      if (entry.lastmod) parts.push(`    <lastmod>${entry.lastmod}</lastmod>`)
      if (entry.changefreq) parts.push(`    <changefreq>${entry.changefreq}</changefreq>`)
      if (entry.priority !== undefined) parts.push(`    <priority>${entry.priority}</priority>`)
      return `  <url>\n${parts.join('\n')}\n  </url>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export function renderSitemapIndex(paths: string[]): string {
  const entries = paths
    .map(
      (path) => `  <sitemap>\n    <loc>${escapeXml(`${SITE_ORIGIN}${path}`)}</loc>\n  </sitemap>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</sitemapindex>\n`
}

/**
 * Queries PostgREST directly rather than the REST API, because the sitemap
 * needs bulk slug listings that the public API doesn't expose as an endpoint.
 * Returns an empty list on any failure so a partial sitemap still serves.
 */
export async function fetchRows<T>(table: string, query: string, schema = 'core'): Promise<T[]> {
  if (!SUPABASE_URL || !ANON_KEY) return []
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Accept-Profile': schema,
      },
    })
    if (!res.ok) {
      console.error(`[sitemap] ${table} query failed:`, res.status)
      return []
    }
    return (await res.json()) as T[]
  } catch (err) {
    console.error(`[sitemap] ${table} query error:`, err)
    return []
  }
}
