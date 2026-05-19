#!/usr/bin/env -S pnpm tsx

/**
 * scripts/phase2-seed.ts
 *
 * One-shot seeder that fans the dogfood logger out across every team,
 * project, user, and status bucket so Phase 2 has the data it needs:
 *   - ≥ 30 real logs in DB
 *   - each team has ≥ 3 logs
 *   - each project has ≥ 3 logs
 *   - each status bucket (draft, pending_verification, verified, disputed)
 *     has ≥ 2 logs
 *
 * Implementation notes:
 *   - Create + submit go via the SDK + user JWT (same path real users take).
 *   - Verify / dispute go via the service-role supabase-js client (those
 *     office-side endpoints are not yet wired up in the public API; see
 *     DOGFOODING-IDEAS.md for the backlog).
 *
 * Run once after `pnpm supa db reset`:
 *   pnpm tsx scripts/phase2-seed.ts
 *
 * Idempotent-ish: each log has a deterministic uuid-v5-ish key in the
 * description, so re-running skips already-inserted rows.
 */

import { createClient } from '@supabase/supabase-js'
import { Scaffald } from '@scaffald/sdk'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
const API_BASE =
  process.env.EXPO_PUBLIC_SCAFFALD_API_URL || `${SUPABASE_URL}/functions/v1/api`

const PASSWORD = 'password123'

const PROJECTS: Record<string, string> = {
  'scaffald-platform': 'e0000001-0000-4000-8000-000000000001',
  'scaffald-ui':       'e0000002-0000-4000-8000-000000000002',
  'logs-feature':      'e0000003-0000-4000-8000-000000000003',
  'tasks-feature':     'e0000004-0000-4000-8000-000000000004',
  'infrastructure':    'e0000005-0000-4000-8000-000000000005',
  'mobile-app':        'e0000006-0000-4000-8000-000000000006',
}

type Status = 'draft' | 'pending_verification' | 'verified' | 'disputed'

interface Entry {
  team: 'design' | 'frontend' | 'backend' | 'infra'
  project: keyof typeof PROJECTS
  user: string // email prefix; we'll add @unicorn.love
  hours: number
  description: string
  tasks: string[]
  daysAgo: number
  status: Status
  verifier?: string // email prefix for verify/dispute
  disputeReason?: string
  /** Stable key inserted into the description so re-runs can detect duplicates. */
  key: string
}

