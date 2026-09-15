/**
 * A navigator must not claim a URL it cannot render.
 *
 * `route-collisions.test.ts` compares page files and skips anything starting
 * with `_`. That is the blind spot that shipped #766: a `_layout.tsx` makes its
 * directory a navigator which claims the directory's own path, and two screens
 * ended up claiming `"jobs"` —
 *
 *   "jobs"   /(protected)/jobs          <- navigator, no index child
 *   "jobs"   /(public)/jobs/index       <- the public listing
 *
 * React Navigation matches the first, found a navigator with no screen for the
 * path, rendered nothing, and expo-router rewrote the URL to `/`. Anonymous
 * visitors to /jobs got the marketing page. No page file collided, so the
 * existing test was green the whole time.
 *
 * A navigator that has its own `index` is fine — that is how every section here
 * works. The defect is specifically a navigator with no index sitting on a URL
 * some other route serves.
 *
 * This reads expo-router's own resolver rather than re-implementing it, because
 * re-implementing it is how the first guard came to disagree with the router.
 * Those are internal paths: if an upgrade moves them this test fails loudly,
 * which is the intended behaviour — a silent skip here is worse than a break.
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require_ = createRequire(join(__dirname, '..', 'package.json'))
const { getRoutes } = require_('expo-router/build/getRoutes.js')

const APP_DIR = join(__dirname, '..', 'app')

/** The context module Metro hands expo-router, built from the filesystem. */
function appContext() {
  const keys: string[] = []
  const walk = (dir: string, prefix: string) => {
    for (const entry of readdirSync(dir).sort()) {
      const full = join(dir, entry)
      if (statSync(full).isDirectory()) {
        walk(full, `${prefix}${entry}/`)
        continue
      }
      if (!/\.[jt]sx?$/.test(entry)) continue
      keys.push(`./${prefix}${entry}`)
    }
  }
  walk(APP_DIR, '')

  const ctx = (() => ({ default: () => null })) as unknown as {
    (key: string): unknown
    keys(): string[]
    resolve(key: string): string
    id: string
  }
  ctx.keys = () => keys
  ctx.resolve = (key: string) => key
  ctx.id = 'app'
  return ctx
}

type RouteNode = {
  route: string
  type?: string
  contextKey?: string
  children?: RouteNode[]
}

/** URL a node serves, with group segments dropped as expo-router drops them. */
function urlOf(prefix: string, route: string) {
  const segments = route
    .split('/')
    .filter((segment) => segment && !/^\(.*\)$/.test(segment))
    .filter((segment) => segment !== 'index')
  return segments.length ? `${prefix}/${segments.join('/')}` : prefix
}

describe('expo-router navigators', () => {
  const tree = getRoutes(appContext(), {
    platform: 'web',
    ignoreEntryPoints: true,
    ignoreRequireErrors: true,
  }) as RouteNode

  /** url -> { navigatorsWithoutIndex, routes } */
  const claims = new Map<string, { blind: string[]; routes: string[] }>()

  const record = (url: string, key: string, blind: boolean) => {
    const entry = claims.get(url) ?? { blind: [], routes: [] }
    ;(blind ? entry.blind : entry.routes).push(key)
    claims.set(url, entry)
  }

  const walk = (node: RouteNode, prefix: string) => {
    const url = urlOf(prefix, node.route) || '/'
    if (node.type === 'layout') {
      const hasIndex = (node.children ?? []).some((child) => child.route === 'index')
      // A group layout — `(public)/_layout.tsx` — contributes no path segment,
      // so it claims nothing and cannot shadow anything. Only a layout that
      // adds a segment owns a URL, and only then does a missing index matter.
      const claimsASegment = url !== (prefix || '/')
      if (!hasIndex && claimsASegment) record(url, node.contextKey ?? node.route, true)
    } else if (node.contextKey && !node.contextKey.includes('expo-router/build/views')) {
      record(url, node.contextKey, false)
    }
    for (const child of node.children ?? []) walk(child, url === '/' ? '' : url)
  }
  walk(tree, '')

  it('resolves the app route tree at all', () => {
    // If the internals moved, everything below would trivially pass on an
    // empty tree. Fail here instead.
    expect(claims.size).toBeGreaterThan(50)
  })

  it('has no navigator shadowing a route that serves the same URL', () => {
    const shadowed = [...claims.entries()]
      .filter(([, entry]) => entry.blind.length > 0 && entry.routes.length > 0)
      .map(([url, entry]) => `${url} ← navigator ${entry.blind.join(', ')} shadows ${entry.routes.join(', ')}`)

    expect(shadowed).toEqual([])
  })
})
