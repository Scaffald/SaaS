#!/usr/bin/env node
// Migration invariants. Three checks, all cheap, all earned.
//
// 1. No two migrations share a number.
// 2. A migration above the baseline must declare search_path on any function
//    it creates.
// 3. Every core table a migration creates must be granted to service_role by
//    that migration or a later one.
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
let coreTablesChecked = 0;

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

// ── service_role grants on core tables (#751) ─────────────────────────────────
//
// `service_role` is the server's own identity. A missing table-level GRANT
// fires before RLS is evaluated, so no policy can rescue it and the endpoint
// answers `42501 permission denied` — which reaches the client as a 401 or a
// 500 and names nothing useful.
//
// This has now been fixed five times, in migrations 332, 335, 347, 352, 355,
// 356 and 357, each time for whichever tables somebody happened to trip over
// that week. The sweep is the cleanup; this is the ratchet.
//
// Why creation order matters, and not as a detail. Migration 096 contains:
//
//     DO $$ BEGIN
//       IF EXISTS (SELECT 1 FROM information_schema.tables
//                  WHERE table_schema='core' AND table_name='stripe_settings')
//       THEN GRANT ALL ON core.stripe_settings TO service_role;
//       END IF;
//     END $$;
//
// `core.stripe_settings` is created in migration **098**. When 096 ran the
// table did not exist, the condition was false, and the grant never happened —
// while the file reads as though it did. A grant is therefore only counted when
// it appears in a migration numbered at or above the one that creates the
// table.
//
// Calibrated against the three remote databases rather than asserted: with 357
// excluded this reports exactly the twenty tables
// `has_table_privilege('service_role', oid, 'SELECT')` reports as missing on
// production, and with 357 included it reports none.
//
// core is the only schema checked. `onet` and `community` carry
// ALTER DEFAULT PRIVILEGES for service_role (migrations 002 and 314), so new
// tables there are granted automatically; core has no such default, which is
// precisely why this keeps happening to core.

const CORE_CREATE =
  /\bcreate\s+table\s+(?:if\s+not\s+exists\s+)?core\.([a-z_][a-z0-9_]*)/gi;
const CORE_INTO = /\balter\s+table\s+(?:if\s+exists\s+)?[a-z_]+\.([a-z_][a-z0-9_]*)\s+set\s+schema\s+core\b/gi;
const CORE_OUT = /\balter\s+table\s+(?:if\s+exists\s+)?core\.([a-z_][a-z0-9_]*)\s+set\s+schema\s+(?!core\b)[a-z_]+/gi;
const CORE_DROP = /\bdrop\s+table\s+(?:if\s+exists\s+)?core\.([a-z_][a-z0-9_]*)/gi;
const CORE_RENAME =
  /\balter\s+table\s+(?:if\s+exists\s+)?core\.([a-z_][a-z0-9_]*)\s+rename\s+to\s+([a-z_][a-z0-9_]*)/gi;
// `[^;]` keeps a match inside one statement, so it cannot run into the next
// GRANT's role and claim a table that was never named.
const CORE_GRANT =
  /\bgrant\s+[^;]*?\son\s+(?:table\s+)?core\.([a-z_][a-z0-9_]*)\s[^;]*?service_role/gis;

/**
 * Tables known to lack the grant. Shrink-only, like BASELINE_BROKEN in
 * table-references-exist.test.ts: a new entry fails, and so does a stale one,
 * so the number can only go down. It is empty, and migration 357 is what
 * emptied it.
 */
const BASELINE_UNGRANTED = [];

{
  const all = readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .map((f) => ({ file: f, n: Number.parseInt(f.slice(0, f.indexOf('_')), 10) }))
    .filter(({ n }) => Number.isFinite(n))
    .sort((a, b) => a.n - b.n);

  const createdAt = new Map();
  const grantedAt = new Map();
  const gone = new Set();

  for (const { file, n } of all) {
    // Line comments only. A grant inside a DO block still counts as a grant —
    // whether it *ran* is the ordering question above, not a parsing one.
    const sql = readFileSync(join(MIGRATIONS, file), 'utf8').replace(/--[^\n]*/g, '');

    for (const m of sql.matchAll(CORE_CREATE)) {
      if (!createdAt.has(m[1].toLowerCase())) createdAt.set(m[1].toLowerCase(), n);
    }
    for (const m of sql.matchAll(CORE_INTO)) {
      if (!createdAt.has(m[1].toLowerCase())) createdAt.set(m[1].toLowerCase(), n);
    }
    for (const m of sql.matchAll(CORE_GRANT)) {
      const t = m[1].toLowerCase();
      if (!grantedAt.has(t)) grantedAt.set(t, []);
      grantedAt.get(t).push(n);
    }
    for (const m of sql.matchAll(CORE_DROP)) gone.add(m[1].toLowerCase());
    for (const m of sql.matchAll(CORE_OUT)) gone.add(m[1].toLowerCase());
    for (const m of sql.matchAll(CORE_RENAME)) gone.add(m[1].toLowerCase());
  }

  const ungranted = [...createdAt.entries()]
    .filter(([t]) => !gone.has(t))
    .filter(([t, created]) => !(grantedAt.get(t) ?? []).some((g) => g >= created))
    .map(([t]) => t)
    .sort();

  const isNew = ungranted.filter((t) => !BASELINE_UNGRANTED.includes(t));
  const isStale = BASELINE_UNGRANTED.filter((t) => !ungranted.includes(t));

  if (isNew.length > 0) {
    console.error('\n❌ core tables with no GRANT to service_role:\n');
    for (const t of isNew) console.error(`   core.${t}  (created in migration ${createdAt.get(t)})`);
    console.error(`
   Add one to the migration that creates the table:

     GRANT ALL ON core.${isNew[0]} TO service_role;

   service_role bypasses RLS by design, but a missing GRANT fires first and the
   endpoint answers "permission denied" with nothing pointing at the cause. See
   migration 357 and issue #751.
`);
    process.exit(1);
  }

  if (isStale.length > 0) {
    console.error('\n❌ BASELINE_UNGRANTED lists tables that now have a grant:\n');
    for (const t of isStale) console.error(`   core.${t}`);
    console.error(`
   Remove them from BASELINE_UNGRANTED in scripts/check-migrations.mjs. The list
   only shrinks.
`);
    process.exit(1);
  }

  coreTablesChecked = createdAt.size - gone.size;
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
    `function created after ${BASELINE} (${files.length} checked); every core ` +
    `table granted to service_role (${coreTablesChecked} checked)`,
);
