import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * No test file in this package may register `vi.mock()` twice for the same
 * module.
 *
 * This is what made the office suite fail roughly one run in three on an
 * unchanged tree (#542). Two `vi.mock` calls for one module do not merge —
 * one factory wins — and which one wins is not stable across runs. Three
 * files were affected, each losing something different:
 *
 *   TeamMembersList  one mock had useToast, the other had `...actual`
 *                    (and so useThemeContext). Losing either threw
 *                    "No useThemeContext export is defined on the
 *                    @scaffald/ui mock".
 *   TeamActivityFeed one had the component stubs, the other `...actual`.
 *   TeamForm         one had `...actual` + useToast, the other every
 *                    component stub — including the Button carrying
 *                    testID="team-form-submit". When the stubs lost, the
 *                    submit button simply was not in the DOM.
 *
 * Each file passed in isolation, which is what made it read as an
 * environment problem rather than a bug in the test file.
 *
 * The failure is invisible in review — the two calls are usually hundreds of
 * lines apart — so it is asserted here rather than left to code review. Note
 * the repo has hit this at least three times before: see the comments in
 * `packages/scf-core/vitest.config.ts` for ApplicationsFilters,
 * PortfolioGallery and TeamCommentThread.
 *
 * Fix by merging into one factory that spreads `...actual` and returns every
 * stub, not by deleting one of them — each registration usually provides
 * something the others do not, so deleting one silently drops it.
 *
 * Widened from `features/office/` to the whole package in #566, which fixed
 * eight more files with the same defect. Two of them held three registrations
 * each.
 */

/**
 * Walk up from the cwd to the repo root, then down to the office feature.
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

/** `vi.mock("x")` / `vi.mock('x')`, only where it starts a line. */
const VI_MOCK = /^\s*vi\.mock\(\s*['"]([^'"]+)['"]/gm

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

function duplicateMocks(source: string): string[] {
  const counts = new Map<string, number>()
  for (const match of source.matchAll(VI_MOCK)) {
    const mod = match[1]!
    counts.set(mod, (counts.get(mod) ?? 0) + 1)
  }
  return [...counts.entries()].filter(([, n]) => n > 1).map(([mod]) => mod)
}

describe('scf-core test files', () => {
  const files = testFilesUnder(PACKAGE_DIR)

  it('finds test files to check', () => {
    // Guards the guard: a broken walk would make every assertion below vacuous.
    expect(files.length).toBeGreaterThan(50)
  })

  it('never registers vi.mock twice for the same module', () => {
    const offenders = files
      .map((file) => ({ file, dupes: duplicateMocks(readFileSync(file, 'utf8')) }))
      .filter(({ dupes }) => dupes.length > 0)
      .map(({ file, dupes }) => `${file.replace(PACKAGE_DIR, '')} → ${dupes.join(', ')}`)

    expect(offenders).toEqual([])
  })
})
