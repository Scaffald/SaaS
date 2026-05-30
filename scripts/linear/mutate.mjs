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
const V17_SHIPPED_COMMENT = `**Backlog hygiene — 2026-05-30**

This ticket's fix landed on \`main\` as part of the v1.7.0 profile-API repair cluster:

- SC-90 / SC-91 / SC-92 / SC-93 → [#311](https://github.com/Unicorn/UNI-Construct/pull/311) (\`22abc3b3c\`)
- SC-94 / SC-95 / SC-96 → [#312](https://github.com/Unicorn/UNI-Construct/pull/312) (\`cdada8c01\`)
- SC-97 / SC-99 → [#313](https://github.com/Unicorn/UNI-Construct/pull/313) (\`4c5af3ee6\`)

Moving to **In Github** to match reality. Will be promoted to **In TestFlight** when the \`app-v1.7.0\` cut ships.`

const V18_SCOPE_COMMENT = `**Release planning — 2026-05-30**

Labeling for **v1.8.0 — worker-flow repair sweep**. v1.8.0 is the audit-then-fix release led by @boris:

- **Audit phase:** SC-18, SC-19, SC-20, SC-21 produce findings.
- **Consolidation:** SC-22 rolls findings up; fix tickets created from there inherit \`v1.8.0\`.
- **Scope gate:** SC-13 (mobile-first worker MVP scope doc) defines what's in vs out.

Child fix tickets filed from this audit should also be labeled \`v1.8.0\` so \`pnpm release:promote 1.8.0\` picks them up cleanly.`

// ---------- Plan ----------
// Each step has: kind + params. Resolved at runtime against fetched IDs.
const PLAN = [
  // ───── Phase 1 — state-sync v1.7.0 (PRs #311/#312/#313 already merged) ─────
  // SC-90..SC-99 (no SC-98) currently sit in Todo despite their fixes being on
  // main. Move them to In Github so release:promote 1.7.0 can pick them up
  // once the app-v1.7.0 TestFlight cut ships.
  { kind: 'comment', issue: 'SC-90', body: V17_SHIPPED_COMMENT },
  { kind: 'move-state', issue: 'SC-90', toState: 'In Github' },
  { kind: 'comment', issue: 'SC-91', body: V17_SHIPPED_COMMENT },
  { kind: 'move-state', issue: 'SC-91', toState: 'In Github' },
  { kind: 'comment', issue: 'SC-92', body: V17_SHIPPED_COMMENT },
  { kind: 'move-state', issue: 'SC-92', toState: 'In Github' },
  { kind: 'comment', issue: 'SC-93', body: V17_SHIPPED_COMMENT },
  { kind: 'move-state', issue: 'SC-93', toState: 'In Github' },
  { kind: 'comment', issue: 'SC-94', body: V17_SHIPPED_COMMENT },
  { kind: 'move-state', issue: 'SC-94', toState: 'In Github' },
  { kind: 'comment', issue: 'SC-95', body: V17_SHIPPED_COMMENT },
  { kind: 'move-state', issue: 'SC-95', toState: 'In Github' },
  { kind: 'comment', issue: 'SC-96', body: V17_SHIPPED_COMMENT },
  { kind: 'move-state', issue: 'SC-96', toState: 'In Github' },
  { kind: 'comment', issue: 'SC-97', body: V17_SHIPPED_COMMENT },
  { kind: 'move-state', issue: 'SC-97', toState: 'In Github' },
  { kind: 'comment', issue: 'SC-99', body: V17_SHIPPED_COMMENT },
  { kind: 'move-state', issue: 'SC-99', toState: 'In Github' },

  // ───── Phase 2 — define v1.8.0 as the worker-flow audit-then-fix release ─────
  // Boris's audit cluster (SC-18..22) + SC-13 scope doc get the v1.8.0 label.
  // SC-23 (web→mobile mapping) stays unlabeled — it's prep for later releases,
  // not a v1.8.0 deliverable.
  { kind: 'add-label', issue: 'SC-13', label: 'v1.8.0' },
  { kind: 'add-label', issue: 'SC-18', label: 'v1.8.0' },
  { kind: 'add-label', issue: 'SC-19', label: 'v1.8.0' },
  { kind: 'add-label', issue: 'SC-20', label: 'v1.8.0' },
  { kind: 'add-label', issue: 'SC-21', label: 'v1.8.0' },
  { kind: 'add-label', issue: 'SC-22', label: 'v1.8.0' },

  // Pin the release intent in a comment on the consolidation ticket — SC-22 is
  // where the audit outputs converge, so it's the natural home for the v1.8.0
  // scope note.
  { kind: 'comment', issue: 'SC-22', body: V18_SCOPE_COMMENT },
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
