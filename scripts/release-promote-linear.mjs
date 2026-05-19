#!/usr/bin/env node
/**
 * Bulk-promote Linear issues for a release.
 *
 * Finds every issue with label `vX.Y.Z` currently in the `In Github` workflow
 * state and moves it to `In TestFlight`. Run this after a TestFlight build
 * containing the release goes live.
 *
 * Usage:
 *   LINEAR_API_KEY=lin_api_xxx pnpm release:promote 1.1.0
 *
 * The script is intentionally simple: pure Node, builtin fetch, no deps.
 * See docs/agents/RELEASE-PROCESS.md for the full flow.
 */

const LINEAR_API = 'https://api.linear.app/graphql'

const args = process.argv.slice(2)
const VERSION = args[0]
const DRY_RUN = args.includes('--dry-run')

if (!VERSION || !/^[0-9]+\.[0-9]+\.[0-9]+$/.test(VERSION)) {
  console.error('usage: scripts/release-promote-linear.mjs <X.Y.Z> [--dry-run]')
  process.exit(2)
}

const LABEL = `v${VERSION}`
const FROM_STATE = 'In Github'
const TO_STATE = 'In TestFlight'

const API_KEY = process.env.LINEAR_API_KEY
if (!API_KEY) {
  console.error('✗ LINEAR_API_KEY env var is required.')
  console.error('  Get a personal API key at https://linear.app/settings/account/security')
  process.exit(1)
}

async function gql(query, variables) {
  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) {
    throw new Error(`Linear API ${res.status}: ${await res.text()}`)
  }
  const json = await res.json()
  if (json.errors) {
    throw new Error(`GraphQL error: ${JSON.stringify(json.errors)}`)
  }
  return json.data
}

// Resolve the destination state id once (and verify both source + dest exist).
const STATES_Q = `
  query States {
    workflowStates(filter: { name: { in: ["${FROM_STATE}", "${TO_STATE}"] } }) {
      nodes { id name team { key } }
    }
  }
`

// Find issues matching the label + source state. Scoped to the Scaffald team
// implicitly via the team-scoped label, but we double-check via state lookup.
const ISSUES_Q = `
  query IssuesToPromote($label: String!, $stateName: String!) {
    issues(
      filter: {
        labels: { name: { eq: $label } }
        state: { name: { eq: $stateName } }
      }
      first: 100
    ) {
      nodes {
        id
        identifier
        title
        url
        state { name }
      }
    }
  }
`

const UPDATE_M = `
  mutation MoveIssue($id: String!, $stateId: String!) {
    issueUpdate(id: $id, input: { stateId: $stateId }) {
      success
      issue { identifier state { name } }
    }
  }
`

async function main() {
  console.log(`  Promoting v${VERSION} issues: ${FROM_STATE} → ${TO_STATE}\n`)

  const statesData = await gql(STATES_Q)
  const states = statesData.workflowStates.nodes
  const toState = states.find((s) => s.name === TO_STATE && s.team.key === 'SC')
  const fromState = states.find((s) => s.name === FROM_STATE && s.team.key === 'SC')
  if (!toState) {
    console.error(`✗ Could not find workflow state "${TO_STATE}" on team SC.`)
    console.error('  Add it via Linear team settings → Workflow.')
    process.exit(1)
  }
  if (!fromState) {
    console.error(`✗ Could not find workflow state "${FROM_STATE}" on team SC.`)
    process.exit(1)
  }

  const { issues } = await gql(ISSUES_Q, { label: LABEL, stateName: FROM_STATE })
  const targets = issues.nodes

  if (targets.length === 0) {
    console.log(`  No issues found with label ${LABEL} in state "${FROM_STATE}".`)
    console.log('  Nothing to do.')
    return
  }

  console.log(`  Found ${targets.length} issue${targets.length === 1 ? '' : 's'} to promote:`)
  for (const issue of targets) {
    console.log(`    ${issue.identifier} — ${issue.title}`)
  }
  console.log()

  if (DRY_RUN) {
    console.log('  --dry-run: skipping updates.')
    return
  }

  let ok = 0
  let failed = 0
  for (const issue of targets) {
    try {
      const data = await gql(UPDATE_M, { id: issue.id, stateId: toState.id })
      if (data.issueUpdate.success) {
        ok++
        console.log(`    ✓ ${issue.identifier} → ${TO_STATE}`)
      } else {
        failed++
        console.log(`    ✗ ${issue.identifier} update returned success=false`)
      }
    } catch (err) {
      failed++
      console.log(`    ✗ ${issue.identifier}: ${err.message}`)
    }
  }

  console.log(`\n  Done. ${ok} promoted, ${failed} failed.`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(`✗ ${err.message}`)
  process.exit(1)
})
