#!/usr/bin/env node
/**
 * Worker-flow status matrix generator (SC-22).
 *
 * Queries Linear for every [pre-audit/SC-1X] child ticket plus the v1.7.0
 * profile-API repair tickets (SC-90–SC-99), groups them by flow, mines git
 * log for shipping PR refs, and prints per-flow tables to stdout.
 *
 * Use this to refresh the data tables in STATUS-MATRIX.md whenever ticket
 * state changes (new audit work shipped, label moved, etc.).
 *
 * Usage:
 *   node --env-file=.env.production scripts/audit/2026-06-10/generate-status-matrix.mjs
 *
 * Output: stdout (markdown). Pipe to a file if you want to capture:
 *   node ... generate-status-matrix.mjs > /tmp/matrix-fresh.md
 *
 * See README.md for context.
 */

import { execSync } from 'node:child_process'

const API = 'https://api.linear.app/graphql'
const KEY = process.env.LINEAR_API_KEY
if (!KEY) {
  console.error('✗ LINEAR_API_KEY not set. Run with: node --env-file=.env.production ...')
  process.exit(1)
}

async function gql(query, variables) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: KEY },
    body: JSON.stringify({ query, variables }),
  })
  const json = await res.json()
  if (json.errors) throw new Error(JSON.stringify(json.errors))
  return json.data
}

