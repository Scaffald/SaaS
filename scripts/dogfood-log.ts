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
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { Scaffald } from '@scaffald/sdk'

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

/**
 * Resolve a short team name (`frontend`) to a core.teams id.
 *
 * Team slugs are namespaced by organization — `frontend` is stored as
 * `unicorn-frontend` — so the org prefix is applied here rather than assumed by
 * the caller. Returns null when the team does not exist, so a typo produces a
 * log without a team rather than a crash, and the caller reports it.
 */
async function resolveTeamId(
  authClient: SupabaseClient,
  accessToken: string,
  team: string
): Promise<string | null> {
  const slug = `${ORG_SLUG}-${team}`
  const { data, error } = await authClient
    .schema('core')
    .from('teams')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    console.warn(`  ! could not look up team "${slug}": ${error.message}`)
    return null
  }
  if (!data) {
    console.warn(`  ! no team with slug "${slug}" — logging without a team`)
    return null
  }
  void accessToken
  return data.id as string
}

async function main() {
  let parsed
  try {
    parsed = parseArgs({
      options: {
        team: { type: 'string' },
        project: { type: 'string' },
        projectId: { type: 'string' },
        hours: { type: 'string' },
        description: { type: 'string' },
        tasks: { type: 'string' },
        submit: { type: 'boolean', default: false },
        date: { type: 'string' },
        as: { type: 'string' },
        list: { type: 'boolean', default: false },
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

  // --list mode: sign in, fetch /v1/work-logs/projects, print and exit.
  // Use this to discover a valid --projectId on dev/preview/prod where the
  // hardcoded PROJECT_IDS map's local-only UUIDs won't resolve.
  if (args.list) {
    const email = process.env.DOGFOOD_LOG_AS_EMAIL || args.as || 'clay@unicorn.love'
    const password = process.env.DOGFOOD_LOG_PASSWORD || 'password123'
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data, error } = await authClient.auth.signInWithPassword({ email, password })
    if (error || !data.session?.access_token) {
      die(`auth failed for ${email}: ${error?.message ?? 'no session returned'}`)
    }
    const client = new Scaffald({
      supabaseToken: data.session.access_token,
      baseUrl: API_BASE,
    })
    const projects = await client.workLogs.getProjectOptions({})
    console.log(`\nProjects visible to ${email} (${API_BASE}):\n`)
    for (const p of projects) {
      console.log(`  ${p.id}  ${p.name}${p.isArchived ? ' (archived)' : ''}`)
    }
    console.log('')
    return
  }

  if (!args.team) die('--team is required')
  if (!args.project && !args.projectId)
    die('--project (named, local only) or --projectId (uuid) is required')
  if (!args.hours) die('--hours is required')
  if (!args.description) die('--description is required')

  const team = args.team as TeamSlug
  if (!TEAM_SLUGS.includes(team)) {
    die(`--team must be one of: ${TEAM_SLUGS.join(', ')}`)
  }

  // --projectId wins over --project. The PROJECT_IDS map's hardcoded UUIDs
  // are only seeded on local Supabase (seeds/011_seed-real-org-structure.sql);
  // pass --projectId <uuid> when logging against dev / preview / prod.
  // Use --list to discover valid project UUIDs for the current env.
  const projectId = args.projectId || PROJECT_IDS[args.project as string]
  if (!projectId) {
    die(
      `--project must be one of: ${Object.keys(PROJECT_IDS).join(', ')}, ` +
        `or pass --projectId <uuid> directly. Use --list to discover valid UUIDs.`,
    )
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId)) {
    die(`--projectId must be a uuid; got "${projectId}"`)
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

  // 1. Sign in via Supabase to get a JWT for the user we're logging as.
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
    email,
    password,
  })
  if (authError || !authData.session?.access_token) {
    die(
      `auth failed for ${email}: ${authError?.message ?? 'no session returned'}\n` +
        `Is Supabase running? Try: pnpm supa start`,
    )
  }

  // 2. Resolve the team to a real id. core.work_logs.team_id exists as of
  //    migration 339 (#425); this used to prepend `[team:slug]` to the
  //    description, which meant team attribution depended on nobody editing
  //    free text and could not be indexed or joined.
  //
  //    Team slugs are org-prefixed (`unicorn-frontend`), so the short name
  //    passed as --team is resolved within ORG_SLUG rather than assumed.
  const teamId = await resolveTeamId(authClient, authData.session.access_token, team)

  // 3. Create via the SDK against the public API surface. The handler at
  //    `packages/supabase/functions/api/routes/work-logs.ts` translates the
  //    SDK shape (single_day / start_time-end_time / etc) to the DB schema.
  const client = new Scaffald({
    supabaseToken: authData.session.access_token,
    baseUrl: API_BASE,
  })

  const log = await client.workLogs.create({
    projectId,
    entryType: 'single_day',
    logDate,
    timeEntries: [hoursToTimeEntry(hours)],
    workDescription: args.description as string,
    teamId,
    tasksCompleted,
    visibility: 'private',
    showOnProfile: false,
  })

  console.log(`\n✓ Created log ${log.id}`)
  console.log(`  user:        ${email}`)
  console.log(`  project:     ${args.project ?? projectId}`)
  console.log(`  team:        ${team}${teamId ? '' : '  (unresolved — logged without a team)'}`)
  console.log(`  date:        ${logDate}`)
  console.log(`  hours:       ${hours}`)
  console.log(`  status:      ${log.status}`)

  // 4. Optionally submit for verification (status → pending_verification)
  if (args.submit) {
    const submitted = await client.workLogs.submit({ workLogId: log.id })
    console.log(`  submitted:   ${submitted.status}`)
  }

  console.log(`\n  URL: ${UI_BASE}/employers/org/${ORG_SLUG}/logs/${log.id}`)
  console.log()
}

main().catch((err) => {
  console.error('\n✗ dogfood-log failed:')
  if (err?.response?.data) console.error(JSON.stringify(err.response.data, null, 2))
  else console.error(err?.stack || err)
  process.exit(1)
})
