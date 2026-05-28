#!/usr/bin/env -S pnpm tsx
/**
 * scripts/audit/2026-05-26/file-findings.ts
 *
 * File the 2026-05-26 UI audit findings as Tasks in the in-product
 * Unicorn org → "Dogfood Bugs (Open)" punchlist. One Task per finding.
 * Idempotent: matches by source='ui-audit-2026-05-26' + title.
 *
 * Auth: clay@unicorn.love on the dev Supabase.
 *
 * Run from the parent worktree:
 *   cd /Users/clay/Development/UNI-Construct
 *   dotenv -e .env.dev -- pnpm tsx <worktree>/scripts/audit/2026-05-26/file-findings.ts
 *   add --dry-run to preview without writing.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_KEY) {
  console.error('✗ Missing env: needs EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY')
  console.error('  Run via: dotenv -e .env.dev -- pnpm tsx scripts/audit/2026-05-26/file-findings.ts')
  process.exit(1)
}

const API_BASE = `${SUPABASE_URL}/functions/v1/api`
const ORG_SLUG = 'unicorn'
const EMAIL = process.env.DOGFOOD_LOG_AS_EMAIL || 'clay@unicorn.love'
const PASSWORD = process.env.DOGFOOD_LOG_PASSWORD || 'password123'
const SOURCE = 'ui-audit-2026-05-26'
const DRY_RUN = process.argv.includes('--dry-run')

type Severity = 'blocker' | 'polish' | 'nit'
type Priority = 'low' | 'medium' | 'high' | 'urgent'

interface Finding {
  id: string
  severity: Severity
  title: string
  description: string
}

const FINDINGS: Finding[] = [
  // Blockers
  {
    id: 'B1',
    severity: 'blocker',
    title: '/onboarding stuck on "Loading…" indefinitely',
    description:
      'After 25s wait, the onboarding screen still shows the global "Loading..." spinner with no content rendered. Critical signup path — must resolve to a welcome card, first question, or error fallback.\n\nSource: 2026-05-26 UI audit B1.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/protected/onboarding.png',
  },
  {
    id: 'B2',
    severity: 'blocker',
    title: '/communities/reputation stuck on "Loading…" indefinitely',
    description:
      'Screen never resolves past the global spinner. Same pattern as B1/B3.\n\nSource: 2026-05-26 UI audit B2.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/communities/reputation.png',
  },
  {
    id: 'B3',
    severity: 'blocker',
    title: '/profile/resume stuck on "Loading…" indefinitely',
    description:
      'Profile resume page hangs on the global spinner. Vanity URL + PDF resume was just shipped in v1.3.0 (SC-40) — this is a regression to investigate.\n\nSource: 2026-05-26 UI audit B3.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/profile/resume.png',
  },
  {
    id: 'B4',
    severity: 'blocker',
    title: '/jobs list shows skeleton cards forever',
    description:
      'Jobs list shows skeleton card placeholders that never resolve. Either dev seed has no jobs (then show "No jobs yet" empty state, not infinite skeletons), or query is silently failing.\n\nSource: 2026-05-26 UI audit B4.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/jobs/list.png',
  },
  {
    id: 'B5',
    severity: 'blocker',
    title: '/employers list shows skeleton cards forever',
    description:
      'About 4 skeleton cards visible, none ever resolve to real employer data. Same empty-state-vs-real-skeleton ambiguity as B4.\n\nSource: 2026-05-26 UI audit B5.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/employers/list.png',
  },
  {
    id: 'B6',
    severity: 'blocker',
    title: 'Cookie banner covers welcome CTAs on iPhone viewport',
    description:
      'New-user signup is blocked at first touch. On iPhone viewport, the welcome screen for new users shows the brand panel + testimonial, and the cookie banner covers the entire bottom 30% of the screen — including what is almost certainly the primary "Get started" / "Sign in" button.\n\nSource: 2026-05-26 UI audit B6.\nScreenshots: docs/agents/audits/2026-05-26-ui-audit/unauth/welcome-or-redirect.png, /unauth/login.png',
  },
  {
    id: 'B7',
    severity: 'blocker',
    title: 'Cookie banner text typo: "learn.to learn more."',
    description:
      'Cookie banner reads: "We use cookies to make things work smoothly and help us learn.to learn more." — broken sentence with missing space / extra period. Visible on every unauth page.\n\nSource: 2026-05-26 UI audit B7.\nScreenshot: any unauth screenshot in docs/agents/audits/2026-05-26-ui-audit/unauth/',
  },
  {
    id: 'B8',
    severity: 'blocker',
    title: '/profile overview body is all skeletons',
    description:
      'Page header + "Request review" + "Share profile" buttons render fine, but the entire profile body below shows skeleton bars that never resolve. Same root cause likely as B4/B5.\n\nSource: 2026-05-26 UI audit B8.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/profile/overview.png',
  },
  // Polish
  {
    id: 'P1',
    severity: 'polish',
    title: 'Dashboard Communities section skeleton-stuck',
    description:
      'Dashboard renders correctly except the Communities section at the bottom — that one section is skeleton-stuck. Either no community data or a stuck query.\n\nSource: 2026-05-26 UI audit P1.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/protected/dashboard.png',
  },
  {
    id: 'P2',
    severity: 'polish',
    title: 'Dashboard "Profile Strength: 0% Complete" for seeded clay account',
    description:
      'Clay has a real seeded profile but the dashboard shows 0% Complete. Either the algorithm is not recomputing on this data, or seeds do not populate enough required fields. Worth a quick check post-SC-39 rollout.\n\nSource: 2026-05-26 UI audit P2.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/protected/dashboard.png',
  },
  {
    id: 'P3',
    severity: 'polish',
    title: 'Avatar inconsistency on dashboard (header "U" vs card "YP")',
    description:
      'Top header shows letter "U" (clay\'s first initial), but the "Your profile" card shows "YP" (presumably for "Your Profile" the literal text). Two avatars side by side with different content is jarring — pick one source of truth.\n\nSource: 2026-05-26 UI audit P3.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/protected/dashboard.png',
  },
  {
    id: 'P4',
    severity: 'polish',
    title: '"Assessments" button truncates to "As…" on dashboard',
    description:
      'The third action button on the dashboard card row truncates because it is longer than the others. Either shorten the label, make the row scrollable, or wrap to two columns under a width threshold.\n\nSource: 2026-05-26 UI audit P4.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/protected/dashboard.png',
  },
  {
    id: 'P5',
    severity: 'polish',
    title: 'Bottom tab bar clips last item on /workers',
    description:
      'The Workers list looks great (real data) but the bottom-most card is partially hidden behind the tab bar. Add bottom-padding to scrollable content equal to tab-bar height + safe area.\n\nSource: 2026-05-26 UI audit P5.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/workers/list.png',
  },
  {
    id: 'P6',
    severity: 'polish',
    title: '/auth/verify has massive empty space at top',
    description:
      'The OTP verify screen starts content ~40% down the screen, with no header / brand mark / context above. Either anchor content to top, or fill the top with logo/brand.\n\nSource: 2026-05-26 UI audit P6.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/unauth/verify.png',
  },
  {
    id: 'P7',
    severity: 'polish',
    title: '/search is completely empty',
    description:
      'Search screen is just a search bar with placeholder text. No recent searches, no popular categories, no empty-state copy. Either populate with suggestions or show empty-state messaging.\n\nSource: 2026-05-26 UI audit P7.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/protected/search.png',
  },
  // Nits
  {
    id: 'N1',
    severity: 'nit',
    title: '/profile/skills title duplicated (page header + inner card)',
    description:
      'Page header reads "Skills" and the first card inside ALSO has a "Skills" header with a chevron. Drop one — likely the inner one if it is an accordion that would not make sense pre-expanded.\n\nSource: 2026-05-26 UI audit N1.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/profile/skills.png',
  },
  {
    id: 'N2',
    severity: 'nit',
    title: '/communities has both spinner AND skeletons mid-page',
    description:
      'Page header + intro + tabs render correctly, then there is a centered spinner in the middle, then skeleton cards below it. Pick one loading affordance, not three at once.\n\nSource: 2026-05-26 UI audit N2.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/communities/list.png',
  },
  {
    id: 'N3',
    severity: 'nit',
    title: 'Bottom tab bar shape inconsistent between screens',
    description:
      'Dashboard shows a full-width straight tab bar, while /jobs shows a pill-shaped floating tab bar. Two different tab bars rendering across screens — probably a navigation layout regression.\n\nSource: 2026-05-26 UI audit N3.\nScreenshots: docs/agents/audits/2026-05-26-ui-audit/protected/dashboard.png vs /jobs/list.png',
  },
  {
    id: 'N4',
    severity: 'nit',
    title: '/auth/terms content scrolls behind cookie banner',
    description:
      'The Terms page renders correctly, but reading it requires scrolling past content hidden behind the persistent cookie banner. Same root cause as B6/B7 — banner should dismiss or shrink after first interaction or a short timeout.\n\nSource: 2026-05-26 UI audit N4.\nScreenshot: docs/agents/audits/2026-05-26-ui-audit/unauth/terms.png',
  },
]

const SEVERITY_TO_PRIORITY: Record<Severity, Priority> = {
  blocker: 'urgent',
  polish: 'high',
  nit: 'low',
}

async function main() {
  console.log(`  ${DRY_RUN ? 'DRY RUN' : 'EXECUTING'} — filing ${FINDINGS.length} findings as Tasks`)
  console.log(`  Supabase: ${SUPABASE_URL}`)
  console.log(`  Org: ${ORG_SLUG}`)
  console.log(`  Punchlist: Dogfood Bugs (Open)\n`)

  const auth = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
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

  // Resolve org + punchlist via service role.
  const admin = createClient(SUPABASE_URL!, SERVICE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: 'core' },
  })
  const { data: org } = await admin.from('organizations').select('id').eq('slug', ORG_SLUG).single()
  if (!org) throw new Error(`org ${ORG_SLUG} not found`)
  const orgId = (org as { id: string }).id

  const PUNCHLIST_NAME = 'Dogfood Bugs (Open)'
  let punchlistId: string
  const { data: existingPunchlist } = await admin
    .from('punchlists')
    .select('id')
    .eq('organization_id', orgId)
    .eq('name', PUNCHLIST_NAME)
    .maybeSingle()
  if (existingPunchlist) {
    punchlistId = (existingPunchlist as { id: string }).id
    console.log(`  found existing punchlist ${punchlistId}`)
  } else {
    console.log(`  creating punchlist "${PUNCHLIST_NAME}"`)
    if (DRY_RUN) {
      punchlistId = '[would-create]'
    } else {
      const res = await fetch(`${API_BASE}/v1/punchlists`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          organizationId: orgId,
          name: PUNCHLIST_NAME,
          description: 'Bugs surfaced by the dogfood loop, still open. Created 2026-05-26 by UI audit filing.',
          status: 'active',
        }),
      })
      if (!res.ok) throw new Error(`create punchlist failed: ${res.status} ${await res.text()}`)
      const j = (await res.json()) as { id: string }
      punchlistId = j.id
    }
  }

  // Pre-fetch existing audit tasks for idempotency.
  const { data: existing } = await admin
    .from('tasks')
    .select('id, title')
    .eq('organization_id', orgId)
    .eq('source', SOURCE)
  const existingTitles = new Set(
    (existing ?? []).map((t: { title: string }) => t.title),
  )

  let created = 0, skipped = 0, failed = 0
  const taskIdsByFindingId: Record<string, string> = {}

  for (const f of FINDINGS) {
    const fullTitle = `[${f.id}] ${f.title}`
    if (existingTitles.has(fullTitle)) {
      console.log(`  skip ${f.id}: ${f.title}`)
      skipped++
      continue
    }
    console.log(`  ${f.severity[0].toUpperCase()} ${f.id}: ${f.title}`)
    if (DRY_RUN) continue
    const res = await fetch(`${API_BASE}/v1/tasks`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        organizationId: orgId,
        title: fullTitle,
        description: f.description,
        status: 'todo',
        priority: SEVERITY_TO_PRIORITY[f.severity],
        punchlistId,
        teamSlug: 'frontend',
        source: SOURCE,
      }),
    })
    if (!res.ok) {
      console.error(`    ✗ ${res.status}: ${await res.text()}`)
      failed++
      continue
    }
    const j = (await res.json()) as { id: string }
    taskIdsByFindingId[f.id] = j.id
    created++
  }

  console.log(`\n  created=${created}, skipped=${skipped}, failed=${failed}`)
  if (!DRY_RUN && Object.keys(taskIdsByFindingId).length > 0) {
    // Print mapping so the Linear ticket-creator can backlink.
    console.log('\n  Task IDs by finding ID (use this for Linear backlinks):')
    console.log(JSON.stringify(taskIdsByFindingId, null, 2))
  }
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(`✗ ${err.message}`)
  process.exit(1)
})
