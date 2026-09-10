#!/usr/bin/env node
// Migration invariants. Two checks, both cheap, both earned.
//
// 1. No two migrations share a number.
// 2. A migration above the baseline must declare search_path on any function
//    it creates.
//
// Why (#468): `308_function_search_path.sql` set a search_path on every owned
// function in core/data/community/onet/public (Supabase advisor #172). Ten
// functions had none, because migrations 314-325 created them AFTER 308 ran —
// so they were never covered, and nothing noticed for eleven migrations.
//
// Migration 353 fixed those ten. This exists so the eleventh time cannot happen
// quietly: a positional sweep is inherently one-shot, covering what exists when
// it runs and nothing after. The sweep is the cleanup; this is the ratchet.
//
// A function with no explicit search_path resolves unqualified names against
// whatever the caller's search_path happens to be. That is the shape of a
// search-path attack the moment such a function becomes SECURITY DEFINER, and
// "it is only a trigger function today" is not a property that stays true.
//
// Scope: migrations numbered ABOVE the baseline below, since everything at or
// under it is either swept by 308 or fixed by 353. Rewriting migrations that
// have already run on production would be worse than pointless.
//
// Runs from lint and prepush. No arguments. Exit 1 on any offender.
//
// The duplicate-number check exists because it happened: #723 landed
// 351_drop_redundant_review_link_policies.sql while this branch was writing
// 351_service_role_grants_gap.sql. Two migrations with the same number is not a
// merge conflict — git takes both files happily — and the ordering the ledger
// depends on becomes whatever the filesystem says. Concurrent branches make
// this likely rather than exotic.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const MIGRATIONS = 'packages/supabase/migrations';

// 353 is the migration that cleared the backlog. Anything newer is new work and
// must declare its own search_path. Raise this only when another sweep lands.
const BASELINE = 353;

// The schemas 308 covered. A function created in some other schema is out of
// scope here rather than silently exempt — widen this list deliberately.
const OWNED = ['core', 'data', 'community', 'onet', 'public'];

// `CREATE [OR REPLACE] FUNCTION [schema.]name(` — capturing the optional schema.
const CREATE_FN =
  /\bcreate\s+(?:or\s+replace\s+)?function\s+(?:([a-z_][a-z0-9_]*)\s*\.\s*)?([a-z_][a-z0-9_]*)\s*\(/gi;

/**
 * The header of a function definition: everything from CREATE FUNCTION up to
 * the body delimiter. `SET search_path` is legal anywhere in that header
 * (before or after LANGUAGE / SECURITY DEFINER), and must not be looked for in
 * the body — a function whose *body* mentions search_path has not declared one.
 */
function header(source, fromIndex) {
  const rest = source.slice(fromIndex);
  const body = rest.search(/\bAS\s+(\$[a-z_]*\$|')/i);
  return body === -1 ? rest : rest.slice(0, body);
}

const offenders = [];

const files = readdirSync(MIGRATIONS)
  .filter((f) => f.endsWith('.sql'))
  .filter((f) => {
    const n = Number.parseInt(f.slice(0, f.indexOf('_')), 10);
    return Number.isFinite(n) && n > BASELINE;
  })
  .sort();

for (const file of files) {
  const source = readFileSync(join(MIGRATIONS, file), 'utf8');

  for (const m of source.matchAll(CREATE_FN)) {
    const schema = (m[1] ?? 'public').toLowerCase();
    if (!OWNED.includes(schema)) continue;

    const head = header(source, m.index);
    if (/\bset\s+search_path\s*=/i.test(head)) continue;

    const line = source.slice(0, m.index).split('\n').length;
    offenders.push(`${file}:${line}  ${schema}.${m[2]}`);
  }
}

// ── 1. duplicate migration numbers ────────────────────────────────────────────

const byNumber = new Map();
for (const f of readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql'))) {
  const n = Number.parseInt(f.slice(0, f.indexOf('_')), 10);
  if (!Number.isFinite(n)) continue;
  if (!byNumber.has(n)) byNumber.set(n, []);
  byNumber.get(n).push(f);
}

const collisions = [...byNumber.entries()]
  .filter(([, files]) => files.length > 1)
  .sort((a, b) => a[0] - b[0]);

if (collisions.length > 0) {
  console.error('\n❌ Two or more migrations share a number:\n');
  for (const [n, files] of collisions) {
    console.error(`   ${n}: ${files.join(', ')}`);
  }
  console.error(`
   Renumber the newer one to the next free slot. Migration order is the number,
   and duplicates make it whatever the filesystem returns.
`);
  process.exit(1);
}

// ── 2. search_path on functions in new migrations ─────────────────────────────

if (offenders.length > 0) {
  console.error('\n❌ Functions created without an explicit search_path:\n');
  for (const o of offenders) console.error(`   ${o}`);
  console.error(`
   Add one to the definition, e.g.

     CREATE OR REPLACE FUNCTION core.my_fn()
     RETURNS trigger
     LANGUAGE plpgsql
     SET search_path = core, public, extensions
     AS $$ ... $$;

   Without it the function resolves unqualified names against the caller's
   search_path. See migration 353 and issue #468.
`);
  process.exit(1);
}

console.log(
  `✓ migration numbers unique (${byNumber.size}); search_path declared on every ` +
    `function created after ${BASELINE} (${files.length} checked)`,
);
