#!/usr/bin/env -S pnpm tsx

/**
 * scripts/dogfood-log.ts
 *
 * Records a Claude Code session (or any unit of work in this repo) into
 * Unicorn's Logs system via the Scaffald SDK. Used at the end of every
 * session to dogfood the product and accumulate real demo data.
 *
 * See: docs/agents/DOGFOODING.md and root CLAUDE.md.
 *
 * Usage:
 *   pnpm tsx scripts/dogfood-log.ts \
 *     --team frontend \
 *     --project logs-feature \
 *     --hours 1.5 \
 *     --description "Rebuilt logs list UI with filters & date grouping" \
 *     --tasks "Added status segmented control,Implemented date grouping,Tested empty states" \
 *     --submit
 *
 * Required: --team, --project, --hours, --description
 * Optional: --tasks (comma-separated), --submit, --date (YYYY-MM-DD), --as <email>
 *
 * Auth: signs in as clay@unicorn.love by default (password: password123).
 * Override via DOGFOOD_LOG_AS_EMAIL env var or --as flag.
 */

import { parseArgs } from 'node:util'
import { createClient } from '@supabase/supabase-js'

const TEAM_SLUGS = ['design', 'frontend', 'backend', 'infra'] as const
type TeamSlug = (typeof TEAM_SLUGS)[number]

const PROJECT_IDS: Record<string, string> = {
  'scaffald-platform': 'e0000001-0000-4000-8000-000000000001',
  'scaffald-ui':       'e0000002-0000-4000-8000-000000000002',
  'logs-feature':      'e0000003-0000-4000-8000-000000000003',
  'tasks-feature':     'e0000004-0000-4000-8000-000000000004',
  'infrastructure':    'e0000005-0000-4000-8000-000000000005',
  'mobile-app':        'e0000006-0000-4000-8000-000000000006',
}

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'http://127.0.0.1:54321'

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

// Service role key — used because the `work_logs_insert_self` RLS policy
// (`auth.uid() = user_id`) currently fails even with a valid user JWT.
// See DOGFOODING-BUGS.md for the open bug. Once that is fixed, switch back
// to the user JWT path (already implemented; just swap `supabaseToken`).
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'

const API_BASE =
  process.env.EXPO_PUBLIC_SCAFFALD_API_URL ||
  `${SUPABASE_URL}/functions/v1/api`

const UI_BASE = process.env.DOGFOOD_LOG_UI_BASE || 'http://localhost:8081'
const ORG_SLUG = 'unicorn'

function die(msg: string): never {
  console.error(`\nerror: ${msg}\n`)
  console.error('Run with --help for usage.')
  process.exit(1)
}

