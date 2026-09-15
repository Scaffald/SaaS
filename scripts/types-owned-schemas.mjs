#!/usr/bin/env node
//
// Prints the part of a generated types.ts that this repo's migrations are
// responsible for, so CI can compare it against a freshly generated copy.
//
// A whole-file diff does not work. `storage`, `auth`, `realtime` and friends
// are Supabase's own schemas, introspected from whatever postgres-meta image
// the CLI pulls — so they move when the platform moves, not when we do. The
// first run of the CI check failed on exactly that:
//
//   +          versioning_status: string
//   +          archived_at: string | null
//   +          is_delete_marker: boolean
//   +          is_versioned: boolean
//
// all inside `storage`, none of it ours, none of it fixable by regenerating.
// A check that fails for a reason nobody can act on is one people learn to
// skip, which is worse than not having it.
//
// Usage: node scripts/types-owned-schemas.mjs <path/to/types.ts>

import { readFileSync } from 'node:fs'

// Writing to a closed pipe (`| head`, `| grep -q`) is not an error here.
process.stdout.on('error', (err) => {
  if (err.code === 'EPIPE') process.exit(0)
  throw err
})

/** Schemas whose shape comes from packages/supabase/migrations. */
const OWNED = new Set(['public', 'core', 'community', 'onet', 'logs'])

const file = process.argv[2]
if (!file) {
  console.error('usage: types-owned-schemas.mjs <types.ts>')
  process.exit(2)
}

const lines = readFileSync(file, 'utf8').split('\n')
const out = []
let keeping = false

for (const line of lines) {
  // Schema blocks open at exactly two spaces of indentation, in both the
  // `Database` type and the `Constants` value.
  const header = line.match(/^ {2}(\w+): \{$/)
  if (header) {
    keeping = OWNED.has(header[1])
    if (keeping) out.push(line)
    continue
  }
  // A two-space `}` closes the schema block it was opened against.
  if (/^ {2}\}/.test(line)) {
    if (keeping) out.push(line)
    keeping = false
    continue
  }
  if (keeping) out.push(line)
}

if (out.length === 0) {
  console.error(`no owned schemas found in ${file} — the format changed, or the file is empty`)
  process.exit(3)
}

process.stdout.write(out.join('\n'))
