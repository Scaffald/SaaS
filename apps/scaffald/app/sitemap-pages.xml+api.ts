import { renderUrlSet, SITE_ORIGIN, SITEMAP_HEADERS, type SitemapEntry } from '../utils/sitemap'

/** Static marketing + legal surfaces. */
const PAGES: { path: string; priority: number; changefreq: SitemapEntry['changefreq'] }[] = [
  { path: '/', priority: 1.0, changefreq: 'weekly' },
  { path: '/jobs', priority: 0.8, changefreq: 'daily' },
  { path: '/support', priority: 0.4, changefreq: 'monthly' },
  { path: '/privacy', priority: 0.3, changefreq: 'yearly' },
  { path: '/terms', priority: 0.3, changefreq: 'yearly' },
]

export function GET(): Response {
  const entries: SitemapEntry[] = PAGES.map((page) => ({
    loc: `${SITE_ORIGIN}${page.path}`,
    changefreq: page.changefreq,
    priority: page.priority,
  }))
  return new Response(renderUrlSet(entries), { headers: SITEMAP_HEADERS })
}
