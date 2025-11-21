#!/usr/bin/env node
const fs = require('node:fs')
const path = require('node:path')

const reportPath = path.resolve(process.env.PLAYWRIGHT_JSON_OUTPUT ?? 'playwright-report.json')
const budget = Number.parseInt(process.env.PLAYWRIGHT_FLAKE_BUDGET ?? '5', 10)

if (!fs.existsSync(reportPath)) {
  console.log(`ℹ️  Playwright report not found at ${reportPath}; skipping flake budget check.`)
  process.exit(0)
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))

function collectRetries(suites = []) {
  let retries = 0
  let retriedTests = 0

  for (const suite of suites) {
    if (suite.tests) {
      for (const test of suite.tests) {
        const testRetries = (test.results ?? []).filter(result => result.retry && result.retry > 0).length
        if (testRetries > 0) {
          retriedTests += 1
          retries += testRetries
        }
      }
    }
    const child = collectRetries(suite.suites ?? [])
    retries += child.retries
    retriedTests += child.retriedTests
  }

  return { retries, retriedTests }
}

const { retries, retriedTests } = collectRetries(report.suites ?? [])

console.log(`ℹ️  Detected ${retries} retry attempts across ${retriedTests} tests.`)

if (retries > budget) {
  console.error(`❌ Flake budget exceeded. Allowed ${budget} retries but observed ${retries}.`)
  process.exit(1)
}

console.log(`✅ Flake budget within limit (${budget}).`)
