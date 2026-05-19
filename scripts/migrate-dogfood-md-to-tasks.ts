#!/usr/bin/env -S pnpm tsx

/**
 * scripts/migrate-dogfood-md-to-tasks.ts
 *
 * Phase 3 proof point: migrate the dogfood markdown lists
 * (docs/agents/DOGFOODING-BUGS.md and docs/agents/DOGFOODING-IDEAS.md)
 * into real Tasks + Punchlists inside the product, then collapse the
 * markdown files to one-line pointers at the new in-product URLs.
 *
 * What it does:
 *   1. Parses each markdown file's "Open" and "Fixed"/"Shipped" sections.
 *   2. Creates three punchlists under Unicorn org if missing:
 *        - "Dogfood Bugs (Open)"
 *        - "Dogfood Bugs (Fixed)"     ← seeded with status=completed
 *        - "Dogfood Ideas"
 *   3. For every bullet, creates a Task with source='dogfooding-md',
 *      title = the first dash-segment after the date, description = the
 *      remainder. Open items → status=todo. Fixed items → status=done.
 *   4. Idempotent: matches existing tasks by source + title and skips.
 *   5. Writes a stub at each markdown path pointing to the new tasks page.
 *
 * Auth: signs in as clay@unicorn.love (override via DOGFOOD_LOG_AS_EMAIL).
 *
 * Run once after applying migration 325:
 *   pnpm tsx scripts/migrate-dogfood-md-to-tasks.ts
 *
 * Use --dry-run to see what would happen without writing.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const API_BASE =
  process.env.EXPO_PUBLIC_SCAFFALD_API_URL || `${SUPABASE_URL}/functions/v1/api`
const UI_BASE = process.env.DOGFOOD_LOG_UI_BASE || 'http://localhost:8081'
const ORG_SLUG = 'unicorn'
const EMAIL = process.env.DOGFOOD_LOG_AS_EMAIL || 'clay@unicorn.love'
const PASSWORD = process.env.DOGFOOD_LOG_PASSWORD || 'password123'

const DRY_RUN = process.argv.includes('--dry-run')

interface ParsedBullet {
  isFixed: boolean
  raw: string
  title: string
  description: string
}

interface ParsedFile {
  open: ParsedBullet[]
  closed: ParsedBullet[]
}

function parseMarkdown(text: string): ParsedFile {
  // Split on "## Open" and the next "## ..." section, then on "## Fixed" / "## Shipped"
  const openSec = /^## Open\s*$/m.exec(text)
  const closedSec = /^## (Fixed|Shipped)\s*$/m.exec(text)
  const openStart = openSec ? openSec.index + openSec[0].length : -1
  const closedStart = closedSec ? closedSec.index + closedSec[0].length : -1
  const openEnd = closedSec ? closedSec.index : text.length
  const openBody = openStart >= 0 ? text.slice(openStart, openEnd) : ''
  const closedBody = closedStart >= 0 ? text.slice(closedStart) : ''
  return {
    open: extractBullets(openBody, false),
    closed: extractBullets(closedBody, true),
  }
}

function extractBullets(body: string, isFixed: boolean): ParsedBullet[] {
  // Each bullet is a single line starting with - [ ] or - [x]
  // Format: "- [ ] YYYY-MM-DD — TITLE — DESCRIPTION ..."
  const out: ParsedBullet[] = []
  const lineRe = /^- \[[ x]\] +(.+)$/gm
  let m: RegExpExecArray | null
  while ((m = lineRe.exec(body)) !== null) {
    const raw = m[1]
    // strip the leading date if present
    const afterDate = raw.replace(/^\d{4}-\d{2}-\d{2}\s*[—-]\s*/, '')
    // split on first " — " separator; everything after = description
    const idx = afterDate.indexOf(' — ')
    const title = (idx >= 0 ? afterDate.slice(0, idx) : afterDate).trim()
    const description = (idx >= 0 ? afterDate.slice(idx + 3) : '').trim()
    if (title.length === 0) continue
    out.push({
      isFixed,
      raw,
      title: title.slice(0, 200),
      description,
    })
  }
  return out
}