function printHelp() {
  console.log(`
dogfood-log — log a session as work in Unicorn's Logs

Usage:
  pnpm tsx scripts/dogfood-log.ts [options]

Required:
  --team <slug>          One of: ${TEAM_SLUGS.join(', ')}
  --project <slug>       One of: ${Object.keys(PROJECT_IDS).join(', ')}
  --hours <number>       Hours worked (0.25 - 24)
  --description <text>   One-paragraph description (past tense)

Optional:
  --tasks <a,b,c>        Comma-separated list of completed tasks
  --submit               Also submit for verification (status: pending_verification)
  --date <YYYY-MM-DD>    Log date (default: today)
  --as <email>           Sign in as this user (default: clay@unicorn.love)
  --help                 Print this help

Environment:
  EXPO_PUBLIC_SUPABASE_URL        (default: http://127.0.0.1:54321)
  EXPO_PUBLIC_SCAFFALD_API_URL    (default: <supabase>/functions/v1/api)
  DOGFOOD_LOG_AS_EMAIL            (overrides --as)
  DOGFOOD_LOG_PASSWORD            (default: password123)
  DOGFOOD_LOG_UI_BASE             (default: http://localhost:8081)
`)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function hoursToTimeEntry(hours: number): { start_time: string; end_time: string } {
  const totalMinutes = Math.round(hours * 60)
  const startHour = 9
  const startMin = 0
  const endMinutesFromMidnight = startHour * 60 + startMin + totalMinutes
  const endHour = Math.floor(endMinutesFromMidnight / 60) % 24
  const endMin = endMinutesFromMidnight % 60
  return {
    start_time: `${pad(startHour)}:${pad(startMin)}`,
    end_time: `${pad(endHour)}:${pad(endMin)}`,
  }
}

async function main() {
  let parsed
  try {
    parsed = parseArgs({
      options: {
        team: { type: 'string' },
        project: { type: 'string' },
        hours: { type: 'string' },
        description: { type: 'string' },
        tasks: { type: 'string' },
        submit: { type: 'boolean', default: false },
        date: { type: 'string' },
        as: { type: 'string' },
        help: { type: 'boolean', default: false },
      },
      allowPositionals: false,
    })
  } catch (err) {
    die((err as Error).message)
  }

  const args = parsed.values

  if (args.help) {
    printHelp()
    return
  }

  if (!args.team) die('--team is required')
  if (!args.project) die('--project is required')
  if (!args.hours) die('--hours is required')
  if (!args.description) die('--description is required')

  const team = args.team as TeamSlug
  if (!TEAM_SLUGS.includes(team)) {
    die(`--team must be one of: ${TEAM_SLUGS.join(', ')}`)
  }

  const projectId = PROJECT_IDS[args.project]
  if (!projectId) {
    die(`--project must be one of: ${Object.keys(PROJECT_IDS).join(', ')}`)
  }

  const hours = Number(args.hours)
  if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
    die('--hours must be a number > 0 and <= 24')
  }

  const logDate = args.date || todayISO()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(logDate)) {
    die('--date must be YYYY-MM-DD')
  }

  const tasksCompleted =
    args.tasks
      ?.split(',')
      .map((t) => t.trim())
      .filter(Boolean) ?? []

  const email = process.env.DOGFOOD_LOG_AS_EMAIL || args.as || 'clay@unicorn.love'
  const password = process.env.DOGFOOD_LOG_PASSWORD || 'password123'

  // 1. Resolve the user.id for the email we're logging as.
  //    Use the anon client to sign in (also acts as a sanity check that the
  //    user exists with the expected password).
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email,
    password,
  })
  if (authError || !authData.session?.user?.id) {
    die(
      `auth failed for ${email}: ${authError?.message ?? 'no session returned'}\n` +
        `Is Supabase running? Try: pnpm supa start`,
    )
  }
  const userId = authData.session.user.id

  // 2. Build the description with a [team:slug] prefix so we can filter later.
  //    work_logs has no team_id column today — feature gap, see DOGFOODING-IDEAS.md.
  const fullDescription = `[team:${team}] ${args.description}`

  // 3. Insert via service-role supabase-js client.
  //    WHY NOT THE SDK / API: as of 2026-05-18, POST /v1/work-logs has
  //    multiple bugs (schema/SDK drift) AND the RLS `work_logs_insert_self`
  //    policy fails even for a correctly-authenticated user JWT. Both are
  //    tracked in DOGFOODING-BUGS.md. Once they're fixed, the cleaner path is
  //    `new Scaffald({ supabaseToken: session.access_token }).workLogs.create(...)`.
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'core' },
  })

  const { data: log, error: insertError } = await db
    .from('work_logs')
    .insert({
      user_id: userId,
      project_id: projectId,
      entry_type: 'daily',
      log_date: logDate,
      time_entries: [
        (() => {
          const t = hoursToTimeEntry(hours)
          return { start: t.start_time, end: t.end_time }
        })(),
      ],
      tasks_completed: tasksCompleted,
      work_description: fullDescription,
      visibility: 'private',
      status: 'draft',
    })
    .select()
    .single()

  if (insertError || !log) {
    die(`insert failed: ${insertError?.message ?? 'unknown error'}`)
  }

  console.log(`\n✓ Created log ${log.id}`)
  console.log(`  user:        ${email}`)
  console.log(`  project:     ${args.project}`)
  console.log(`  team:        ${team}`)
  console.log(`  date:        ${logDate}`)
  console.log(`  hours:       ${hours}`)
  console.log(`  status:      ${log.status}`)

  // 4. Optionally submit for verification (status → pending_verification)
  if (args.submit) {
    const { data: submitted, error: submitError } = await db
      .from('work_logs')
      .update({ status: 'pending_verification', submitted_at: new Date().toISOString() })
      .eq('id', log.id)
      .select()
      .single()
    if (submitError || !submitted) {
      die(`submit failed: ${submitError?.message ?? 'unknown error'}`)
    }
    console.log(`  submitted:   ${submitted.status}`)
  }

  console.log(`\n  URL: ${UI_BASE}/employers/org/${ORG_SLUG}/logs/${log.id}`)
  console.log()
  // Silence unused vars (API_BASE is here for the eventual SDK path)
  void API_BASE
}

main().catch((err) => {
  console.error('\n✗ dogfood-log failed:')
  if (err?.response?.data) console.error(JSON.stringify(err.response.data, null, 2))
  else console.error(err?.stack || err)
  process.exit(1)
})
