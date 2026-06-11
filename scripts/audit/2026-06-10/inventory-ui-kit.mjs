#!/usr/bin/env node
/**
 * @scaffald/ui usage inventory (SC-27 prep).
 *
 * Parses the public export surface of packages/ui/src/index.ts, then walks
 * every consumer (apps/scaffald, apps/web, other packages) collecting
 * `import { ... } from '@scaffald/ui'` statements. Produces a per-export
 * usage breakdown:
 *
 *   - Total import sites
 *   - Per-consumer counts (apps/scaffald = mobile, apps/web = web, others)
 *   - Dead exports (zero consumers) — candidates for SC-27 "comment out
 *     unused features — do not delete"
 *   - Mobile-only vs web-only vs shared — input for the SC-27 "reuse
 *     web/native where possible" decision
 *
 * Mechanical input only. The refactor decisions belong to Robin / SC-27
 * proper; this script just narrows the surface to look at.
 *
 * Usage:
 *   node scripts/audit/2026-06-10/inventory-ui-kit.mjs
 *
 * Output: markdown report on stdout. Pipe to capture:
 *   node ... inventory-ui-kit.mjs > scripts/audit/2026-06-10/UI-KIT-INVENTORY.md
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..', '..', '..')
const UI_INDEX = join(ROOT, 'packages/ui/src/index.ts')

const CONSUMER_ROOTS = [
  { key: 'apps/scaffald', label: 'mobile' },
  { key: 'apps/web', label: 'web' },
  { key: 'packages', label: 'pkgs' }, // other packages, excluding ui itself
]

// All import paths exposed by the package — main entry plus sub-path
// entry points declared in packages/ui/package.json. Importing
// `colors` from '@scaffald/ui/tokens' should count the same as importing
// it from '@scaffald/ui'.
const PACKAGE_IMPORT_PATHS = [
  '@scaffald/ui',
  '@scaffald/ui/tokens',
  '@scaffald/ui/chart',
  '@scaffald/ui/maps',
]

// --- 1. Parse public exports from packages/ui/src/index.ts ---------

function parseExports(source) {
  const names = new Set()
  // export { A, B as C, type D } from ...
  // export { A, B, type C }
  const blockRe = /export\s+(?:type\s+)?\{([^}]+)\}/g
  let m
  while ((m = blockRe.exec(source))) {
    for (const raw of m[1].split(',')) {
      const cleaned = raw
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
        .trim()
      if (!cleaned) continue
      // "X as Y" → export name is Y
      const parts = cleaned.split(/\s+as\s+/)
      const name = (parts[1] || parts[0]).replace(/^type\s+/, '').trim()
      if (/^[A-Za-z_$][\w$]*$/.test(name)) names.add(name)
    }
  }
  // export default ... — skipped (default exports aren't named here)
  // export function/const/class/type Name — direct
  const directRe = /export\s+(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s+([A-Za-z_$][\w$]*)/g
  while ((m = directRe.exec(source))) names.add(m[1])
  // export * from ... — surfaces nothing nameable from index.ts alone;
  // we follow these one level deep for full coverage.
  const starRe = /export\s+\*\s+from\s+["']([^"']+)["']/g
  const starModules = []
  while ((m = starRe.exec(source))) starModules.push(m[1])
  return { names, starModules }
}

function resolveStarTarget(modPath, fromDir) {
  // Resolve relative paths from the file that re-exports them; only
  // relative star-exports are followed. Try common index shapes.
  if (!modPath.startsWith('.')) return null
  const base = join(fromDir, modPath)
  const candidates = [
    `${base}.ts`, `${base}.tsx`,
    join(base, 'index.ts'), join(base, 'index.tsx'),
  ]
  for (const c of candidates) {
    try { if (statSync(c).isFile()) return c } catch {}
  }
  return null
}

// Recursively follow `export * from "./..."` chains so multi-level
// re-export trees (e.g. index.ts → tokens/index.ts → tokens/colors.ts)
// surface every leaf name. Visited set prevents cycles.
function collectAllExports(startFile) {
  const out = new Set()
  const visited = new Set()
  const stack = [startFile]
  while (stack.length) {
    const file = stack.pop()
    if (visited.has(file)) continue
    visited.add(file)
    let src
    try { src = readFileSync(file, 'utf8') } catch { continue }
    const { names, starModules } = parseExports(src)
    for (const n of names) out.add(n)
    const baseDir = file.replace(/[^/]+$/, '')
    for (const mod of starModules) {
      const target = resolveStarTarget(mod, baseDir)
      if (target) stack.push(target)
    }
  }
  return out
}

const PUBLIC_EXPORTS = [...collectAllExports(UI_INDEX)].sort()

// --- 2. Walk consumers, parse `from '@scaffald/ui'` import statements ---

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

// Each entry: name → { mobile, web, pkgs, total }
const usage = Object.fromEntries(PUBLIC_EXPORTS.map(n => [n, { mobile: 0, web: 0, pkgs: 0, total: 0 }]))

// Match: import { A, B as C, type D } from '<one of the package paths>'
// Captures the destructured name list. Alternation over all entry points.
const pathAlt = PACKAGE_IMPORT_PATHS
  .map(p => p.replace(/[/]/g, '\\/'))
  .join('|')
const importRe = new RegExp(
  String.raw`import\s+(?:type\s+)?\{([^}]+)\}\s+from\s+["'](?:` +
  pathAlt +
  String.raw`)["']`,
  'g',
)

function extractImportedNames(stmt) {
  return stmt
    .split(',')
    .map(p => p.replace(/^\s*(?:type\s+)?/, '').trim())
    .map(p => p.split(/\s+as\s+/)[0].trim())
    .filter(p => /^[A-Za-z_$][\w$]*$/.test(p))
}

let scannedFiles = 0
for (const { key, label } of CONSUMER_ROOTS) {
  for (const file of walk(join(ROOT, key))) {
    if (key === 'packages' && file.includes('/packages/ui/')) continue
    scannedFiles++
    let src
    try { src = readFileSync(file, 'utf8') } catch { continue }
    if (!PACKAGE_IMPORT_PATHS.some(p => src.includes(p))) continue
    let m
    while ((m = importRe.exec(src))) {
      for (const name of extractImportedNames(m[1])) {
        if (!usage[name]) continue
        usage[name][label]++
        usage[name].total++
      }
    }
  }
}

// --- 3. Report ---

const totalExports = PUBLIC_EXPORTS.length
const dead = PUBLIC_EXPORTS.filter(n => usage[n].total === 0)
// Architectural reality: apps/web consumes @scaffald/ui only via wrapper
// packages (compliance, tasks, insurance, scf-core), not directly. So the
// useful split is "consumed by the mobile app directly" vs "consumed only
// via wrapper packages" vs dead.
const mobileDirect = PUBLIC_EXPORTS.filter(n => usage[n].mobile > 0)
const webDirect = PUBLIC_EXPORTS.filter(n => usage[n].web > 0)
const pkgsOnly = PUBLIC_EXPORTS.filter(n =>
  usage[n].pkgs > 0 && usage[n].mobile === 0 && usage[n].web === 0,
)
const mobileAndPkgs = PUBLIC_EXPORTS.filter(n => usage[n].mobile > 0 && usage[n].pkgs > 0)

function fmtRows(names) {
  return names
    .sort((a, b) => usage[b].total - usage[a].total || a.localeCompare(b))
    .map(n => `| \`${n}\` | ${usage[n].mobile} | ${usage[n].web} | ${usage[n].pkgs} | ${usage[n].total} |`)
    .join('\n')
}

const today = new Date().toISOString().slice(0, 10)

console.log(`# @scaffald/ui usage inventory — generated ${today}`)
console.log()
console.log('> Mechanical SC-27 prep. Maps every public export to its direct importers across `apps/scaffald` (mobile), `apps/web` (web), and other packages. The refactor decisions live in [SC-27](https://linear.app/scaffald/issue/SC-27) proper.')
console.log()
console.log('## Architectural finding')
console.log()
console.log(`\`apps/web\` does **not** import \`@scaffald/ui\` directly — its UI surface is consumed entirely through wrapper packages (\`@unicornlove/compliance\`, \`@unicornlove/tasks\`, \`@unicornlove/insurance\`, \`@scf/core\`). \`apps/scaffald\` (mobile) imports the kit directly. This means "shared between mobile and web" isn't a meaningful direct-usage category here — the right axis is direct (mobile) vs indirect-via-wrappers (web).`)
console.log()
console.log('## Totals')
console.log()
console.log(`- **${totalExports}** public exports surfaced from \`packages/ui/src/index.ts\` (recursively following star re-exports through tokens / components / hooks subtrees)`)
console.log(`- **${dead.length}** dead — zero direct imports across all consumers (${pct(dead.length, totalExports)}%) — primary "comment out / hide" candidates per SC-27`)
console.log(`- **${mobileDirect.length}** imported by \`apps/scaffald\` directly (${pct(mobileDirect.length, totalExports)}%) — mobile-app surface`)
console.log(`- **${webDirect.length}** imported by \`apps/web\` directly (${pct(webDirect.length, totalExports)}%) — confirms web routes through wrappers`)
console.log(`- **${pkgsOnly.length}** used only by other packages (${pct(pkgsOnly.length, totalExports)}%) — the wrapper-layer surface`)
console.log(`- **${mobileAndPkgs.length}** used by both mobile and packages — most-load-bearing exports`)
console.log(`- Scanned **${scannedFiles}** consumer files`)
console.log()
console.log('### Caveats')
console.log()
console.log('1. **"Dead" means no direct \`from "@scaffald/ui"\` importer**, not transitively unused. Some dead exports may be re-exported by a wrapper package and consumed downstream — those re-exports would need a separate trace. Use the dead list as an upper-bound triage queue, not a delete list.')
console.log('2. Tests and stories under `packages/ui/__tests__/`, `packages/ui/stories/`, `packages/ui/playground/` are excluded from the consumer scan; an export used only by its own tests still counts as dead here.')
console.log('3. Only destructured-named imports are counted (`import { X } from ...`). Namespace imports (`import * as ui from ...`) are not — there are none currently but adding one would silently undercount.')
console.log()

function pct(a, b) { return b === 0 ? '0' : Math.round((100 * a) / b) }

function section(title, names, prelude) {
  if (names.length === 0) return
  console.log(`## ${title}`)
  console.log()
  if (prelude) console.log(prelude + '\n')
  console.log('| Export | mobile | web | pkgs | total |')
  console.log('|---|---|---|---|---|')
  console.log(fmtRows(names))
  console.log()
}

section(
  `Dead exports (${dead.length})`,
  dead,
  'Zero direct imports anywhere. Per SC-27 ticket: comment out / hide — do not delete. Triage queue, not delete list — re-exports via wrapper packages aren\'t traced here.',
)

section(
  `Mobile-direct exports (${mobileDirect.length})`,
  mobileDirect,
  'Imported directly by `apps/scaffald` (with or without wrapper-package usage too). The mobile-app surface of the kit. Keep these stable through the refactor.',
)

section(
  `Package-only exports (${pkgsOnly.length})`,
  pkgsOnly,
  'Used only by wrapper packages (`@unicornlove/compliance`, `tasks`, `insurance`, `@scf/core`, etc.), never directly by an app. This is the indirect-consumption surface. Refactoring these forces wrapper-package updates.',
)