async function main() {
  const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: session, error: authErr } = await auth.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  })
  if (authErr || !session.session?.access_token) {
    throw new Error(`auth failed for ${EMAIL}: ${authErr?.message}`)
  }
  const token = session.session.access_token
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }

  // Resolve Unicorn org id
  const admin = createClient(SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz',
    { auth: { persistSession: false, autoRefreshToken: false }, db: { schema: 'core' } })
  const { data: org } = await admin.from('organizations').select('id').eq('slug', ORG_SLUG).single()
  if (!org) throw new Error(`org ${ORG_SLUG} not found`)
  const orgId = (org as { id: string }).id

  // Parse markdown files
  const bugsPath = 'docs/agents/DOGFOODING-BUGS.md'
  const ideasPath = 'docs/agents/DOGFOODING-IDEAS.md'
  const bugs = parseMarkdown(await readFile(bugsPath, 'utf-8'))
  const ideas = parseMarkdown(await readFile(ideasPath, 'utf-8'))

  console.log(`bugs: ${bugs.open.length} open + ${bugs.closed.length} fixed`)
  console.log(`ideas: ${ideas.open.length} open + ${ideas.closed.length} shipped`)
  if (DRY_RUN) {
    for (const b of [...bugs.open, ...bugs.closed, ...ideas.open, ...ideas.closed]) {
      console.log(`  [${b.isFixed ? 'x' : ' '}] ${b.title}`)
    }
    return
  }

  // Create / fetch the three punchlists
  async function ensurePunchlist(name: string, description: string, status: 'active' | 'completed') {
    const { data: existing } = await admin
      .from('punchlists')
      .select('id, name')
      .eq('organization_id', orgId)
      .eq('name', name)
      .maybeSingle()
    if (existing) return (existing as { id: string }).id
    const res = await fetch(`${API_BASE}/v1/punchlists`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ organizationId: orgId, name, description, status }),
    })
    if (!res.ok) {
      throw new Error(`create punchlist failed: ${res.status} ${await res.text()}`)
    }
    const j = (await res.json()) as { id: string }
    return j.id
  }

  const pBugsOpen = await ensurePunchlist(
    'Dogfood Bugs (Open)',
    'Bugs surfaced by the dogfood loop, still open. Migrated from docs/agents/DOGFOODING-BUGS.md.',
    'active',
  )
  const pBugsFixed = await ensurePunchlist(
    'Dogfood Bugs (Fixed)',
    'Bugs surfaced and fixed by the dogfood loop. Migrated from docs/agents/DOGFOODING-BUGS.md.',
    'completed',
  )
  const pIdeas = await ensurePunchlist(
    'Dogfood Ideas',
    'Feature ideas surfaced by the dogfood loop. Migrated from docs/agents/DOGFOODING-IDEAS.md.',
    'active',
  )

  // Pre-fetch already-migrated tasks by source+title so we can skip duplicates
  const { data: existingTasks } = await admin
    .from('tasks')
    .select('id, title, source')
    .eq('organization_id', orgId)
    .eq('source', 'dogfooding-md')
  const existingTitles = new Set(
    (existingTasks ?? []).map((t: { title: string }) => t.title),
  )

  async function ensureTask(
    b: ParsedBullet,
    punchlistId: string,
    teamSlug: string | null,
    priority: 'low' | 'medium' | 'high' | 'urgent',
  ): Promise<'created' | 'skipped' | 'failed'> {
    if (existingTitles.has(b.title)) return 'skipped'
    const res = await fetch(`${API_BASE}/v1/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        organizationId: orgId,
        title: b.title,
        description: b.description || null,
        status: b.isFixed ? 'done' : 'todo',
        priority,
        punchlistId,
        teamSlug,
        source: 'dogfooding-md',
      }),
    })
    if (!res.ok) {
      console.error(`  ✗ failed: ${b.title}: ${res.status} ${await res.text()}`)
      return 'failed'
    }
    existingTitles.add(b.title)
    return 'created'
  }

  let created = 0
  let skipped = 0
  let failed = 0

  for (const b of bugs.open) {
    const r = await ensureTask(b, pBugsOpen, 'backend', 'high')
    if (r === 'created') created++
    else if (r === 'skipped') skipped++
    else failed++
  }
  for (const b of bugs.closed) {
    const r = await ensureTask(b, pBugsFixed, 'backend', 'high')
    if (r === 'created') created++
    else if (r === 'skipped') skipped++
    else failed++
  }
  for (const b of ideas.open) {
    const r = await ensureTask(b, pIdeas, null, 'medium')
    if (r === 'created') created++
    else if (r === 'skipped') skipped++
    else failed++
  }
  for (const b of ideas.closed) {
    const r = await ensureTask(b, pIdeas, null, 'medium')
    if (r === 'created') created++
    else if (r === 'skipped') skipped++
    else failed++
  }

  console.log(`tasks: created=${created}, skipped=${skipped}, failed=${failed}`)

  // Replace markdown files with stubs that point at the new in-product URL
  const apiBase = `${UI_BASE.replace('8081', '54321')}/functions/v1/api/v1`
  const bugsStub = `# Dogfooding Bugs

> **Migrated to in-product Tasks.** The entries that used to live here
> are now Tasks under the **Dogfood Bugs (Open)** and **Dogfood Bugs
> (Fixed)** punchlists in the Unicorn org. The API is live; the UI for
> browsing tasks ships in Phase 3.2.
>
> Until the UI lands you can query the API directly, e.g.:
> \`\`\`bash
> curl -H "Authorization: Bearer <jwt>" \\
>   "${apiBase}/tasks?organizationId=<unicorn-org-id>&search=RLS"
> \`\`\`
>
> Migration: [scripts/migrate-dogfood-md-to-tasks.ts](../../scripts/migrate-dogfood-md-to-tasks.ts).
> Schema: [packages/supabase/migrations/325_tasks_and_punchlists.sql](../../packages/supabase/migrations/325_tasks_and_punchlists.sql).
>
> Going forward: file bugs as Tasks via the API. Once Phase 3.2 ships
> a Tasks UI page, this file can be deleted entirely.
`
  const ideasStub = `# Dogfooding Ideas

> **Migrated to in-product Tasks.** The entries that used to live here
> are now Tasks under the **Dogfood Ideas** punchlist in the Unicorn org.
> The API is live; the UI for browsing tasks ships in Phase 3.2.
>
> Migration: [scripts/migrate-dogfood-md-to-tasks.ts](../../scripts/migrate-dogfood-md-to-tasks.ts).
> Schema: [packages/supabase/migrations/325_tasks_and_punchlists.sql](../../packages/supabase/migrations/325_tasks_and_punchlists.sql).
>
> Going forward: file ideas as Tasks via the API. Once Phase 3.2 ships
> a Tasks UI page, this file can be deleted entirely.
`
  await writeFile(bugsPath, bugsStub)
  await writeFile(ideasPath, ideasStub)
  console.log(`wrote stubs at ${bugsPath} and ${ideasPath}`)
  console.log(`\nQuery tasks API (until UI ships in Phase 3.2):`)
  console.log(`  curl -H "Authorization: Bearer <jwt>" \\`)
  console.log(`    "${apiBase}/tasks?organizationId=${orgId}"`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
