import {
  fetchRows,
  renderUrlSet,
  SITE_ORIGIN,
  SITEMAP_HEADERS,
  type SitemapEntry,
} from '../utils/sitemap'

type JobRow = { slug: string | null; updated_at: string | null }

const LIMIT = 40000

export async function GET(): Promise<Response> {
  // Only open jobs are publicly reachable — closed ones 404 on the detail route.
  const rows = await fetchRows<JobRow>(
    'jobs',
    `select=slug,updated_at&status=eq.open&slug=not.is.null&order=updated_at.desc&limit=${LIMIT}`
  )

  const entries: SitemapEntry[] = rows
    .filter((row): row is { slug: string; updated_at: string | null } => Boolean(row.slug))
    .map((row) => ({
      loc: `${SITE_ORIGIN}/jobs/${encodeURIComponent(row.slug)}`,
      lastmod: row.updated_at ? row.updated_at.slice(0, 10) : undefined,
      changefreq: 'daily',
      priority: 0.7,
    }))

  return new Response(renderUrlSet(entries), { headers: SITEMAP_HEADERS })
}
