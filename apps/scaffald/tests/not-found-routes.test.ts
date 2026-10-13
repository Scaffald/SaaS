/**
 * Production must not serve expo-router's developer pages (#1082).
 *
 * Without `app/+not-found.tsx` and `app/_sitemap.tsx` expo-router generates
 * both: a stock "Unmatched Route" page for any unknown URL, and a `/_sitemap`
 * listing every route (admin included). This reads expo-router's own resolver
 * and the server manifest builder, as `route-shadowing.test.ts` does, so it
 * checks what the router will actually serve rather than which files exist.
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require_ = createRequire(join(__dirname, '..', 'package.json'))
const { getRoutes } = require_('expo-router/build/getRoutes.js')
const { createRoutesManifest } = require_('@expo/router-server/build/routes-manifest.js')

const APP_DIR = join(__dirname, '..', 'app')

function appKeys() {
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
  return keys
}

function appContext(keys: string[]) {
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
  contextKey?: string
  internal?: boolean
  children?: RouteNode[]
}

type ManifestRoute = { file: string; namedRegex: string }

describe('not-found and sitemap routes', () => {
  const keys = appKeys()
  const tree = getRoutes(appContext(keys), {
    platform: 'web',
    ignoreEntryPoints: true,
    ignoreRequireErrors: true,
  }) as RouteNode
  const root = (route: string) => (tree.children ?? []).find((child) => child.route === route)

  it('serves the app’s own not-found page, not expo-router’s', () => {
    const notFound = root('+not-found')
    expect(notFound?.contextKey).toBe('./+not-found.tsx')
    expect(notFound?.internal).toBeFalsy()
  })

  it('overrides the generated /_sitemap', () => {
    const sitemap = root('_sitemap')
    expect(sitemap?.contextKey).toBe('./_sitemap.tsx')
    expect(sitemap?.internal).toBeFalsy()
  })

  it('answers unknown web paths from the not-found route (the server sends 404 for these)', () => {
    const manifest = createRoutesManifest(keys, {}) as {
      htmlRoutes: ManifestRoute[]
      notFoundRoutes: ManifestRoute[]
    }
    const matches = (routes: ManifestRoute[], path: string) =>
      routes.filter((route) => new RegExp(route.namedRegex).test(path)).map((route) => route.file)

    expect(matches(manifest.htmlRoutes, '/zz-nope')).toEqual([])
    expect(matches(manifest.notFoundRoutes, '/zz-nope')).toEqual(['./+not-found.tsx'])
  })
})
