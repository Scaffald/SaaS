#!/usr/bin/env node
//
// `supabase gen types` reports exactly what the database it is pointed at
// contains. Point it at a database that is behind the migrations and it will
// faithfully delete every object the migrations added since — over the top of
// types.ts, with no diff to review. #707 is that failure caught late: three
// tables were missing for weeks, and the first attempt to regenerate was
// abandoned because the diff also dropped an enum and nobody could tell drift
// from an intentional DROP TYPE.
//
// So this wraps the generator with the two checks that tell those apart:
//
//   1. Refuse to run at all if the database is not caught up with the
//      migration files. A generation from a stale database is never right.
//   2. Generate in memory, and refuse to write it if any table, view, enum or
//      function would disappear. Removals are legitimate — migration 344
//      dropped core.application_status on purpose — so this is a stop, not a
//      ban: re-run with --allow-removals once the diff has been read.

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const TYPES = path.join(ROOT, 'packages/supabase/types.ts')
const allowRemovals = process.argv.includes('--allow-removals')

/** Sections whose members are named objects worth guarding. */
const GUARDED = new Set(['Tables', 'Views', 'Enums', 'Functions'])

/**
 * Every `schema.Section.name` the generated types declare.
 *
 * The file nests two levels of fixed indentation — schema at 2 spaces, section
 * at 4, member at 6 — for both the `Database` type and the `Constants` value,
 * so one pass over both halves collects the same names twice and the set
 * collapses them.
 */
function inventory(text) {
  const found = new Set()
  let schema = null
  let section = null

  for (const line of text.split('\n')) {
    const schemaMatch = line.match(/^ {2}(\w+): \{$/)
    if (schemaMatch) {
      schema = schemaMatch[1]
      section = null
      continue
    }
    const sectionMatch = line.match(/^ {4}(\w+): \{$/)
    if (sectionMatch) {
      section = sectionMatch[1]
      continue
    }
    if (/^ {4}\}$/.test(line)) {
      section = null
      continue
    }
    if (!schema || !GUARDED.has(section)) continue
    const member = line.match(/^ {6}(\w+):/)
    if (member) found.add(`${schema}.${section}.${member[1]}`)
  }
  return found
}

function supabase(args) {
  return execFileSync(
    'pnpm',
    [
      'exec',
      'dotenv',
      '-e',
      '.env',
      '--',
      'pnpm',
      'exec',
      'supabase',
      '--workdir',
      'packages',
      ...args,
    ],
    { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  )
}

function die(lines) {
  console.error(`\n${lines.join('\n')}\n`)
  process.exit(1)
}

// 1. The database must be current, or nothing below it can be trusted.
//
// `migration list` pairs each migration file (local) with what the database
// records as applied (remote). A gap in either column is drift. Off a TTY the
// CLI emits JSON; from a terminal it draws a Local | Remote table instead, so
// read whichever arrived. Do not pass `--output json` — that flag makes it
// print the table even when piped.
let listed
try {
  listed = supabase(['migration', 'list', '--local'])
} catch (err) {
  die([
    (err.stdout ?? '').trim(),
    (err.stderr ?? '').trim(),
    'Refusing to generate: could not read the migration list.',
    'Is the local stack running? Start it with `pnpm supa start`.',
  ])
}

const json = listed.indexOf('{"migrations"')
const rows =
  json >= 0
    ? JSON.parse(listed.slice(json, listed.indexOf('\n', json) + 1 || undefined)).migrations
    : listed
        .split('\n')
        .filter((row) => row.includes('|') && row.includes('`'))
        .map((row) => {
          const [local, remote] = row.split('|').map((cell) => cell.replaceAll('`', '').trim())
          return { local, remote }
        })

if (rows.length === 0) {
  die([
    'Refusing to generate: could not read the migration list.',
    'Is the local stack running? Start it with `pnpm supa start`.',
  ])
}

const unapplied = []
const unknown = []
for (const { local, remote } of rows) {
  if (local && !remote) unapplied.push(local)
  if (remote && !local) unknown.push(remote)
}

if (unapplied.length || unknown.length) {
  die([
    'Refusing to generate: the local database is not current.',
    ...(unapplied.length ? [`  migration files not applied: ${unapplied.join(', ')}`] : []),
    ...(unknown.length ? [`  applied but no file:         ${unknown.join(', ')}`] : []),
    '',
    'Generating from a stale database deletes whatever it has not caught up to.',
    ...(unapplied.length ? ['Apply the missing migrations with `pnpm supa:migration:up`.'] : []),
    ...(unknown.length
      ? [
          'A version with no file means a migration was renamed or deleted after it was applied; restore the file.',
        ]
      : []),
  ])
}

// 2. Generate in memory, and compare before overwriting.
const generated = supabase(['gen', 'types', 'typescript', '--local'])
const before = inventory(readFileSync(TYPES, 'utf8'))
const after = inventory(generated)

if (before.size === 0 || after.size === 0) {
  die([
    `Refusing to write: parsed 0 objects from the ${after.size === 0 ? 'generated types' : 'checked-in types'}.`,
    'The generated shape has changed and this guard no longer reads it.',
  ])
}

const removed = [...before].filter((name) => !after.has(name)).sort()

if (removed.length && !allowRemovals) {
  die([
    `Refusing to write: ${removed.length} object(s) would disappear from ${path.relative(ROOT, TYPES)}.`,
    ...removed.map((name) => `  - ${name}`),
    '',
    'The database is caught up with the migrations, so each of these is either',
    'an intentional DROP or a hand-edit that never had a migration behind it.',
    'Read the diff, and if the removals are right:',
    '',
    '  pnpm supa:generate --allow-removals',
  ])
}

writeFileSync(TYPES, generated)

const added = [...after].filter((name) => !before.has(name)).sort()
console.log(`${path.relative(ROOT, TYPES)} regenerated.`)
for (const name of added) console.log(`  + ${name}`)
for (const name of removed) console.log(`  - ${name}`)
if (!added.length && !removed.length)
  console.log('  no tables, views, enums or functions added or removed.')