// Find the shipping PR/commit for a given SC ticket from git log.
// Skips status/log commits (chore(linear), docs(release), docs(agents)) —
// they reference the ticket but don't ship the fix. Prefer fix/feat/chore(sdk).
const NON_SHIP_PREFIXES = /^(chore\(linear\)|docs\(release\)|docs\(agents\)|chore\(release\))/
function findShipCommit(scNum) {
  try {
    const log = execSync(
      `git log --oneline --grep="SC-${scNum}\\b"`,
      { encoding: 'utf8' },
    )
      .split('\n')
      .filter(Boolean)
    // Iterate newest→oldest; take the first non-status commit.
    const fix = log.find(line => {
      const subject = line.replace(/^\w+\s+/, '')
      return !NON_SHIP_PREFIXES.test(subject)
    })
    if (!fix) return null
    const m = fix.match(/^(\w+)\s+(.+?)(?:\s+\(#(\d+)\))?$/)
    if (!m) return null
    return { hash: m[1].slice(0, 7), title: m[2], pr: m[3] || null }
  } catch {
    return null
  }
}

// Flow classification. Anchor on the parent SC-XX referenced in the title,
// plus the explicit v1.7.0 profile-API set.
const FLOWS = [
  {
    key: 'create-job',
    parent: 'SC-18',
    title: 'Create job post (employer/admin)',
    titleContains: '[pre-audit/SC-18]',
    extra: [],
  },
  {
    key: 'apply',
    parent: 'SC-19',
    title: 'Apply to job (worker)',
    titleContains: '[pre-audit/SC-19]',
    extra: [],
  },
  {
    key: 'onboarding',
    parent: 'SC-20',
    title: 'Profile / onboarding (worker)',
    titleContains: '[pre-audit/SC-20]',
    extra: [], // profile-API repairs go in profile-api flow below
  },
  {
    key: 'certification',
    parent: 'SC-21',
    title: 'Certifications & licenses (worker)',
    titleContains: '[pre-audit/SC-21]',
    extra: [],
  },
  {
    key: 'profile-api',
    parent: null,
    title: 'Profile API surface (REST migration repair)',
    titleContains: null,
    // SC-90..SC-99 are the v1.7.0 profile-API repair set
    extra: ['SC-90', 'SC-91', 'SC-92', 'SC-93', 'SC-94', 'SC-95', 'SC-96', 'SC-97', 'SC-99'],
  },
]

const ISSUES_Q = `
  query AuditChildren {
    pre18: issues(filter:{team:{key:{eq:"SC"}},title:{contains:"[pre-audit/SC-18]"}}){
      nodes{identifier title state{name} priority labels{nodes{name}} url}
    }
    pre19: issues(filter:{team:{key:{eq:"SC"}},title:{contains:"[pre-audit/SC-19]"}}){
      nodes{identifier title state{name} priority labels{nodes{name}} url}
    }
    pre20: issues(filter:{team:{key:{eq:"SC"}},title:{contains:"[pre-audit/SC-20]"}}){
      nodes{identifier title state{name} priority labels{nodes{name}} url}
    }
    pre21: issues(filter:{team:{key:{eq:"SC"}},title:{contains:"[pre-audit/SC-21]"}}){
      nodes{identifier title state{name} priority labels{nodes{name}} url}
    }
    profileApi: issues(filter:{team:{key:{eq:"SC"}},number:{in:[90,91,92,93,94,95,96,97,99]}}){
      nodes{identifier title state{name} priority labels{nodes{name}} url}
    }
  }
`

function vlabel(issue) {
  return issue.labels.nodes.map(l => l.name).filter(n => /^v\d/.test(n)).join(',') || '—'
}

function pri(p) {
  return p === 0 ? '—' : `P${p}`
}

function row(issue) {
  const num = parseInt(issue.identifier.split('-')[1])
  const ship = findShipCommit(num)
  const prCell = ship?.pr ? `[#${ship.pr}](https://github.com/Scaffald/UNI-Construct/pull/${ship.pr})` : ship?.hash || '—'
  // Trim title prefix [pre-audit/SC-XX] for readability
  const title = issue.title.replace(/^\[pre-audit\/SC-\d+\]\s*/, '')
  return `| ${issue.identifier} | ${pri(issue.priority)} | ${issue.state.name} | ${vlabel(issue)} | ${prCell} | ${title} |`
}

function tableForGroup(flow, issues) {
  const sorted = [...issues].sort((a, b) => {
    const an = parseInt(a.identifier.split('-')[1])
    const bn = parseInt(b.identifier.split('-')[1])
    return an - bn
  })
  const byState = {}
  for (const i of sorted) byState[i.state.name] = (byState[i.state.name] || 0) + 1
  const stateSummary = Object.entries(byState).map(([s, c]) => `${s}: ${c}`).join(' · ')

  const parentLink = flow.parent
    ? `[${flow.parent}](https://linear.app/scaffald/issue/${flow.parent})`
    : '(no parent ticket)'

  let out = `\n## ${flow.title}\n\n`
  out += `**Parent audit:** ${parentLink}  \n`
  out += `**Tickets:** ${sorted.length} (${stateSummary})\n\n`
  out += `| Ticket | Pri | State | Version | Ship | Title |\n`
  out += `|---|---|---|---|---|---|\n`
  for (const i of sorted) out += row(i) + '\n'
  return out
}

async function main() {
  const data = await gql(ISSUES_Q)
  const buckets = {
    'create-job': data.pre18.nodes,
    apply: data.pre19.nodes,
    onboarding: data.pre20.nodes,
    certification: data.pre21.nodes,
    'profile-api': data.profileApi.nodes,
  }

  const generatedAt = new Date().toISOString().slice(0, 10)
  console.log(`# Worker-flow status matrix — generated ${generatedAt}\n`)
  console.log('> Raw data tables. The hand-curated synthesis lives in [`STATUS-MATRIX.md`](STATUS-MATRIX.md).\n')

  let total = 0, shipped = 0
  for (const flow of FLOWS) {
    const issues = buckets[flow.key]
    total += issues.length
    shipped += issues.filter(i => ['Done', 'In TestFlight'].includes(i.state.name)).length
    console.log(tableForGroup(flow, issues))
  }

  console.log(`\n## Totals\n`)
  console.log(`- **${total}** audit tickets across 5 flows`)
  console.log(`- **${shipped}** in TestFlight or Done (${Math.round(100 * shipped / total)}%)`)
  console.log(`- **${total - shipped}** still upstream of TestFlight`)
}

main().catch(err => {
  console.error(`✗ ${err.message}`)
  process.exit(1)
})
