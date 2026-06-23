#!/usr/bin/env node
/**
 * SC-27 — hide dead exports from packages/ui/src/index.ts.
 *
 * Safe, mechanical transform using the TypeScript compiler API:
 *  - Scans every consumer (apps/scaffald, apps/web, packages — INCLUDING
 *    packages/ui's own tests/stories) for named imports from @scaffald/ui
 *    (+ /tokens /chart /maps) → builds the set of USED export names.
 *  - Parses index.ts. Comments out an `export { ... } [from ...]` statement
 *    ONLY when every name it exports is unused.
 *  - NEVER touches `export *` (can't split), default exports, direct
 *    declarations, or any statement that exports at least one used name.
 *  - Comments (does not delete) per the SC-27 ticket — fully reversible.
 *
 * Usage:
 *   node scripts/audit/2026-06-23/hide-dead-ui-exports.mjs            # dry run
 *   node scripts/audit/2026-06-23/hide-dead-ui-exports.mjs --apply    # write
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const ts = require('typescript')

const ROOT = resolve(import.meta.dirname, '..', '..', '..')
const UI_INDEX = join(ROOT, 'packages/ui/src/index.ts')
const APPLY = process.argv.includes('--apply')

const PACKAGE_IMPORT_PATHS = [
  '@scaffald/ui',
  '@scaffald/ui/tokens',
  '@scaffald/ui/chart',
  '@scaffald/ui/maps',
]
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', '.nx', 'dist', 'build', 'storybook-static',
  'coverage', '.expo', 'ios', 'android', '.turbo',
])

function* walk(dir) {
  let entries
  try { entries = readdirSync(dir) } catch { return }
  for (const name of entries) {
    if (IGNORE_DIRS.has(name)) continue
    const full = join(dir, name)
    let s
    try { s = statSync(full) } catch { continue }
    if (s.isDirectory()) yield* walk(full)
    else if (/\.(ts|tsx|mts|cts|js|jsx|mjs)$/.test(name)) yield full
  }
}

// --- 1. Collect every name imported from the package across all consumers ---
const pathAlt = PACKAGE_IMPORT_PATHS.map((p) => p.replace(/[/]/g, '\\/')).join('|')
const importRe = new RegExp(
  String.raw`import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["'](?:` + pathAlt + String.raw`)["']`,
  'g',
)
const used = new Set()
let scanned = 0
// Include packages/ui itself this time so we don't break its own tests/stories.
for (const key of ['apps/scaffald', 'apps/web', 'packages']) {
  for (const file of walk(join(ROOT, key))) {
    if (file === UI_INDEX) continue
    scanned++
    let src
    try { src = readFileSync(file, 'utf8') } catch { continue }
    if (!PACKAGE_IMPORT_PATHS.some((p) => src.includes(p))) continue
    let m
    while ((m = importRe.exec(src))) {
      for (const raw of m[1].split(',')) {
        const name = raw.replace(/^\s*(?:type\s+)?/, '').trim().split(/\s+as\s+/)[0].trim()
        if (/^[A-Za-z_$][\w$]*$/.test(name)) used.add(name)
      }
    }
  }
}

// --- 2. Parse index.ts; find fully-dead named export statements ---
const source = readFileSync(UI_INDEX, 'utf8')
const sf = ts.createSourceFile(UI_INDEX, source, ts.ScriptTarget.Latest, true)

const toComment = [] // { start, end, names }
let keptMixed = 0
for (const node of sf.statements) {
  if (!ts.isExportDeclaration(node)) continue
  // `export * from` / `export * as ns from` → no NamedExports clause: leave it.
  if (!node.exportClause || !ts.isNamedExports(node.exportClause)) continue
  const names = node.exportClause.elements.map((el) => el.name.text)
  const deadNames = names.filter((n) => !used.has(n))
  if (deadNames.length === names.length) {
    toComment.push({ start: node.getStart(sf), end: node.getEnd(), names })
  } else if (deadNames.length > 0) {
    keptMixed++
  }
}

const totalHidden = toComment.reduce((a, c) => a + c.names.length, 0)
console.log(`scanned ${scanned} consumer files · ${used.size} distinct names imported from the package`)
console.log(`export statements to hide: ${toComment.length} (covering ${totalHidden} export names)`)
console.log(`mixed live/dead statements left intact: ${keptMixed}`)
console.log('sample:')
for (const c of toComment.slice(0, 12)) console.log(`  - ${c.names.join(', ').slice(0, 90)}`)

if (!APPLY) {
  console.log('\n(dry run — pass --apply to write)')
  process.exit(0)
}

// --- 3. Rewrite: comment each dead statement, last-to-first to keep offsets ---
let out = source
const marker = '// [SC-27 hidden 2026-06-23 — dead export, see UI-KIT-INVENTORY.md]'
for (const c of [...toComment].sort((a, b) => b.start - a.start)) {
  const stmt = source.slice(c.start, c.end)
  const commented = marker + '\n' + stmt.split('\n').map((l) => '// ' + l).join('\n')
  out = out.slice(0, c.start) + commented + out.slice(c.end)
}
writeFileSync(UI_INDEX, out, 'utf8')
console.log(`\napplied → ${UI_INDEX}`)
