import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Every relative `vi.mock()` path in this package must resolve to a real module.
 *
 * `vi.mock('./does-not-exist')` is not an error. Vitest registers a factory for
 * a module specifier, and if nothing ever imports that specifier the factory is
 * simply never used — the mock is a silent no-op and the *real* module loads.
 *
 * That cost this repo a fortnight of "the scf-core suite OOMs" (#504).
 * ProfileWizard.test.tsx mocked `../components/steps/GeneralStep`; the module is
 * `GeneralInfoStep`. So the real step component loaded, pulled StepNavigation
 * and the @scaffald/ui theme chain with it, and left the pooled worker holding a
 * handle it never released. One file out of 143:
 *
 *   with it     ~900s, worker RSS climbing to 2.8GB, OOM, exit 1
 *   without it  36s, exit 0
 *
 * It passed in isolation the whole time, because a single-file run tears the
 * process down at the end regardless of what is still open. Only a pooled run,
 * where the worker has to be reusable, exposed it.
 *
 * Bare specifiers (`@scaffald/ui`, `expo-router`) are not checked — resolving
 * those means replicating vitest's alias table, and a typo'd package name fails
 * loudly at import time anyway. It is the relative paths that fail silently.
 */

/**
 * Walk up from the cwd to the repo root, then down to the package.
 *
 * Not `import.meta.url`: the jsdom environment does not hand this file a
 * `file://` URL, so `fileURLToPath` throws ERR_INVALID_URL_SCHEME.
 */
const PACKAGE_DIR = (() => {
  const target = join('packages', 'scf-core')
  let dir = process.cwd()
  for (;;) {
    const candidate = resolve(dir, target)
    if (existsSync(candidate)) return candidate
    const parent = dirname(dir)
    if (parent === dir) throw new Error(`could not locate ${target} from ${process.cwd()}`)
    dir = parent
  }
})()

/** `vi.mock("./x")` / `vi.mock('../x')`, only where it starts a line. */
const VI_MOCK = /^\s*vi\.mock\(\s*['"]([^'"]+)['"]/gm

/** What a bare `import './x'` may resolve to, in the order a bundler tries. */
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.native.ts', '.native.tsx', '.web.ts', '.web.tsx']

function testFilesUnder(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out.push(...testFilesUnder(full))
    } else if (/\.test\.tsx?$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

function resolvesToAModule(fromFile: string, specifier: string): boolean {
  const base = resolve(dirname(fromFile), specifier)

  // ./thing.ts
  if (existsSync(base) && statSync(base).isFile()) return true
  // ./thing -> ./thing.tsx
  if (EXTENSIONS.some((ext) => existsSync(base + ext))) return true
  // ./thing -> ./thing/index.tsx
  if (existsSync(base) && statSync(base).isDirectory()) {
    return EXTENSIONS.some((ext) => existsSync(join(base, `index${ext}`)))
  }
  return false
}

describe('scf-core vi.mock paths', () => {
  const files = testFilesUnder(PACKAGE_DIR)

  it('finds test files to check', () => {
    // Guards the guard: a broken walk would make the assertion below vacuous.
    expect(files.length).toBeGreaterThan(50)
  })

  it('every relative vi.mock target exists', () => {
    const offenders: string[] = []

    for (const file of files) {
      const source = readFileSync(file, 'utf8')
      for (const match of source.matchAll(VI_MOCK)) {
        const specifier = match[1]!
        if (!specifier.startsWith('.')) continue
        if (!resolvesToAModule(file, specifier)) {
          offenders.push(`${file.replace(PACKAGE_DIR, '')} → ${specifier}`)
        }
      }
    }

    expect(offenders).toEqual([])
  })
})
