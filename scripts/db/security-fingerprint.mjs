#!/usr/bin/env node
/**
 * Security fingerprint of the database — what a client token can reach,
 * read from the live catalog rather than the migration ledger (#1146).
 *
 * Migration 303 was recorded on all three projects and had never run on any of
 * them; the ledger-based drift audit passed for seven months (#1144). This
 * reads the objects themselves.
 *
 *   node scripts/db/security-fingerprint.mjs snapshot <target>        JSON to stdout
 *   node scripts/db/security-fingerprint.mjs diff <targetA> <targetB> what differs (--all: include auth/storage)
 *   node scripts/db/security-fingerprint.mjs check <target>           invariants vs allow-list
 *
 * <target> is `local` (the running `supa start` stack, via docker exec), one of
 * `dev | preview | prod` (Management API, needs SUPABASE_PAT or
 * SUPABASE_ACCESS_TOKEN), or a path to a snapshot JSON file.
 *
 * `check` fails on any violation not in packages/supabase/security-allowlist.json,
 * and on any allow-list entry that no longer violates — the list may only
 * shrink, and it has to be shrunk by the PR that fixes the entry.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const ALLOWLIST = resolve(ROOT, 'packages/supabase/security-allowlist.json')
const PROJECTS = {
  dev: 'pmtdqrfpumqwkdhpgwcz',
  preview: 'uhjkipdwayqfihkanabk',
  prod: 'qmfmpcyxsihhfttvqpbw',
}
// Schemas Supabase manages itself. Fingerprinted, but their objects are not
// ours to fix, so invariants skip them.
const MANAGED_SCHEMAS = new Set(['auth', 'storage'])

function exposedSchemasFromConfig() {
  const toml = readFileSync(resolve(ROOT, 'packages/supabase/config.toml'), 'utf8')
  const api = toml.split(/^\[api\]/m)[1] ?? ''
  const line = api.match(/^schemas\s*=\s*\[([^\]]*)\]/m)
  if (!line) throw new Error('config.toml [api] schemas not found')
  return [...line[1].matchAll(/"([^"]+)"/g)].map((m) => m[1])
}

const sql = (schemas) => `
with s as (select unnest(array[${schemas.map((x) => `'${x}'`).join(',')}]::text[]) nspname),
rel as materialized (
  select c.oid, n.nspname, c.relname, c.relkind, c.relrowsecurity, c.relforcerowsecurity, c.reloptions
  from pg_class c join pg_namespace n on n.oid = c.relnamespace join s using (nspname)
  where c.relkind in ('r','p','v','m')
    and not exists (select 1 from pg_depend d where d.objid = c.oid and d.deptype = 'e')
),
fn as materialized (
  select p.oid, n.nspname, p.oid::regprocedure::text sig, p.prosecdef, p.proconfig, p.prorettype = 'trigger'::regtype is_trigger
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace join s using (nspname)
  where p.prokind = 'f'
    and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
)
select json_build_object(
  'schemas', (select json_agg(nspname order by nspname) from s),
  'tables', (select coalesce(json_agg(json_build_object(
      'name', nspname || '.' || relname,
      'rls', relrowsecurity,
      'force_rls', relforcerowsecurity,
      'grants', (select coalesce(json_agg(g order by g), '[]') from (
        select r.rolname || ':' || pr.p g
        from unnest(array['anon','authenticated','service_role']) r(rolname),
             unnest(array['SELECT','INSERT','UPDATE','DELETE']) pr(p)
        where has_table_privilege(r.rolname, rel.oid, pr.p)) x)
    ) order by nspname, relname), '[]') from rel where relkind in ('r','p')),
  'views', (select coalesce(json_agg(json_build_object(
      'name', nspname || '.' || relname,
      'security_invoker', coalesce(reloptions::text[] && array['security_invoker=true','security_invoker=on'], false),
      'grants', (select coalesce(json_agg(r order by r), '[]') from unnest(array['anon','authenticated']) r
                 where has_table_privilege(r, rel.oid, 'SELECT'))
    ) order by nspname, relname), '[]') from rel where relkind in ('v','m')),
  'policies', (select coalesce(json_agg(json_build_object(
      'table', schemaname || '.' || tablename, 'name', policyname, 'cmd', cmd,
      'permissive', permissive, 'roles', roles, 'qual', qual, 'with_check', with_check
    ) order by schemaname, tablename, policyname), '[]')
    from pg_policies join s on s.nspname = pg_policies.schemaname),
  'functions', (select coalesce(json_agg(json_build_object(
      'sig', sig,
      'definer', prosecdef,
      'trigger', is_trigger,
      'search_path', (select c from unnest(proconfig) c where c like 'search_path=%'),
      'execute', (select coalesce(json_agg(r order by r), '[]') from unnest(array['anon','authenticated','service_role']) r
                  where has_function_privilege(r, fn.oid, 'EXECUTE'))
    ) order by sig), '[]') from fn),
  'buckets', (select coalesce(json_agg(json_build_object(
      'id', id, 'public', public, 'file_size_limit', file_size_limit,
      'mime_limited', allowed_mime_types is not null
    ) order by id), '[]') from storage.buckets)
) as fp`

function readEnv(name) {
  if (process.env[name]) return process.env[name]
  const file = resolve(ROOT, '.env')
  if (!existsSync(file)) return undefined
  const line = readFileSync(file, 'utf8').split('\n').find((l) => l.startsWith(`${name}=`))
  return line?.slice(name.length + 1).replace(/^["']|["']$/g, '')
}

async function remoteSchemas(ref, token) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/postgrest`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'scaffald-security-fingerprint' },
  })
  if (!res.ok) throw new Error(`postgrest config for ${ref}: ${res.status} ${await res.text()}`)
  return (await res.json()).db_schema.split(',').map((x) => x.trim())
}

async function snapshot(target) {
  if (existsSync(target)) return JSON.parse(readFileSync(target, 'utf8'))
  if (target === 'local') {
    const container = process.env.SUPABASE_DB_CONTAINER ?? 'supabase_db_scaffald'
    const out = execFileSync(
      'docker',
      ['exec', '-i', container, 'psql', '-U', 'postgres', '-tA', '-v', 'ON_ERROR_STOP=1'],
      { input: sql(exposedSchemasFromConfig()), maxBuffer: 256 * 1024 * 1024 },
    )
    return JSON.parse(out.toString())
  }
  const ref = PROJECTS[target]
  if (!ref) throw new Error(`unknown target ${target} (local | dev | preview | prod | <file.json>)`)
  const token = readEnv('SUPABASE_ACCESS_TOKEN') ?? readEnv('SUPABASE_PAT')
  if (!token) throw new Error('SUPABASE_ACCESS_TOKEN or SUPABASE_PAT is required for a remote target')
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      // Cloudflare refuses default library user agents (403 code 1010).
      'User-Agent': 'scaffald-security-fingerprint',
    },
    body: JSON.stringify({ query: sql(await remoteSchemas(ref, token)) }),
  })
  if (!res.ok) throw new Error(`query ${target}: ${res.status} ${await res.text()}`)
  return (await res.json())[0].fp
}

// --- invariants -------------------------------------------------------------

const owned = (name) => !MANAGED_SCHEMAS.has(name.split('.')[0])

export function violations(fp) {
  const out = []
  const rlsOff = new Set(fp.tables.filter((t) => !t.rls).map((t) => t.name))
  for (const t of fp.tables) {
    if (!owned(t.name) || t.rls) continue
    const client = t.grants.filter((g) => g.startsWith('anon:') || g.startsWith('authenticated:'))
    if (client.length) out.push({ key: `table-rls-off-with-client-grants:${t.name}`, detail: client.join(',') })
  }
  for (const table of new Set(fp.policies.map((p) => p.table))) {
    if (owned(table) && rlsOff.has(table)) out.push({ key: `policy-exists-rls-off:${table}`, detail: '' })
  }
  for (const f of fp.functions) {
    if (!f.definer || f.trigger) continue
    if (f.execute.includes('anon')) out.push({ key: `definer-function-anon-execute:${f.sig}`, detail: '' })
  }
  for (const f of fp.functions) {
    if (f.definer && f.trigger && (f.execute.includes('anon') || f.execute.includes('authenticated'))) {
      out.push({ key: `definer-trigger-client-execute:${f.sig}`, detail: f.execute.join(',') })
    }
  }
  for (const v of fp.views) {
    if (owned(v.name) && !v.security_invoker && v.grants.length) {
      out.push({ key: `definer-view-client-select:${v.name}`, detail: v.grants.join(',') })
    }
  }
  for (const f of fp.functions) {
    if (f.definer && !f.search_path) out.push({ key: `definer-function-no-search-path:${f.sig}`, detail: '' })
  }
  return out
}

function check(fp) {
  const allow = existsSync(ALLOWLIST) ? JSON.parse(readFileSync(ALLOWLIST, 'utf8')).entries : {}
  const found = violations(fp)
  const foundKeys = new Set(found.map((v) => v.key))
  const fresh = found.filter((v) => !(v.key in allow))
  const stale = Object.keys(allow).filter((k) => !foundKeys.has(k))
  for (const v of fresh) console.log(`NEW   ${v.key}${v.detail ? `  (${v.detail})` : ''}`)
  for (const k of stale) console.log(`STALE ${k}  — fixed; remove it from security-allowlist.json`)
  console.log(`\n${found.length} violations, ${found.length - fresh.length} allow-listed, ${fresh.length} new, ${stale.length} stale`)
  return fresh.length === 0 && stale.length === 0
}

// --- diff -------------------------------------------------------------------

// Managed schemas change with every Supabase platform upgrade and differ
// between projects for reasons that are not ours; `--all` keeps them.
function index(fp, all) {
  const keep = (name) => all || owned(name)
  const m = new Map()
  for (const t of fp.tables.filter((x) => keep(x.name))) m.set(`table ${t.name}`, { rls: t.rls, force_rls: t.force_rls, grants: t.grants })
  for (const v of fp.views.filter((x) => keep(x.name))) m.set(`view ${v.name}`, { security_invoker: v.security_invoker, grants: v.grants })
  for (const p of fp.policies.filter((x) => keep(x.table))) m.set(`policy ${p.table} ${p.name}`, { cmd: p.cmd, permissive: p.permissive, roles: p.roles, qual: p.qual, with_check: p.with_check })
  for (const f of fp.functions.filter((x) => keep(x.sig.includes('.') ? x.sig : `public.${x.sig}`))) m.set(`function ${f.sig}`, { definer: f.definer, search_path: f.search_path ?? null, execute: f.execute })
  for (const b of fp.buckets) m.set(`bucket ${b.id}`, { public: b.public, file_size_limit: b.file_size_limit, mime_limited: b.mime_limited })
  return m
}

export function diff(a, b, all = false) {
  const A = index(a, all)
  const B = index(b, all)
  const lines = []
  for (const k of [...new Set([...A.keys(), ...B.keys()])].sort()) {
    const x = A.get(k)
    const y = B.get(k)
    if (!y) lines.push(`- ${k}`)
    else if (!x) lines.push(`+ ${k}`)
    else {
      for (const f of Object.keys({ ...x, ...y })) {
        const l = JSON.stringify(x[f])
        const r = JSON.stringify(y[f])
        if (l !== r) lines.push(`~ ${k}  ${f}: ${l} -> ${r}`)
      }
    }
  }
  return lines
}

// --- main -------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2)
  const all = args.includes('--all')
  const [cmd, a, b] = args.filter((x) => x !== '--all')
  if (cmd === 'snapshot' && a) {
    process.stdout.write(`${JSON.stringify(await snapshot(a), null, 2)}\n`)
  } else if (cmd === 'diff' && a && b) {
    const lines = diff(await snapshot(a), await snapshot(b), all)
    console.log(lines.length ? lines.join('\n') : `no security-relevant differences between ${a} and ${b}`)
    process.exitCode = lines.length ? 1 : 0
  } else if (cmd === 'check' && a) {
    process.exitCode = check(await snapshot(a)) ? 0 : 1
  } else {
    console.error('usage: security-fingerprint.mjs snapshot <target> | diff <a> <b> | check <target>')
    process.exitCode = 2
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err.message)
    process.exitCode = 2
  })
}
