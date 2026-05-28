#!/usr/bin/env node
/**
 * Create v1.7.0 Linear tickets from the 2026-05-28 Profile audit.
 *
 * Browser-verified audit of the Profile page (Overview, Resumé, Skills,
 * Experience, Verification) on local Supabase. The local edge runtime was
 * restarted mid-audit to rule out a stale environment — failures persisted,
 * so these are real bugs that affect production too.
 *
 * Creates one ticket per finding on the SC team, labeled v1.7.0, state Todo.
 * Idempotent: skips any finding whose exact title already exists as an open
 * SC issue, so re-running will not create duplicates.
 *
 * Usage:
 *   node scripts/audit/2026-05-28/create-linear-tickets.mjs --dry-run
 *   node scripts/audit/2026-05-28/create-linear-tickets.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../../..')
const LINEAR_API = 'https://api.linear.app/graphql'
const RELEASE_LABEL = 'v1.7.0'

function loadKey() {
  if (process.env.LINEAR_API_KEY) return process.env.LINEAR_API_KEY
  for (const name of ['.env.production', '.env', '.env.local']) {
    const path = resolve(REPO_ROOT, name)
    if (!existsSync(path)) continue
    const m = readFileSync(path, 'utf8').match(/^LINEAR_API_KEY=(.+)$/m)
    if (m) return m[1].trim().replace(/^["']|["']$/g, '')
  }
  return null
}

const API_KEY = loadKey()
if (!API_KEY) { console.error('✗ LINEAR_API_KEY missing'); process.exit(1) }

const DRY = process.argv.includes('--dry-run')

async function gql(query, variables) {
  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: API_KEY },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Linear ${res.status}: ${await res.text()}`)
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data
}

// 1=urgent, 2=high, 3=medium, 4=low
const FINDINGS = [
  {
    key: 'P0-1',
    priority: 1,
    title: 'API route shadowing: /v1/profiles/{username} swallows experience/employment/education base routes',
    body: `**Root cause RC-1.** In \`packages/supabase/functions/api/index.ts\`, the generic \`profilesRouter\` is mounted at \`/v1/profiles\` (line ~124) **before** the specific sub-routers \`/v1/profiles/experience\` (136), \`/v1/profiles/employment\` (137), \`/v1/profiles/education\` (138). \`profilesRouter\` defines \`GET /{username}\` (\`packages/supabase/functions/api/routes/profiles.ts:243\`), which greedily matches single-segment paths.

So \`GET /v1/profiles/experience\` resolves to "look up user named *experience*" →
\`404 {"error":"Not Found","message":"Profile with username 'experience' not found or is not public"}\`. Same for \`/education\` and \`/employment\`. Multi-segment paths (e.g. \`/experience/summary\`) slip past and reach their handlers.

**User impact:** Work Experience + Education sections spin on "Loading…" / "Failed to load" forever; Employment preferences never load.

**Fix:** Register the specific \`/v1/profiles/{experience,employment,education,skills,...}\` routers **before** the \`/{username}\` catch-all, or make the param route the last match.

**Acceptance:** \`GET /v1/profiles/experience\`, \`/education\`, \`/employment\` reach their own routers and return 200 with list data.`,
  },
  {
    key: 'P0-2',
    priority: 1,
    title: 'Skill search returns 404: POST /v1/profiles/skills/search-parents never ported to REST API',
    body: `**Root cause RC-3.** The reported "skill search returns nothing for plumbing/carpentry" bug. The SDK calls \`POST /v1/profiles/skills/search-parents\` (\`packages/sdk/src/resources/skills.ts:271\`), but that route does **not exist** in the REST \`api\` edge function (\`packages/supabase/functions/api/routes/skills.ts\` has \`/soft\`, \`/\`, \`/{skillId}\`, \`/multi-taxonomy\`, \`/primary-industry\` — no \`/search-parents\`). It only exists in the legacy tRPC router (\`packages/supabase/functions/trpc/routers/profile/skills.router.ts:735\`). Live result: \`404 {"error":"Not found"}\`.

The client error is then swallowed by the catch at \`packages/scf-core/features/profile/profile-skills-context.tsx:213\`, so the UI silently shows "No skills found".

**Note:** the CSI taxonomy (\`data.masterformat\`) is also empty on fresh local DBs (see dev-env ticket); both must be fixed for search to work.

**Fix:** Implement \`POST /v1/profiles/skills/search-parents\` in the REST api (port the tRPC \`searchParentSkills\` logic / \`search_parent_skills\` RPC).

**Acceptance:** Searching "plumbing"/"carpentry" returns CSI results in the Skills page.`,
  },
  {
    key: 'P0-3',
    priority: 1,
    title: 'Technical skills 500: core.user_skills_multi_taxonomy relation does not exist',
    body: `**Root cause RC-2.** \`GET/POST/DELETE /v1/profiles/skills/multi-taxonomy\` (\`packages/supabase/functions/api/routes/skills.ts:970,1050,1106\`) query \`user_skills_multi_taxonomy\`, but \`core.user_skills_multi_taxonomy\` does not exist in the DB and **no migration creates it** (grep across \`packages/supabase/migrations/\` = 0 hits). Live result: \`500 {"message":"Could not find the table 'core.user_skills_multi_taxonomy' in the schema cache"}\`.

**User impact:** "Your Skills" list stuck on "Loading…"; adding/removing technical skills would fail.

**Fix:** Create the missing relation (table or view) via migration, or repoint the route to the correct existing relation.

**Acceptance:** Technical skills list loads (200) and add/remove succeed.`,
  },
  {
    key: 'P0-4',
    priority: 1,
    title: 'Experience summary / education level 500: core.user_profiles relation does not exist',
    body: `**Root cause RC-2.** \`GET /v1/profiles/experience/summary\` and \`GET /v1/profiles/education/level\` query \`core.user_profiles\` (\`packages/supabase/functions/api/routes/experience.ts:183\`, \`education.ts:176\`). \`core.user_profiles\` does not exist (0 rows in information_schema; never created by a migration). Note \`user_experience\` and \`user_education\` **do** exist — \`user_profiles\` is the odd one out. Live result: \`500 {"message":"Could not find the table 'core.user_profiles' in the schema cache"}\`.

**Fix:** Create/repoint \`core.user_profiles\` (likely should be \`core.profile\` or \`core.users\`).

**Acceptance:** experience/summary and education/level return 200.`,
  },
  {
    key: 'P1-1',
    priority: 2,
    title: 'Vanity URL slug history 404: GET /v1/profiles/slug/history not implemented in REST API',
    body: `**Root cause RC-3.** The Resumé page's Vanity URL panel calls \`GET /v1/profiles/slug/history\`, which returns \`404 {"error":"Not found"}\` — the route was never ported to the REST \`api\` function.

**Fix:** Implement the slug-history route (or remove the client call if the feature is deferred).

**Acceptance:** Vanity URL panel loads slug history without a 404.`,
  },
  {
    key: 'P1-2',
    priority: 2,
    title: 'Profile: replace silent failures + infinite spinners with real error/empty states',
    body: `**UX hardening.** Across the Profile page, API 404/500s surface as generic "No skills found", infinite "Loading…" spinners, or a bare "Failed to load" with no actionable message. The skill-search error is even swallowed at \`packages/scf-core/features/profile/profile-skills-context.tsx:213\` (\`catch { return [] }\`).

**Fix:** Add explicit error states (distinct from empty states) for Skills, Experience, Education, Employment; surface a retry + a real message; stop swallowing fetch errors silently.

**Acceptance:** A failing profile endpoint shows an error state with retry, not a perpetual skeleton or a misleading "no results".`,
  },
  {
    key: 'P1-3',
    priority: 2,
    title: 'O*NET skill search is non-functional: UI offers O*NET toggle but search has no O*NET branch',
    body: `**Taxonomy mismatch.** The Skills search UI offers **CSI / O*NET** toggles and sends \`['csi','onet']\`, but \`search_parent_skills\` only has branches for \`csi\` and \`core\` — there is no O*NET branch. Additionally, the selected taxonomy is dropped before the call: \`profile-skills-context.tsx:160\` calls the mutation without passing \`taxonomies\`.

**Fix:** Either implement an O*NET search branch and pass the selected taxonomy through, or remove the O*NET toggle until supported.

**Acceptance:** Toggles reflect actual search behavior; selecting O*NET either returns O*NET results or the toggle is absent.`,
  },
  {
    key: 'P2-1',
    priority: 3,
    title: 'Profile Overview shows Connect/Follow buttons on your own profile',
    body: `**Self-view bug.** The Profile → Overview header renders "Connect" and "Follow" buttons even when viewing your own profile. These social actions make no sense in self-view.

**Fix:** Hide Connect/Follow when the viewed profile is the current user.

**Acceptance:** Own-profile Overview shows "View public profile" / edit affordances but not Connect/Follow.`,
  },
  {
    key: 'P2-2',
    priority: 3,
    title: 'GET /v1/id-verification/status returns 400 (verify expected behavior)',
    body: `On the Verification page, \`GET /v1/id-verification/status\` returns \`400\` (other verification endpoints — background-checks, completion/status — return 200). The page degrades gracefully ("ID badge unavailable"), so low priority, but confirm whether "no active verification" should be a 200 with empty state rather than a 400.

**Acceptance:** Decision recorded; if it's a bug, status returns 200/empty for users with no verification.`,
  },
  {
    key: 'P3-1',
    priority: 4,
    title: 'Dev-env: fold reference seed (CSI/skills) into reset; fix stale README seed creds',
    body: `**Process gap surfaced by the audit.**

1. On fresh local DBs, \`data.masterformat\` (CSI) and \`core.skills\` are empty because \`pnpm supa:seed\` (TS reference data) is **not** part of \`pnpm supa db reset\`. So skill search returns empty locally even once the route is fixed. (Worked around during the audit by running \`scripts/seed-csi.ts\` → 8955 codes.)
2. \`packages/supabase/seeds/README.md\` documents \`SeedUser123!\` / \`TestUser123!\` and \`testuser1@example.com\`, but the actual seed password is \`password123\` and those users don't exist in the seeded DB.

**Fix:** Either run reference seed automatically on reset (or document it as a required step), and correct the README credentials.

**Acceptance:** A fresh \`supa db reset\` yields a working skill search; README creds match reality.`,
  },
]

async function resolveTeamId() {
  const data = await gql(`query { teams(filter: { key: { eq: "SC" } }) { nodes { id } } }`)
  return data.teams.nodes[0].id
}

async function resolveStateId(name) {
  const data = await gql(
    `query($n: String!) { workflowStates(filter: { name: { eq: $n } }) { nodes { id team { key } } } }`,
    { n: name },
  )
  return data.workflowStates.nodes.find((s) => s.team.key === 'SC').id
}

async function resolveLabelId(name) {
  const data = await gql(
    `query($n: String!) { issueLabels(filter: { name: { eq: $n } }) { nodes { id team { key } } } }`,
    { n: name },
  )
  const found = data.issueLabels.nodes.find((l) => !l.team || l.team.key === 'SC')
  if (found) return found.id
  if (DRY) return `[would-create:${name}]`
  const teamId = await resolveTeamId()
  const create = await gql(
    `mutation($input: IssueLabelCreateInput!) { issueLabelCreate(input: $input) { issueLabel { id } } }`,
    { input: { name, teamId } },
  )
  return create.issueLabelCreate.issueLabel.id
}

async function existingTitles() {
  // Snapshot open SC issue titles so re-runs don't duplicate.
  const data = await gql(
    `query { issues(first: 250, filter: { team: { key: { eq: "SC" } }, state: { type: { nin: ["completed","canceled"] } } }) { nodes { title } } }`,
  )
  return new Set(data.issues.nodes.map((n) => n.title))
}

async function main() {
  console.log(`  ${DRY ? 'DRY RUN' : 'EXECUTING'} — ${FINDINGS.length} profile v1.7.0 tickets\n`)
  const [teamId, stateId, labelId, seen] = await Promise.all([
    resolveTeamId(),
    resolveStateId('Todo'),
    resolveLabelId(RELEASE_LABEL),
    existingTitles(),
  ])

  const created = []
  for (const f of FINDINGS) {
    if (seen.has(f.title)) {
      console.log(`  ⏭  ${f.key} — already exists, skipping`)
      continue
    }
    console.log(`  ${f.key} (P${f.priority}) — ${f.title}`)
    if (DRY) continue
    const result = await gql(
      `mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { identifier url } } }`,
      {
        input: {
          teamId,
          title: f.title,
          description: f.body,
          stateId,
          labelIds: labelId.startsWith?.('[would-create') ? [] : [labelId],
          priority: f.priority,
        },
      },
    )
    if (result.issueCreate.success) {
      const issue = result.issueCreate.issue
      console.log(`     → ${issue.identifier} ${issue.url}`)
      created.push({ key: f.key, ...issue })
    } else {
      console.error(`     ✗ create failed`)
    }
  }

  console.log(`\n  ${DRY ? 'Would create' : 'Created'} ${DRY ? FINDINGS.length - [...seen].filter((t) => FINDINGS.some((f) => f.title === t)).length : created.length} tickets.`)
  if (created.length > 0) {
    console.log('\n  Mapping:')
    for (const c of created) console.log(`    ${c.key} → ${c.identifier}  ${c.url}`)
  }
}

main().catch((err) => { console.error(`✗ ${err.message}`); process.exit(1) })
