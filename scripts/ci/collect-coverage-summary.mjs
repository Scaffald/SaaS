import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import process from 'node:process'

const repoRoot = process.cwd()
const skipDirectories = new Set(['.git', '.turbo', 'node_modules', '.yarn'])

async function findCoverageSummaries(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const summaries = []

  for (const entry of entries) {
    const fullPath = join(directory, entry.name)

    if (entry.isDirectory()) {
      if (skipDirectories.has(entry.name)) {
        continue
      }

      const nestedSummaries = await findCoverageSummaries(fullPath)
      summaries.push(...nestedSummaries)
      continue
    }

    if (entry.isFile() && entry.name === 'coverage-summary.json') {
      summaries.push(fullPath)
    }
  }

  return summaries
}

function toPercent(covered, total) {
  if (total === 0) {
    return '—'
  }

  return `${((covered / total) * 100).toFixed(2)}%`
}

function formatMetric({ covered, total }) {
  const percent = toPercent(covered, total)

  return `${percent} (${covered}/${total})`
}

const metricLabels = [
  ['lines', 'Lines'],
  ['statements', 'Statements'],
  ['functions', 'Functions'],
  ['branches', 'Branches'],
]

const coverageFiles = await findCoverageSummaries(repoRoot)

if (coverageFiles.length === 0) {
  console.warn('No coverage summary files were generated.')
  process.exit(0)
}

const aggregateTotals = Object.fromEntries(
  metricLabels.map(([key]) => [key, { covered: 0, total: 0 }])
)

const workspaceSummaries = []

for (const file of coverageFiles) {
  const raw = await readFile(file, 'utf8')
  const summary = JSON.parse(raw)
  const totals = summary.total ?? {}

  const relativePath = relative(repoRoot, file).split('\\').join('/')
  const workspaceName = relativePath.split('/coverage/')[0]

  const workspaceMetrics = {}

  for (const [metric] of metricLabels) {
    const { covered = 0, total = 0 } = totals[metric] ?? {}
    aggregateTotals[metric].covered += covered
    aggregateTotals[metric].total += total
    workspaceMetrics[metric] = { covered, total }
  }

  workspaceSummaries.push({ workspaceName, metrics: workspaceMetrics })
}

workspaceSummaries.sort((a, b) => a.workspaceName.localeCompare(b.workspaceName))

const outputLines = []
outputLines.push('# Coverage Summary')
outputLines.push('')
outputLines.push('## Totals')
outputLines.push('')
outputLines.push('| Metric | % Covered | Covered / Total |')
outputLines.push('| --- | --- | --- |')

for (const [metric, label] of metricLabels) {
  const { covered, total } = aggregateTotals[metric]
  outputLines.push(
    `| ${label} | ${toPercent(covered, total)} | ${covered}/${total} |`
  )
}

outputLines.push('')
outputLines.push('## By Workspace')
outputLines.push('')
outputLines.push(
  '| Workspace | Lines | Statements | Functions | Branches |'
)
outputLines.push('| --- | --- | --- | --- | --- |')

for (const { workspaceName, metrics } of workspaceSummaries) {
  const cells = metricLabels.map(([metric]) => formatMetric(metrics[metric]))
  outputLines.push(`| ${workspaceName} | ${cells.join(' | ')} |`)
}

outputLines.push('')

const markdown = `${outputLines.join('\n')}\n`

await writeFile(join(repoRoot, 'coverage-summary.md'), markdown)

console.log(markdown)
