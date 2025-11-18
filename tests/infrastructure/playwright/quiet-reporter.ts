import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
  TestStatus,
} from '@playwright/test/reporter'
import { relative } from 'pathe'
import pc from 'picocolors'

import { describeVerboseSource, isVerboseSuite } from '../logging/test-log-flags'

type StatusTally = Record<TestStatus, number>

const statusOrder: TestStatus[] = ['passed', 'failed', 'timedOut', 'skipped', 'interrupted']

export default class QuietPlaywrightReporter implements Reporter {
  private rootDir = process.cwd()
  private startedFiles = new Set<string>()
  private totals: StatusTally = this.createTally()

  onBegin(config: FullConfig, suite: Suite): void {
    this.rootDir = config.rootDir || process.cwd()
    this.startedFiles.clear()
    this.totals = this.createTally()

    const tests = suite.allTests()
    const files = new Set<string>()
    for (const test of tests) {
      files.add(test.location.file)
    }
    const plannedTests = tests.length
    process.stdout.write(
      `${pc.dim('[playwright]')} planning ${plannedTests} tests across ${files.size} files\n`,
    )
  }

  onTestBegin(test: TestCase): void {
    this.maybeAnnounceFile(test.location.file)
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const file = test.location.file
    this.maybeAnnounceFile(file)
    if (result.status) {
      this.totals[result.status] += 1
    }

    if (result.status === 'failed' || result.status === 'timedOut' || result.status === 'interrupted') {
      this.logFailure(test, result)
      return
    }

    if (!isVerboseSuite(file)) {
      return
    }

    if (result.status === 'passed') {
      process.stdout.write(`${pc.green('✓')} ${this.composeLabel(test)}\n`)
    } else if (result.status === 'skipped') {
      process.stdout.write(`${pc.yellow('↷')} ${this.composeLabel(test)} (${result.status})\n`)
    }
  }

  onEnd(result: FullResult): void {
    process.stdout.write(this.renderSummary(result))
  }

  private createTally(): StatusTally {
    return {
      passed: 0,
      failed: 0,
      timedOut: 0,
      skipped: 0,
      interrupted: 0,
    }
  }

  private maybeAnnounceFile(filepath: string): void {
    if (!filepath || this.startedFiles.has(filepath)) {
      return
    }
    this.startedFiles.add(filepath)
    const relativePath = relative(this.rootDir, filepath) || filepath
    const verboseSource = isVerboseSuite(filepath) ? describeVerboseSource(filepath) : undefined
    const suffix = verboseSource ? pc.dim(` (${verboseSource})`) : ''
    process.stdout.write(`${pc.dim('[playwright]')} running ${relativePath}${suffix}\n`)
  }

  private composeLabel(test: TestCase): string {
    const relativePath = relative(this.rootDir, test.location.file) || test.location.file
    const titles = test.titlePath().slice(1) // remove project name to reduce noise
    return `${relativePath} › ${titles.join(' › ')}`
  }

  private logFailure(test: TestCase, result: TestResult): void {
    process.stdout.write(`${pc.red('✖')} ${this.composeLabel(test)}\n`)
    if (result.error?.message) {
      process.stdout.write(`${pc.red(result.error.message)}\n`)
    }
    if (result.error?.stack) {
      process.stdout.write(`${pc.dim(result.error.stack)}\n`)
    }
  }

  private renderSummary(result: FullResult): string {
    const totalTests = statusOrder.reduce((sum, status) => sum + this.totals[status], 0)
    const lines = [
      '',
      `${result.status === 'passed' ? pc.green('✔') : pc.red('✖')} Playwright run ${result.status}`,
      `duration: ${Math.round(result.duration / 1000)}s`,
      `tests: ${totalTests}`,
    ]
    for (const status of statusOrder) {
      lines.push(`${status}: ${this.totals[status]}`)
    }
    lines.push('')
    return `${lines.join('\n')}\n`
  }
}

