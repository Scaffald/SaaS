#!/usr/bin/env node
/**
 * Fetch full details for one or more Linear issues by identifier.
 *
 * Usage:
 *   node scripts/linear/issue.mjs SC-19 SC-20 SC-21
 *   node scripts/linear/issue.mjs SC-19 --json
 */

import { readFileSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = resolve(__dirname, '../..')
const LINEAR_API = 'https://api.linear.app/graphql'

function loadKey() {
  if (process.env.LINEAR_API_KEY) return process.env.LINEAR_API_KEY
  const candidates = [
    resolve(REPO_ROOT, '.env.production'),
    '/Users/clay/Development/UNI-Construct/.env.production',
  ]
  for (const path of candidates) {
    if (!existsSync(path)) continue
    const match = readFileSync(path, 'utf8').match(/^LINEAR_API_KEY=(.+)$/m)
    if (match) return match[1].trim().replace(/^["']|["']$/g, '')
  }
  return null
}

const API_KEY = loadKey()
if (!API_KEY) {
  console.error('✗ LINEAR_API_KEY not found')
  process.exit(1)
}

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const ids = args.filter((a) => !a.startsWith('--'))

if (ids.length === 0) {
  console.error('usage: linear-issue.mjs <SC-XX> [SC-YY ...] [--json]')
  process.exit(2)
}

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

const Q = `
  query Issue($id: String!) {
    issue(id: $id) {
      identifier
      title
      url
      description
      priority
      priorityLabel
      state { name type }
      labels { nodes { name } }
      assignee { displayName }
      createdAt
      updatedAt
      comments(first: 20) {
        nodes { body user { displayName } createdAt }
      }
    }
  }
`

const results = []
for (const id of ids) {
  try {
    const data = await gql(Q, { id })
    results.push(data.issue)
  } catch (err) {
    console.error(`✗ ${id}: ${err.message}`)
  }
}

if (asJson) {
  console.log(JSON.stringify(results, null, 2))
} else {
  for (const i of results) {
    console.log(`\n=== ${i.identifier} — ${i.title} ===`)
    console.log(`State: ${i.state.name}  Priority: ${i.priorityLabel}  Assignee: ${i.assignee?.displayName ?? '—'}`)
    console.log(`Labels: ${i.labels.nodes.map((l) => l.name).join(', ') || '—'}`)
    console.log(`URL: ${i.url}`)
    console.log(`\n--- description ---\n${i.description || '(empty)'}`)
    if (i.comments.nodes.length) {
      console.log(`\n--- comments (${i.comments.nodes.length}) ---`)
      for (const c of i.comments.nodes) {
        console.log(`[${c.user?.displayName ?? '?'} @ ${c.createdAt}]`)
        console.log(c.body)
        console.log('---')
      }
    }
  }
}
