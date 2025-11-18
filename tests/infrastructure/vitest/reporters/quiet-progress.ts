import type { Suite, TaskMeta, TaskResultPack, TaskState, Test } from '@vitest/runner'
import type { Vitest } from 'vitest'
import type { Reporter } from 'vitest/reporters'
import { relative } from 'pathe'
import pc from 'picocolors'
import { DefaultReporter } from 'vitest/reporters'

import { describeVerboseSource, isVerboseSuite } from '../../logging/test-log-flags'

const failureIcon = pc.red('✖')
const successIcon = pc.green('✓')
const skippedIcon = pc.yellow('↷')
const prefix = pc.dim('[vitest]')
const debugReporter = process.env.TEST_LOG_DEBUG === '1'

export default class QuietProgressReporter implements Reporter {
  private ctx!: Vitest
  private fallback = new DefaultReporter()
  private startedSuites = new Set<string>()
  private completedSuites = new Set<string>()
  private recordedStates = new Map<string, TaskState>()
  private queuedFiles: string[] = []
  private currentFile?: string
  private rootDir = process.cwd()

  onInit(ctx: Vitest): void {
    this.ctx = ctx
    this.rootDir = ctx.config.root ?? process.cwd()
    this.fallback.onInit(ctx)
    this.startedSuites.clear()
    this.recordedStates.clear()
    this.completedSuites.clear()
    this.queuedFiles = []
    this.currentFile = undefined
  }

  onPathsCollected(paths: string[] = []): void {
    if (paths.length > 0) {
      this.queuedFiles = paths
    }
    this.completedSuites.clear()
    this.currentFile = undefined
    this.updateCurrentFile()
  }

  onTaskUpdate(packs: TaskResultPack[]): void {
    for (const [taskId, result, meta] of packs) {
      if (!result) {
        continue
      }
      if (this.recordedStates.get(taskId) === result.state) {
        continue
      }
      this.recordedStates.set(taskId, result.state)
      const task = this.ctx.state.idMap.get(taskId)
      if (debugReporter) {
        this.ctx.logger.log(
          `${prefix} debug task=${taskId} type=${task?.type ?? 'unknown'} file=${task?.file?.filepath ?? 'n/a'} parent=${task && 'suite' in task && task.suite ? task.suite.filepath ?? 'n/a' : 'n/a'} state=${result?.state ?? 'unknown'} meta=${JSON.stringify(meta ?? {})}`,
        )
      }
      if (!task) {
        continue
      }
      if (task.type === 'suite') {
        this.markSuiteCompletion(task as Suite, result.state, taskId)
      } else if (task.type === 'test') {
        this.logTestEvent(task as Test, result.state)
      }
    }
    this.updateCurrentFile()
    if (debugReporter) {
      const fileStates = this.ctx
        .state
        .getFiles()
        .map((file) => `${file.filepath ?? 'n/a'}:${file.result?.state ?? 'pending'}`)
        .join(', ')
      this.ctx.logger.log(`${prefix} debug file-states ${fileStates}`)
    }
  }

  async onFinished(
    files = this.ctx.state.getFiles(),
    errors = this.ctx.state.getUnhandledErrors(),
  ): Promise<void> {
    this.ctx.logger.log()
    await this.fallback.onFinished(files, errors)
  }

  private logSuitePlan(filepath: string): void {
    this.startedSuites.add(filepath)
    const relativePath = relative(this.rootDir, filepath) || filepath
    const verboseSource = isVerboseSuite(filepath) ? describeVerboseSource(filepath) : undefined
    const suffix = verboseSource ? pc.dim(` (${verboseSource})`) : ''
    this.ctx.logger.log(`${prefix} queued ${relativePath}${suffix}`)
  }

  private logSuiteCompletion(filepath: string): void {
    const relativePath = relative(this.rootDir, filepath) || filepath
    this.ctx.logger.log(`${prefix} completed ${relativePath}`)
  }

  private markSuiteCompletion(suite: Suite, state: TaskState, taskId: string): void {
    if (state === 'run') {
      return
    }
    const filepath = suite.file?.filepath ?? suite.filepath
    if (!filepath || !this.isFileSuiteId(taskId)) {
      return
    }
    this.completedSuites.add(filepath)
    this.logSuiteCompletion(filepath)
    if (debugReporter) {
      this.ctx.logger.log(`${prefix} debug suite-complete ${filepath}`)
    }
  }

  private updateCurrentFile(): void {
    if (this.queuedFiles.length === 0) {
      this.queuedFiles = this.ctx
        .state
        .getFiles()
        .map((file) => file.filepath)
        .filter((path): path is string => Boolean(path))
    }
    const next = this.queuedFiles.find((filepath) => !this.completedSuites.has(filepath))
    if (next && next !== this.currentFile) {
      this.currentFile = next
      this.logSuitePlan(next)
    }
  }

  private isFileSuiteId(taskId: string): boolean {
    return taskId.split('_').length === 2
  }

  private logTestEvent(test: Test, state: TaskState): void {
    const filepath = test.file?.filepath
    if (!filepath) {
      return
    }
    if (state === 'fail') {
      this.logFailure(test)
      return
    }
    if (!isVerboseSuite(filepath)) {
      return
    }
    if (state === 'pass') {
      this.ctx.logger.log(`${successIcon} ${this.composeTestLabel(test)}`)
    } else if (state === 'skip' || state === 'todo') {
      this.ctx.logger.log(`${skippedIcon} ${this.composeTestLabel(test)} (${state})`)
    }
  }

  private composeTestLabel(test: Test): string {
    const relativePath = test.file?.filepath ? this.relativeToRoot(test.file.filepath) : ''
    const scope = this.buildSuiteChain(test)
    const locationPrefix = relativePath ? `${relativePath} › ` : ''
    return `${locationPrefix}${scope}`
  }

  private relativeToRoot(filepath: string): string {
    return relative(this.rootDir, filepath) || filepath
  }

  private buildSuiteChain(test: Test): string {
    const names: string[] = []
    let cursor = test.suite
    while (cursor) {
      if (cursor.name) {
        names.unshift(cursor.name)
      }
      cursor = cursor.suite
    }
    names.push(test.name)
    return names.join(' › ')
  }

  private logFailure(test: Test): void {
    this.ctx.logger.log(`${failureIcon} ${this.composeTestLabel(test)}`)
    const errors = test.result?.errors ?? []
    if (errors.length === 0) {
      return
    }
    for (const error of errors) {
      if (!error) {
        continue
      }
      const message = error.message ?? ''
      if (message) {
        this.ctx.logger.log(pc.red(message))
      }
      const stack = error.stack ?? (typeof error.cause === 'object' && error.cause && 'stack' in error.cause
        ? String((error.cause as { stack?: string }).stack ?? '')
        : undefined)
      if (stack) {
        this.ctx.logger.log(pc.dim(stack))
      }
    }
  }
}

