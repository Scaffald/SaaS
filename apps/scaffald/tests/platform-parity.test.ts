import { readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, test } from 'vitest'

/**
 * Every `*.web.*` module must have a native sibling.
 *
 * Metro resolves `./Foo` to `Foo.web.tsx` on web and `Foo.tsx` on native. A
 * web-only variant with no base file resolves to nothing on iOS/Android — the
 * native bundle fails, or worse, silently omits UI. This is the same class of
 * mistake as the marketing landing leaking onto native, so it gets a guard
 * rather than a convention.
 */

const REPO_ROOT = resolve(__dirname, '../../..')

const SEARCH_ROOTS = [
  'apps/scaffald/app',
  'apps/scaffald/components',
  'apps/scaffald/utils',
  'packages/scf-core/features/marketing',
]

const CODE_EXT = /\.(tsx|ts|jsx|js)$/

function walk(dir: string): string[] {
  let out: string[] = []
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) out = out.concat(walk(full))
    else if (CODE_EXT.test(entry)) out.push(full)
  }
  return out
}

const allFiles = SEARCH_ROOTS.flatMap((root) => walk(join(REPO_ROOT, root)))

/** `Foo.web.tsx` -> base `Foo`, so any extension can satisfy it. */
const webVariants = allFiles.filter((f) => /\.web\.(tsx|ts|jsx|js)$/.test(f))

describe('platform module parity', () => {
  test('finds web variants to check', () => {
    // A zero-length sweep would make the assertions below vacuously true.
    expect(webVariants.length).toBeGreaterThan(0)
  })

  test.each(webVariants.map((f) => [f.replace(`${REPO_ROOT}/`, ''), f]))(
    '%s has a native sibling',
    (_label, fullPath) => {
      const base = fullPath.replace(/\.web\.(tsx|ts|jsx|js)$/, '')
      const hasNative = ['.tsx', '.ts', '.jsx', '.js', '.native.tsx', '.native.ts'].some(
        (ext) => {
          try {
            return statSync(base + ext).isFile()
          } catch {
            return false
          }
        }
      )
      expect(hasNative).toBe(true)
    }
  )
})

describe('marketing surfaces stay off native entry points', () => {
  test('the marketing feature is only imported by web-safe call sites', () => {
    // The landing page is web-only product surface. If a native screen starts
    // importing it, that is the regression this suite exists for.
    const importers = allFiles.filter((f) => {
      if (/\.web\.(tsx|ts|jsx|js)$/.test(f)) return false
      if (f.includes('/features/marketing/')) return false
      if (f.includes('/tests/')) return false
      const src = require('node:fs').readFileSync(f, 'utf8')
      return /from '[^']*features\/marketing'/.test(src) && /LandingScreen/.test(src)
    })

    // Only the root route may pull in LandingScreen, and it gates on platform
    // via resolveRootRoute.
    const offenders = importers
      .map((f) => f.replace(`${REPO_ROOT}/`, ''))
      .filter((f) => f !== 'apps/scaffald/app/index.tsx')

    expect(offenders).toEqual([])
  })
})
