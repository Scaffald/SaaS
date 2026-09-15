import { renderUrlSet, SITE_ORIGIN, SITEMAP_HEADERS, type SitemapEntry } from '../utils/sitemap'

/**
 * Static marketing + legal surfaces.
 *
 * Exported so sitemap-routes-are-public.test.ts can assert every entry
 * resolves to an ungated route file — the check that was missing when /jobs
 * sat here at priority 0.8 while redirecting anonymous visitors to /auth
 * (#756), and when the job detail pages did the same (#734).
 */
export const PAGES: { path: string; priority: number; changefreq: SitemapEntry['changefreq'] }[] = [
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
