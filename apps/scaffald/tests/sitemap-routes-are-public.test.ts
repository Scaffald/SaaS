/**
 * A URL in the sitemap must resolve to a route anyone can load.
 *
 * This has now gone wrong twice. #734: the job detail pages were listed and
 * indexed while a route collision sent visitors to /auth. #756: `/jobs` itself
 * was listed at priority 0.8 while living under app/(protected), so a crawler
 * was invited in, shown a signed-in shell and a spinner, and bounced to the
 * login page about forty seconds later.
 *
 * Both were found by loading production in a browser, which is not a thing
 * that happens on every pull request.
 *
 * The issue asked for an end-to-end test that fetches each sitemap URL with no
 * session and asserts it does not land on /auth. This is the static equivalent,
 * and it is deliberately the static one: the e2e version needs Supabase, the
 * api function and a warm dev server, which is the same set of preconditions
 * that has kept the specs in tests/e2e/profile and tests/e2e/office from ever
 * running (#553, #592). A check that only runs where the whole stack is up is
 * a check that does not run. This one needs the filesystem.
 *
 * What it cannot see: a page that is public by routing but gates its own
 * content, or a redirect issued from inside a component. It sees the defect
 * both real incidents actually had.
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PAGES } from '../app/sitemap-pages.xml+api'

const APP_DIR = join(__dirname, '..', 'app')

/** Route groups whose layouts require a session (or redirect away from one). */
const GATED_GROUPS = ['(protected)', '(admin)', '(auth)']

/** Maps every static route file under app/ to the URL it serves. */
function staticRouteFiles(): Map<string, string[]> {
  const found = new Map<string, string[]>()

  const walk = (current: string, urlPrefix: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry)

      if (statSync(full).isDirectory()) {
        // Groups are not part of the URL, so the gate a file sits behind is
        // visible only in its path — which is why this compares paths.
        const segment = /^\(.*\)$/.test(entry) ? urlPrefix : `${urlPrefix}/${entry}`
        walk(full, segment)
        continue
      }

      if (!/\.tsx?$/.test(entry)) continue
      if (entry.startsWith('_')) continue
      if (entry.includes('+api')) continue

      const base = entry.replace(/\.tsx?$/, '')
      // Dynamic segments are skipped: sitemap-pages lists only static paths,
      // and the per-row sitemaps (jobs, users) are generated from the database.
      if (/^\[.+\]$/.test(base)) continue

      const url = base === 'index' ? urlPrefix || '/' : `${urlPrefix}/${base}`
      found.set(url, [...(found.get(url) ?? []), full.replace(APP_DIR, 'app')])
    }
  }

  walk(APP_DIR, '')
  return found
}

const gatesOf = (file: string) => GATED_GROUPS.filter((group) => file.includes(group))

describe('sitemap-pages.xml', () => {
  const routes = staticRouteFiles()

  it('lists only paths that have a route file', () => {
    const missing = PAGES.map((page) => page.path).filter((path) => !routes.has(path))

    expect(missing).toEqual([])
  })

  it('lists only routes outside the authenticated groups', () => {
    const gated = PAGES.flatMap((page) =>
      (routes.get(page.path) ?? [])
        .filter((file) => gatesOf(file).length > 0)
        .map((file) => `${page.path} → ${file}`)
    )

    expect(gated).toEqual([])
  })

  it('would have caught /jobs while it lived under (protected)', () => {
    // Guarding the guard. If GATED_GROUPS or the path check stopped working,
    // the assertion above would pass on a sitemap full of gated URLs.
    expect(gatesOf('app/(protected)/jobs/index.tsx')).toEqual(['(protected)'])
    expect(gatesOf('app/(public)/jobs/index.tsx')).toEqual([])
  })
})