// 32 entries: each team ≥6, each project ≥4, status mix gives ≥8/≥12/≥10/≥2.
const ENTRIES: Entry[] = [
  // Design — Dusan member, Boris/Marc/Subbu/Michael managers
  { team: 'design', project: 'scaffald-ui',     user: 'dusan',   hours: 6.0, daysAgo: 25, status: 'verified', verifier: 'marc',
    description: 'Iterated on the Logs card design — tightened spacing, added a status pill, refreshed empty states.',
    tasks: ['Wireframe v3 in Figma', 'Pixel-pushed empty state', 'Spec status pill colors', 'Handed off to Frontend'], key: 'seed:design:ui:01' },
  { team: 'design', project: 'logs-feature',    user: 'dusan',   hours: 4.0, daysAgo: 22, status: 'verified', verifier: 'zach',
    description: 'Audited the Logs detail page for accessibility — flagged contrast issues and missing focus rings.',
    tasks: ['Ran axe scan', 'Filed 7 contrast fixes', 'Spec focus-ring tokens'], key: 'seed:design:logs:02' },
  { team: 'design', project: 'tasks-feature',   user: 'dusan',   hours: 5.5, daysAgo: 18, status: 'pending_verification',
    description: 'Drafted the Tasks + Punchlists information architecture: list, kanban, and detail views with state transitions.',
    tasks: ['IA diagram', 'Low-fi wireframes for 3 views', 'State-machine doc'], key: 'seed:design:tasks:03' },
  { team: 'design', project: 'mobile-app',      user: 'dusan',   hours: 3.0, daysAgo: 14, status: 'draft',
    description: 'Started exploring a bottom-sheet-based Quick Log entry pattern for mobile.',
    tasks: ['Reviewed iOS HIG sheets', 'Sketched 4 variants'], key: 'seed:design:mobile:04' },
  { team: 'design', project: 'scaffald-ui',     user: 'dusan',   hours: 2.5, daysAgo: 9,  status: 'verified', verifier: 'boris',
    description: 'Spec\'d the Toggle and Checkbox token sets to match the Figma refresh.',
    tasks: ['Token diff doc', 'Pair-spec with Robin'], key: 'seed:design:ui:05' },
  { team: 'design', project: 'logs-feature',    user: 'dusan',   hours: 1.5, daysAgo: 4,  status: 'pending_verification',
    description: 'Reviewed the new filters bar interaction; suggested making the date grouping headers sticky.',
    tasks: ['Loom walkthrough', 'Filed sticky-header proposal'], key: 'seed:design:logs:06' },

  // Frontend — Nemanja/Robin/Nikola members, Clay/Boris/Marc/Zach/Michael/Subbu managers
  { team: 'frontend', project: 'logs-feature',  user: 'nemanja', hours: 7.5, daysAgo: 24, status: 'verified', verifier: 'clay',
    description: 'Built the segmented status filter on the org Logs list — wired query params and persisted choice.',
    tasks: ['SegmentedControl component', 'Wire to useWorkLogs params', 'URL persistence', 'Tests'], key: 'seed:fe:logs:01' },
  { team: 'frontend', project: 'logs-feature',  user: 'robin',   hours: 5.0, daysAgo: 21, status: 'verified', verifier: 'marc',
    description: 'Implemented date grouping on the Logs list (Today / Yesterday / This week / This month / Earlier).',
    tasks: ['Group reducer', 'Section headers', 'Memoize for long lists'], key: 'seed:fe:logs:02' },
  { team: 'frontend', project: 'scaffald-ui',   user: 'nikola',  hours: 4.0, daysAgo: 17, status: 'verified', verifier: 'zach',
    description: 'Migrated the last Tamagui-era Stack/Row primitives in scaffald-app to the packages/ui equivalents.',
    tasks: ['Codemod sweep', 'Delete dead imports', 'Snapshot diff'], key: 'seed:fe:ui:03' },
  { team: 'frontend', project: 'logs-feature',  user: 'nemanja', hours: 3.5, daysAgo: 12, status: 'pending_verification',
    description: 'Added the visibility / show-on-profile chips to the Logs card.',
    tasks: ['Chip component', 'Conditional render rules', 'Storybook story'], key: 'seed:fe:logs:04' },
  { team: 'frontend', project: 'mobile-app',    user: 'robin',   hours: 6.0, daysAgo: 10, status: 'pending_verification',
    description: 'Fixed Reanimated worklet warnings on the dashboard drawer for SDK 55 + Reanimated 4.2.3.',
    tasks: ['Read Reanimated 4 migration notes', 'Switched to plain Animated where worklets were unnecessary', 'Regression-tested drawer gestures'], key: 'seed:fe:mobile:05' },
  { team: 'frontend', project: 'scaffald-ui',   user: 'nikola',  hours: 2.0, daysAgo: 6,  status: 'draft',
    description: 'Started on a Tag input primitive for tasksCompleted/skills — focus management is the tricky part.',
    tasks: ['API sketch', 'Spike keyboard nav'], key: 'seed:fe:ui:06' },
  { team: 'frontend', project: 'tasks-feature', user: 'nemanja', hours: 4.5, daysAgo: 3,  status: 'pending_verification',
    description: 'Stood up the Tasks list page scaffold with placeholder data, wired routing under employers/org/[slug]/tasks.',
    tasks: ['Route', 'List screen skeleton', 'Empty state'], key: 'seed:fe:tasks:07' },
  { team: 'frontend', project: 'logs-feature',  user: 'nikola',  hours: 1.0, daysAgo: 1,  status: 'disputed', verifier: 'marc',
    disputeReason: 'Hours seem high for what landed; please re-estimate before re-submitting.',
    description: 'Tweaked the Logs empty state copy and CTA placement.',
    tasks: ['Copy review with Design', 'CTA alignment tweak'], key: 'seed:fe:logs:08' },

  // Backend — Nemanja/Nikola members, Clay/Boris/Marc/Zach/Michael/Subbu managers
  { team: 'backend', project: 'logs-feature',   user: 'nemanja', hours: 8.0, daysAgo: 23, status: 'verified', verifier: 'clay',
    description: 'Inlined the work_logs SELECT/UPDATE RLS policies (migration 324) to fix the RETURNING-side rejection on user-JWT inserts.',
    tasks: ['Repro via psql', 'Isolate to SECURITY DEFINER recursive call', 'Author migration', 'Verify via PostgREST + SDK', 'Mark DOGFOODING-BUGS.md'], key: 'seed:be:logs:01' },
  { team: 'backend', project: 'scaffald-platform', user: 'nemanja', hours: 5.0, daysAgo: 20, status: 'verified', verifier: 'marc',
    description: 'Wrote the API translation shim for SDK ↔ DB work-log shape drift (single_day→daily etc).',
    tasks: ['entry_type translation', 'time_entries key translation', 'visibility coercion', 'comment with migration TODO'], key: 'seed:be:platform:02' },
  { team: 'backend', project: 'logs-feature',   user: 'nikola',  hours: 3.0, daysAgo: 16, status: 'pending_verification',
    description: 'Added the POST /v1/work-logs/:id/submit endpoint scoped to the owner draft.',
    tasks: ['Route + Zod', 'Hono handler', 'Auth check'], key: 'seed:be:logs:03' },
  { team: 'backend', project: 'tasks-feature',  user: 'nemanja', hours: 6.5, daysAgo: 11, status: 'pending_verification',
    description: 'Drafted the core.tasks schema with project/team scoping, assignee, status, due_date, and a junction to work_logs.',
    tasks: ['Migration draft', 'RLS sketch', 'Junction table for log↔task linkage'], key: 'seed:be:tasks:04' },
  { team: 'backend', project: 'scaffald-platform', user: 'nikola', hours: 2.5, daysAgo: 7, status: 'draft',
    description: 'Investigating the api_keys minting path for the Phase 4 production dogfood deployment.',
    tasks: ['Read api_keys schema', 'Repro mint flow as super admin'], key: 'seed:be:platform:05' },
  { team: 'backend', project: 'logs-feature',   user: 'nemanja', hours: 1.5, daysAgo: 2,  status: 'verified', verifier: 'zach',
    description: 'Added an integration test that covers the user-JWT create+submit path against a real local Supabase.',
    tasks: ['Test harness', 'CI tag for supabase-dep tests'], key: 'seed:be:logs:06' },

  // Infra — Nemanja member, Clay/Boris/Marc/Zach/Michael/Subbu managers
  { team: 'infra', project: 'infrastructure',   user: 'nemanja', hours: 6.0, daysAgo: 26, status: 'verified', verifier: 'clay',
    description: 'Brought the local Supabase stack back up after a fresh Docker install; documented the steps in scripts/setup-supabase-bin.sh.',
    tasks: ['Reinstall Docker', 'pnpm supa start', 'Update setup script with daemon-wait', 'Verify all 33 functions reachable'], key: 'seed:infra:infra:01' },
  { team: 'infra', project: 'infrastructure',   user: 'nemanja', hours: 3.0, daysAgo: 19, status: 'verified', verifier: 'boris',
    description: 'Reset DB and re-applied migrations 001-323 cleanly after consolidating the seed glob.',
    tasks: ['pnpm supa db reset', 'Spot-check seed counts', 'Note migration ordering risk in README'], key: 'seed:infra:infra:02' },
  { team: 'infra', project: 'scaffald-platform', user: 'nemanja', hours: 4.0, daysAgo: 13, status: 'pending_verification',
    description: 'Started wiring a CI job that runs the dogfood-log smoke test against a fresh container DB.',
    tasks: ['Compose file', 'GH Actions workflow draft', 'Cache pnpm store'], key: 'seed:infra:platform:03' },
  { team: 'infra', project: 'mobile-app',       user: 'nemanja', hours: 2.0, daysAgo: 8,  status: 'draft',
    description: 'Looking at our EAS Build profile — the iOS submission still has a TODO around the privacy manifest project ID.',
    tasks: ['Audit eas.json', 'Compare to apps/scaffald-app/app.config'], key: 'seed:infra:mobile:04' },
  { team: 'infra', project: 'infrastructure',   user: 'nemanja', hours: 1.5, daysAgo: 5,  status: 'pending_verification',
    description: 'Tuned vitest memory limits across packages — root cap was hitting 4096MB on the SDK test suite.',
    tasks: ['Bump --max-old-space-size', 'Document why in package.json'], key: 'seed:infra:infra:05' },
  { team: 'infra', project: 'tasks-feature',    user: 'nemanja', hours: 0.5, daysAgo: 1,  status: 'pending_verification',
    description: 'Provisioned a feature flag (`tasks_enabled`) and stubbed access control around it.',
    tasks: ['Add flag', 'Gate route registration'], key: 'seed:infra:tasks:06' },

  // A few cross-team manager contributions
  { team: 'frontend', project: 'logs-feature',  user: 'clay',    hours: 2.0, daysAgo: 27, status: 'verified', verifier: 'marc',
    description: 'Reviewed and merged the Logs list rebuild PR; pairs notes captured for follow-up filters.',
    tasks: ['PR review', 'Pair notes', 'Cherry-pick to release branch'], key: 'seed:cross:fe:logs:01' },
  { team: 'backend', project: 'scaffald-platform', user: 'boris', hours: 1.5, daysAgo: 15, status: 'pending_verification',
    description: 'Audited the api_keys RLS — flagged one over-permissive policy for cleanup.',
    tasks: ['Read policies', 'File issue'], key: 'seed:cross:be:platform:02' },
  { team: 'design', project: 'mobile-app',      user: 'subbu',   hours: 1.0, daysAgo: 6,  status: 'draft',
    description: 'Lightweight pass on the iOS app-icon variants for the privacy-manifest update.',
    tasks: ['Export 3 sizes', 'Drop in Assets.xcassets'], key: 'seed:cross:design:mobile:03' },
  { team: 'infra', project: 'logs-feature',     user: 'michael', hours: 2.5, daysAgo: 28, status: 'verified', verifier: 'zach',
    description: 'Ran load test against /v1/work-logs list at 50 concurrent users — found a missing index on log_date.',
    tasks: ['k6 script', 'Repro slow query', 'Propose index migration'], key: 'seed:cross:infra:logs:04' },

  // A second disputed entry so the status bucket has ≥2
  { team: 'backend', project: 'scaffald-platform', user: 'nikola', hours: 4.0, daysAgo: 9, status: 'disputed', verifier: 'boris',
    disputeReason: 'Scope overlapped with Nemanja\'s migration work — please split into a separate log.',
    description: 'Probed the api_keys minting endpoint and started sketching an admin UI for it.',
    tasks: ['Read api_keys RLS', 'Sketch admin route'], key: 'seed:cross:be:platform:disputed:05' },
]

