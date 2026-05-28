#!/usr/bin/env node
/**
 * Pull a snapshot of the Scaffald (SC) Linear backlog.
 *
 * Lists every issue NOT in a completed or canceled state, grouped by
 * workflow state. Output is plain text by default; pass --json for a
 * machine-readable dump, or --md for a markdown report suitable for
 * pasting into docs/agents/audits/.
 *
 * Usage:
 *   LINEAR_API_KEY=lin_api_xxx node scripts/linear/backlog.mjs
 *   node scripts/linear/backlog.mjs --md > docs/agents/audits/2026-05-26-linear-backlog.md
 *
 * The key is auto-loaded from .env.production if present (matches the
 * pattern used by release:promote).
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../..')
const LINEAR_API = 'https://api.linear.app/graphql'

// Auto-load LINEAR_API_KEY from .env.production (parent worktree or repo root).
function loadKey() {
  if (process.env.LINEAR_API_KEY) return process.env.LINEAR_API_KEY
  const candidates = [
    resolve(REPO_ROOT, '.env.production'),
    resolve(REPO_ROOT, '../../../.env.production'),
    '/Users/clay/Development/UNI-Construct/.env.production',
  ]
  for (const path of candidates) {
    if (!existsSync(path)) continue
    const contents = readFileSync(path, 'utf8')
    const match = contents.match(/^LINEAR_API_KEY=(.+)$/m)
    if (match) return match[1].trim().replace(/^["']|["']$/g, '')
  }
  return null
}

const API_KEY = loadKey()
if (!API_KEY) {
  console.error('✗ LINEAR_API_KEY not found in env or .env.production')
  process.exit(1)
}

const args = process.argv.slice(2)
const FORMAT = args.includes('--json') ? 'json' : args.includes('--md') ? 'md' : 'text'

async function gql(query, variables) {
  const res = await fetch(LINEAR_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: API_KEY },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Linear API ${res.status}: ${await res.text()}`)
  const json = await res.json()
  if (json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors)}`)
  return json.data
}

// Page through all SC team issues not in completed/canceled states.
const ISSUES_Q = `
  query Backlog($after: String) {
    issues(
      first: 100
      after: $after
      filter: {
        team: { key: { eq: "SC" } }
        state: { type: { nin: ["completed", "canceled"] } }
      }
      orderBy: updatedAt
    ) {
      pageInfo { hasNextPage endCursor }
      nodes {
        identifier
        title
        url
        priority
        priorityLabel
        estimate
        updatedAt
        createdAt
        state { name type }
        labels { nodes { name } }
        assignee { name displayName }
        project { name }
        parent { identifier }
      }
    }
  }
`

async function fetchAll() {
  const all = []
  let after = null
  while (true) {
    const data = await gql(ISSUES_Q, { after })
    all.push(...data.issues.nodes)
    if (!data.issues.pageInfo.hasNextPage) break
    after = data.issues.pageInfo.endCursor
  }
  return all
}

function bucketByState(issues) {
  const buckets = new Map()
  for (const i of issues) {
    const key = i.state.name
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(i)
  }
  // Stable order: Triage → Backlog → Todo → In Progress → In Review → In Github → In TestFlight → others
  const order = ['Triage', 'Backlog', 'Todo', 'In Progress', 'In Review', 'In Github', 'In TestFlight']
  return [...buckets.entries()].sort(([a], [b]) => {
    const ai = order.indexOf(a)
    const bi = order.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

function versionLabels(issue) {
  return issue.labels.nodes
    .map((l) => l.name)
    .filter((n) => /^v\d+\.\d+\.\d+$/.test(n))
}

function nonVersionLabels(issue) {
  return issue.labels.nodes
    .map((l) => l.name)
    .filter((n) => !/^v\d+\.\d+\.\d+$/.test(n))
}

function priorityIcon(p) {
  // Linear: 0 none, 1 urgent, 2 high, 3 medium, 4 low
  return ['—', '🔥', '🔺', '🔹', '🔸'][p] ?? '—'
}

function renderText(issues) {
  const grouped = bucketByState(issues)
  const lines = []
  lines.push(`Scaffald (SC) backlog — ${issues.length} open issues\n`)
  for (const [state, items] of grouped) {
    lines.push(`\n=== ${state} (${items.length}) ===`)
    for (const i of items) {
      const v = versionLabels(i)
      const tag = v.length ? ` [${v.join(',')}]` : ''
      const owner = i.assignee ? ` @${i.assignee.displayName}` : ''
      lines.push(`  ${priorityIcon(i.priority)} ${i.identifier}${tag} — ${i.title}${owner}`)
    }
  }
  return lines.join('\n')
}

function renderMarkdown(issues) {
  const grouped = bucketByState(issues)
  const today = new Date().toISOString().slice(0, 10)
  const lines = []
  lines.push(`# Linear backlog snapshot — ${today}`)
  lines.push('')
  lines.push(`Pulled via \`scripts/linear/backlog.mjs\`. Team: **SC** (Scaffald).`)
  lines.push(`Total open issues (not Done/Cancelled): **${issues.length}**.`)
  lines.push('')

  // Summary table by state.
  lines.push('## By state')
  lines.push('')
  lines.push('| State | Count |')
  lines.push('| --- | --- |')
  for (const [state, items] of grouped) {
    lines.push(`| ${state} | ${items.length} |`)
  }
  lines.push('')

  // Summary by version label.
  const byVersion = new Map()
  let unlabeled = 0
  for (const i of issues) {
    const vs = versionLabels(i)
    if (vs.length === 0) unlabeled++
    for (const v of vs) {
      if (!byVersion.has(v)) byVersion.set(v, 0)
      byVersion.set(v, byVersion.get(v) + 1)
    }
  }
  if (byVersion.size > 0 || unlabeled > 0) {
    lines.push('## By version label')
    lines.push('')
    lines.push('| Label | Count |')
    lines.push('| --- | --- |')
    const sortedVersions = [...byVersion.entries()].sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true }),
    )
    for (const [v, n] of sortedVersions) lines.push(`| \`${v}\` | ${n} |`)
    lines.push(`| _unlabeled_ | ${unlabeled} |`)
    lines.push('')
  }

  // Per-state detail.
  for (const [state, items] of grouped) {
    lines.push(`## ${state} (${items.length})`)
    lines.push('')
    for (const i of items) {
      const v = versionLabels(i)
      const tags = nonVersionLabels(i)
      const versionStr = v.length ? ` \`${v.join(', ')}\`` : ''
      const tagStr = tags.length ? ` _(${tags.join(', ')})_` : ''
      const owner = i.assignee ? ` — @${i.assignee.displayName}` : ''
      const pri = priorityIcon(i.priority)
      lines.push(`- ${pri} [${i.identifier}](${i.url})${versionStr} — ${i.title}${owner}${tagStr}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

async function main() {
  const issues = await fetchAll()
  if (FORMAT === 'json') {
    console.log(JSON.stringify(issues, null, 2))
  } else if (FORMAT === 'md') {
    console.log(renderMarkdown(issues))
  } else {
    console.log(renderText(issues))
  }
}

main().catch((err) => {
  console.error(`✗ ${err.message}`)
  process.exit(1)
})
