#!/usr/bin/env node
/**
 * Generic Linear mutation runner — applies a list of mutations
 * (comments, state moves, label adds, issue creates) in one pass.
 *
 * Mutations are defined inline below (`PLAN`). Pass --dry-run to preview
 * without making any changes.
 *
 * Usage:
 *   node scripts/linear/mutate.mjs --dry-run
 *   node scripts/linear/mutate.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../..')
const LINEAR_API = 'https://api.linear.app/graphql'

function loadKey() {
  if (process.env.LINEAR_API_KEY) return process.env.LINEAR_API_KEY
  for (const path of [
    resolve(REPO_ROOT, '.env.production'),
    '/Users/clay/Development/UNI-Construct/.env.production',
  ]) {
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

// ---------- Coordination comment text ----------
const AUDIT_COORDINATION_COMMENT = `**Coordination — 2026-05-26**

The mobile team is running a parallel **iOS-viewport audit** as part of the v1.6.0 plan ([handoff doc](https://github.com/Unicorn/UNI-Construct/blob/main/docs/agents/handoffs/2026-05-26-v1.6.0-plan.md)). It will sweep every route in \`apps/scaffald/app/\` at 390×844 (iPhone 14) via Playwright, then verify the top offenders on the iOS simulator.

This audit is **complementary to this ticket**, not a replacement. It catches layout/UX issues a manual flow review can miss (and vice versa). The output feeds directly into **SC-22** as machine-captured input alongside your manual notes.

No action requested from you — flagging so we don't duplicate effort. Findings will land in \`docs/agents/audits/2026-05-26-ui-audit/findings.md\` and be filed as Tasks under Unicorn → Dogfood Bugs (Open).`

const HYGIENE_COMMENT_SHIPPED = (release) => `**Backlog hygiene — 2026-05-26**

This ticket has been shipped as part of \`app-${release}\` and is live on TestFlight. Moving to **Done** — feel free to reopen if there's outstanding work.

Audit trail: see \`scripts/linear-backlog.mjs\` snapshot + git tag \`app-${release}\`.`

// ---------- Plan ----------
// Each step has: kind + params. Resolved at runtime against fetched IDs.
const PLAN = [
  // 1. Coordination comments on Boris's audit cluster + SC-23 mapping
  { kind: 'comment', issue: 'SC-18', body: AUDIT_COORDINATION_COMMENT },
  { kind: 'comment', issue: 'SC-19', body: AUDIT_COORDINATION_COMMENT },
  { kind: 'comment', issue: 'SC-20', body: AUDIT_COORDINATION_COMMENT },
  { kind: 'comment', issue: 'SC-21', body: AUDIT_COORDINATION_COMMENT },
  { kind: 'comment', issue: 'SC-22', body: AUDIT_COORDINATION_COMMENT },
  { kind: 'comment', issue: 'SC-23', body: AUDIT_COORDINATION_COMMENT },

  // 2. Move SC-18 from Triage → Todo (active scope, not just a triage idea)
  { kind: 'move-state', issue: 'SC-18', toState: 'Todo' },

  // 3. Label SC-74 with v1.6.0 (drawer bugs — clear v1.6.0 work)
  { kind: 'add-label', issue: 'SC-74', label: 'v1.6.0' },

  // 4. Close shipped v1.3.0 stragglers (PRs all landed)
  { kind: 'comment', issue: 'SC-37', body: HYGIENE_COMMENT_SHIPPED('v1.3.0') },
  { kind: 'move-state', issue: 'SC-37', toState: 'Done' },
  { kind: 'comment', issue: 'SC-40', body: HYGIENE_COMMENT_SHIPPED('v1.3.0') },
  { kind: 'move-state', issue: 'SC-40', toState: 'Done' },
  { kind: 'comment', issue: 'SC-65', body: HYGIENE_COMMENT_SHIPPED('v1.3.0') },
  { kind: 'move-state', issue: 'SC-65', toState: 'Done' },
  { kind: 'comment', issue: 'SC-66', body: HYGIENE_COMMENT_SHIPPED('v1.3.0') },
  { kind: 'move-state', issue: 'SC-66', toState: 'Done' },

  // 5. Close shipped v1.1.0 In TestFlight stragglers — only the ones confirmed
  //    in git log app-v1.0.1..app-v1.1.0:
  //    SC-54, SC-56, SC-57, SC-58 → #254
  //    SC-59 → #258
  //    SC-53 (meta polish), SC-55 (Mapbox) — held back for manual review
  { kind: 'comment', issue: 'SC-54', body: HYGIENE_COMMENT_SHIPPED('v1.1.0') },
  { kind: 'move-state', issue: 'SC-54', toState: 'Done' },
  { kind: 'comment', issue: 'SC-56', body: HYGIENE_COMMENT_SHIPPED('v1.1.0') },
  { kind: 'move-state', issue: 'SC-56', toState: 'Done' },
  { kind: 'comment', issue: 'SC-57', body: HYGIENE_COMMENT_SHIPPED('v1.1.0') },
  { kind: 'move-state', issue: 'SC-57', toState: 'Done' },
  { kind: 'comment', issue: 'SC-58', body: HYGIENE_COMMENT_SHIPPED('v1.1.0') },
  { kind: 'move-state', issue: 'SC-58', toState: 'Done' },
  { kind: 'comment', issue: 'SC-59', body: HYGIENE_COMMENT_SHIPPED('v1.1.0') },
  { kind: 'move-state', issue: 'SC-59', toState: 'Done' },

  // 6. Create reminder tickets for Android + iPad audit (parked in Backlog)
  {
    kind: 'create-issue',
    title: 'Audit: Android viewport + native parity (post v1.6.0)',
    description: `Once v1.6.0 (iOS-viewport audit + cleanup) ships, run the equivalent sweep on Android.

**Scope:**
* Playwright sweep at common Android viewports (360×800 Pixel 7, 412×915 Pixel 7 Pro)
* Real-device or emulator pass on top 10 offenders
* Verify safe-area handling, back-gesture behavior, status-bar contrast, soft-keyboard interaction

**Inputs:**
* iOS audit findings in \`docs/agents/audits/2026-05-26-ui-audit/findings.md\` — likely many of the same bugs
* v1.6.0 release notes

**Filed:** 2026-05-26 as reminder during v1.6.0 plan.`,
    priority: 3, // medium
    state: 'Triage',
  },
  {
    kind: 'create-issue',
    title: 'Audit: iPad viewport + tablet layouts (post v1.6.0)',
    description: `Once v1.6.0 ships, run a second-viewport audit at iPad sizes to catch tablet-specific layout breaks.

**Scope:**
* Playwright sweep at 768×1024 (iPad portrait) and 1024×768 (iPad landscape)
* Real iPad simulator pass on top offenders
* Check split-view / multitasking behavior
* Validate that content doesn't just stretch — tablet-appropriate layouts where it matters

**Inputs:**
* iOS audit findings in \`docs/agents/audits/2026-05-26-ui-audit/findings.md\`
* v1.6.0 release notes

**Filed:** 2026-05-26 as reminder during v1.6.0 plan.`,
    priority: 4, // low
    state: 'Triage',
  },
]

// ---------- Resolution ----------
async function resolveIssueId(identifier) {
  const data = await gql(
    `query($id: String!) { issue(id: $id) { id identifier state { name } } }`,
    { id: identifier },
  )
  return data.issue
}

async function resolveStateId(stateName) {
  const data = await gql(
    `query($n: String!) { workflowStates(filter: { name: { eq: $n } }) { nodes { id name team { key } } } }`,
    { n: stateName },
  )
  const node = data.workflowStates.nodes.find((s) => s.team.key === 'SC')
  if (!node) throw new Error(`State "${stateName}" not found on team SC`)
  return node.id
}

async function resolveLabelId(labelName) {
  const data = await gql(
    `query($n: String!) { issueLabels(filter: { name: { eq: $n } }) { nodes { id name team { key } } } }`,
    { n: labelName },
  )
  const node = data.issueLabels.nodes.find((l) => !l.team || l.team.key === 'SC')
  if (node) return node.id
  // Create it if missing.
  if (DRY) return `[would-create-label:${labelName}]`
  const teamData = await gql(`query { teams(filter: { key: { eq: "SC" } }) { nodes { id } } }`)
  const teamId = teamData.teams.nodes[0].id
  const create = await gql(
    `mutation($input: IssueLabelCreateInput!) { issueLabelCreate(input: $input) { issueLabel { id } } }`,
    { input: { name: labelName, teamId } },
  )
  return create.issueLabelCreate.issueLabel.id
}

async function resolveTeamId() {
  const data = await gql(`query { teams(filter: { key: { eq: "SC" } }) { nodes { id } } }`)
  return data.teams.nodes[0].id
}

// ---------- Execution ----------
async function exec(step) {
  if (step.kind === 'comment') {
    const issue = await resolveIssueId(step.issue)
    console.log(`  💬 comment on ${step.issue} (${issue?.state.name})`)
    if (DRY) return
    await gql(
      `mutation($input: CommentCreateInput!) { commentCreate(input: $input) { success } }`,
      { input: { issueId: issue.id, body: step.body } },
    )
  } else if (step.kind === 'move-state') {
    const [issue, stateId] = await Promise.all([
      resolveIssueId(step.issue),
      resolveStateId(step.toState),
    ])
    console.log(`  ➡  move ${step.issue}: ${issue.state.name} → ${step.toState}`)
    if (DRY) return
    await gql(
      `mutation($id: String!, $input: IssueUpdateInput!) { issueUpdate(id: $id, input: $input) { success } }`,
      { id: issue.id, input: { stateId } },
    )
  } else if (step.kind === 'add-label') {
    const [issue, labelId] = await Promise.all([
      resolveIssueId(step.issue),
      resolveLabelId(step.label),
    ])
    console.log(`  🏷  label ${step.issue} += ${step.label}`)
    if (DRY) return
    await gql(
      `mutation($id: String!, $labelId: String!) { issueAddLabel(id: $id, labelId: $labelId) { success } }`,
      { id: issue.id, labelId },
    )
  } else if (step.kind === 'create-issue') {
    const [teamId, stateId] = await Promise.all([
      resolveTeamId(),
      resolveStateId(step.state),
    ])
    console.log(`  ✨ create: "${step.title}" (${step.state})`)
    if (DRY) return
    const result = await gql(
      `mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { identifier url } } }`,
      {
        input: {
          teamId,
          title: step.title,
          description: step.description,
          priority: step.priority,
          stateId,
        },
      },
    )
    console.log(`     → ${result.issueCreate.issue.identifier} ${result.issueCreate.issue.url}`)
  } else {
    throw new Error(`unknown kind: ${step.kind}`)
  }
}

async function main() {
  console.log(`  ${DRY ? 'DRY RUN — no changes' : 'EXECUTING — making changes to Linear'}`)
  console.log(`  ${PLAN.length} steps queued\n`)
  let ok = 0, failed = 0
  for (const step of PLAN) {
    try {
      await exec(step)
      ok++
    } catch (err) {
      console.error(`  ✗ ${step.kind} ${step.issue || step.title}: ${err.message}`)
      failed++
    }
  }
  console.log(`\n  ${ok} ok, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => { console.error(`✗ ${err.message}`); process.exit(1) })