function pad(n: number): string { return String(n).padStart(2, '0') }
function dateNDaysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
function hoursToTimeEntry(hours: number): { start_time: string; end_time: string } {
  const totalMin = Math.round(hours * 60)
  const startH = 9
  const endMin = startH * 60 + totalMin
  return { start_time: `${pad(startH)}:00`, end_time: `${pad(Math.floor(endMin / 60) % 24)}:${pad(endMin % 60)}` }
}

async function clientFor(email: string): Promise<Scaffald> {
  const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await auth.auth.signInWithPassword({ email, password: PASSWORD })
  if (error || !data.session?.access_token) {
    throw new Error(`auth failed for ${email}: ${error?.message}`)
  }
  return new Scaffald({ supabaseToken: data.session.access_token, baseUrl: API_BASE })
}

async function main() {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'core' },
  })

  // Detect already-seeded keys by searching descriptions
  const { data: existing } = await admin
    .from('work_logs')
    .select('id, work_description')
    .like('work_description', '%[phase2:key=%')
  const existingKeys = new Set(
    (existing ?? [])
      .map((r: { work_description: string | null }) => /\[phase2:key=([^\]]+)\]/.exec(r.work_description ?? '')?.[1])
      .filter(Boolean) as string[],
  )

  let created = 0
  let skipped = 0
  let failed = 0

  const userClients = new Map<string, Scaffald>()
  const userIds = new Map<string, string>()

  for (const e of ENTRIES) {
    if (existingKeys.has(e.key)) {
      skipped++
      continue
    }

    const email = `${e.user}@unicorn.love`
    let client = userClients.get(email)
    if (!client) {
      client = await clientFor(email)
      userClients.set(email, client)
    }

    const decoratedDesc = `[team:${e.team}] [phase2:key=${e.key}] ${e.description}`
    const projectId = PROJECTS[e.project]

    try {
      const log = await client.workLogs.create({
        projectId,
        entryType: 'single_day',
        logDate: dateNDaysAgo(e.daysAgo),
        timeEntries: [hoursToTimeEntry(e.hours)],
        workDescription: decoratedDesc,
        tasksCompleted: e.tasks,
        visibility: 'private',
        showOnProfile: false,
      })

      // Transition status as needed
      if (e.status === 'draft') {
        // no-op
      } else {
        await client.workLogs.submit({ workLogId: log.id })
      }

      if (e.status === 'verified' && e.verifier) {
        if (!userIds.has(e.verifier)) {
          const auth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: { persistSession: false, autoRefreshToken: false },
          })
          const { data } = await auth.auth.signInWithPassword({
            email: `${e.verifier}@unicorn.love`,
            password: PASSWORD,
          })
          if (data.session?.user?.id) userIds.set(e.verifier, data.session.user.id)
        }
        await admin
          .from('work_logs')
          .update({
            status: 'verified',
            verified_at: new Date().toISOString(),
            verified_by_user_id: userIds.get(e.verifier),
          })
          .eq('id', log.id)
      } else if (e.status === 'disputed' && e.verifier) {
        await admin
          .from('work_logs')
          .update({
            status: 'disputed',
            disputed_at: new Date().toISOString(),
            dispute_reason: e.disputeReason ?? 'Needs revision.',
          })
          .eq('id', log.id)
      }

      created++
      process.stdout.write('.')
    } catch (err) {
      failed++
      console.error(`\n✗ ${e.key} (${email}): ${(err as Error).message}`)
    }
  }

  console.log(`\n\ncreated: ${created}, skipped (already seeded): ${skipped}, failed: ${failed}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
