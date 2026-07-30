import { renderSitemapIndex, SITEMAP_HEADERS } from '../utils/sitemap'

/** Sitemap index. Split by content type so each stays well under the 50k cap. */
export function GET(): Response {
  const body = renderSitemapIndex(['/sitemap-pages.xml', '/sitemap-users.xml', '/sitemap-jobs.xml'])
  return new Response(body, { headers: SITEMAP_HEADERS })
}
