import fs from 'node:fs'
import path from 'node:path'

const baselinePath = path.resolve('tests/infrastructure/vitest/coverage-baseline.json')
const summaryPath = path.resolve('coverage/coverage-summary.json')
const fallbackPath = path.resolve('coverage/coverage-final.json')

function readJson(filePath) {
  try {
    const contents = fs.readFileSync(filePath, 'utf8')
    return JSON.parse(contents)
  } catch (error) {
    if (error.code === 'ENOENT') {
      return undefined
    }
    throw error
  }
}

function getStatementsCoverage(summary) {
  const statements = summary?.total?.statements
  if (statements?.pct != null) {
    return statements.pct
  }
  if (typeof statements === 'number') {
    return statements
  }
  return undefined
}

const baseline = readJson(baselinePath)
if (!baseline || typeof baseline.statements !== 'number') {
  throw new Error(`Missing coverage baseline at ${baselinePath}`)
}

const summary = readJson(summaryPath) ?? readJson(fallbackPath)
const statementsPct = getStatementsCoverage(summary)

if (typeof statementsPct !== 'number') {
  throw new Error(
    `Unable to read statements coverage percentage from ${summaryPath} or ${fallbackPath}`
  )
}

const delta = statementsPct - baseline.statements

if (statementsPct + 1e-3 < baseline.statements) {
  console.error(
    `Statement coverage ${statementsPct.toFixed(2)}% is below baseline ${baseline.statements.toFixed(2)}%`
  )
  process.exit(1)
}

console.log(
  `Statement coverage ${statementsPct.toFixed(2)}% meets baseline (${baseline.statements.toFixed(2)}%). Delta: ${delta.toFixed(
    2
  )}%`
)
