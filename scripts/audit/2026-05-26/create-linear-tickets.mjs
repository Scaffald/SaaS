#!/usr/bin/env node
/**
 * Create v1.6.0 Linear tickets from the 2026-05-26 UI audit findings.
 *
 * Creates 13 tickets (8 blockers + 5 polish). SC-74 already exists for the
 * profile drawer bugs and is already labeled v1.6.0 (from Phase A). Each
 * ticket links back to the in-product Task ID for cross-reference.
 *
 * Usage:
 *   node scripts/audit/2026-05-26/create-linear-tickets.mjs --dry-run
 *   node scripts/audit/2026-05-26/create-linear-tickets.mjs
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../../..')
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

// Task IDs from file-findings.ts output. Used to backlink.
const TASK_IDS = {
  B1: 'dc793ac2-1131-4fc7-bdb6-2762b0db3791',
  B2: '2ec00492-6781-42a5-8184-c8adb9978b3d',
  B3: '8c1385a0-ef3a-4de1-bebf-9346d722ca55',
  B4: '5d086fe4-069a-431f-9e2f-ff50d625c75a',
  B5: '8f90f923-9590-455f-9b9a-605ccca1b803',
  B6: '889b3d9f-7f4c-459d-9e65-ec36948f8097',
  B7: 'dd8fcd87-9080-42a2-8611-0fc91e2a7a68',
  B8: 'b9aa4591-e19f-428c-93a9-9f7bb0b75c8e',
  P1: 'e0f6a541-c33a-4600-98ee-7ec0967f6c23',
  P2: 'f7bc39d6-4489-4d8a-8333-191bbe3976b4',
  P3: '48a0f059-b688-42a1-b72a-f5d02192580e',
  P4: '8b409d1e-b3d5-491f-8490-e3de205dba03',
  P5: '8bf36a6f-25ed-4591-8c51-efc1c7386730',
}

const FINDING_TITLES = {
  B1: 'Fix /onboarding stuck on Loading…',
  B2: 'Fix /communities/reputation stuck on Loading…',
  B3: 'Fix /profile/resume stuck on Loading… (regression from SC-40)',
  B4: '/jobs: show empty state instead of persistent skeletons',
  B5: '/employers: show empty state instead of persistent skeletons',
  B6: 'Cookie banner blocks welcome CTAs on iPhone viewport',
  B7: 'Fix cookie banner typo: "learn.to learn more."',
  B8: '/profile overview body: empty state instead of stuck skeletons',
  P1: 'Dashboard Communities section: empty state instead of stuck skeleton',
  P2: 'Dashboard "Profile Strength: 0%" regression for seeded accounts',
  P3: 'Unify avatar source on dashboard (header vs profile card)',
  P4: 'Fix "Assessments" button truncation on dashboard',
  P5: 'Add safe-area bottom padding so tab bar does not clip lists',
}

const FINDING_PRIORITY = {
  // 1=urgent, 2=high, 3=medium, 4=low
  B1: 1, B2: 1, B3: 1, B4: 1, B5: 1, B6: 1, B7: 2, B8: 1,
  P1: 2, P2: 2, P3: 3, P4: 2, P5: 2,
}

function descFor(id) {
  return `Surfaced by the 2026-05-26 iOS-viewport UI audit.

- Finding: **${id}** (see [findings.md](https://github.com/Unicorn/UNI-Construct/blob/main/docs/agents/audits/2026-05-26-ui-audit/findings.md#${id.toLowerCase()}))
- In-product Task: \`${TASK_IDS[id]}\` (Unicorn org → Dogfood Bugs (Open))
- Screenshots: [\`docs/agents/audits/2026-05-26-ui-audit/\`](https://github.com/Unicorn/UNI-Construct/tree/main/docs/agents/audits/2026-05-26-ui-audit)

Acceptance: defined by the corresponding entry in \`findings.md\`. Close the Task when this lands.`
}

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

async function main() {
  console.log(`  ${DRY ? 'DRY RUN' : 'EXECUTING'} — creating ${Object.keys(FINDING_TITLES).length} v1.6.0 tickets\n`)
  const [teamId, stateId, labelId] = await Promise.all([
    resolveTeamId(),
    resolveStateId('Todo'),
    resolveLabelId('v1.6.0'),
  ])

  const created = []
  for (const [id, title] of Object.entries(FINDING_TITLES)) {
    console.log(`  ${id} — ${title}`)
    if (DRY) continue
    const result = await gql(
      `mutation($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { identifier url } } }`,
      {
        input: {
          teamId,
          title,
          description: descFor(id),
          stateId,
          labelIds: [labelId],
          priority: FINDING_PRIORITY[id],
        },
      },
    )
    if (result.issueCreate.success) {
      const issue = result.issueCreate.issue
      console.log(`     → ${issue.identifier} ${issue.url}`)
      created.push({ findingId: id, ...issue })
    } else {
      console.error(`     ✗ create failed`)
    }
  }

  console.log(`\n  Created ${created.length} tickets.`)
  if (created.length > 0) {
    console.log('\n  Mapping:')
    for (const c of created) console.log(`    ${c.findingId} → ${c.identifier}`)
  }
}

main().catch((err) => { console.error(`✗ ${err.message}`); process.exit(1) })
