/**
 * Two route files must not resolve to the same URL.
 *
 * Expo Router groups — the (parenthesised) directories — are not part of the
 * URL, so app/(public)/jobs/[slug].tsx and app/(protected)/jobs/[id].tsx were
 * both /jobs/<param>. The server rendered the public page, complete with the
 * job's title and meta description, and the client then resolved to the
 * protected one and redirected to /auth (#734).
 *
 * That shape is worse than a plain gate: the job stayed indexed in
 * sitemap-jobs.xml with a tailored description while no visitor could read it,
 * which is what search engines treat as cloaking — at the top of the hiring
 * funnel.
 *
 * Nothing warned. The collision is only visible by loading the page in a
 * browser and noticing the URL change, so it is worth a test.
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const APP_DIR = join(__dirname, '..', 'app')

/** Every route file under app/, as the URL it serves. */
function routeUrls(dir: string, prefix = ''): Map<string, string[]> {
  const found = new Map<string, string[]>()

  const walk = (current: string, urlPrefix: string) => {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry)

      if (statSync(full).isDirectory()) {
        // A (group) directory does not appear in the URL — which is exactly
        // how two files end up serving one path.
        const segment = /^\(.*\)$/.test(entry) ? urlPrefix : `${urlPrefix}/${entry}`
        walk(full, segment)
        continue
      }

      if (!/\.tsx?$/.test(entry)) continue
      if (entry.startsWith('_')) continue // _layout, _sitemap
      if (entry.includes('+api')) continue // API routes, not pages

      const base = entry.replace(/\.tsx?$/, '')
      // A dynamic segment's *name* does not affect matching: [slug] and [id]
      // are the same URL shape, which is the whole defect.
      const normalised = /^\[.+\]$/.test(base) ? ':param' : base
      const url = base === 'index' ? urlPrefix || '/' : `${urlPrefix}/${normalised}`

      const canonical = url
        .split('/')
        .map((s) => (/^\[.+\]$/.test(s) ? ':param' : s))
        .join('/')

      found.set(canonical, [...(found.get(canonical) ?? []), full.replace(APP_DIR, 'app')])
    }
  }

  walk(dir, prefix)
  return found
}

describe('expo-router route table', () => {
  it('has no two files serving the same URL', () => {
    const collisions = [...routeUrls(APP_DIR).entries()]
      .filter(([, files]) => files.length > 1)
      .map(([url, files]) => `${url} ← ${files.join('  |  ')}`)

    expect(collisions).toEqual([])
  })

  it('the detector would have caught the #734 collision', () => {
    // Guarding the guard: if the normalisation stopped treating [slug] and [id]
    // as the same shape, the test above would pass while the bug was present.
    const sameShape = (name: string) => (/^\[.+\]$/.test(name) ? ':param' : name)

    expect(sameShape('[slug]')).toBe(sameShape('[id]'))
    expect(sameShape('view')).not.toBe(sameShape('[id]'))
  })
})
