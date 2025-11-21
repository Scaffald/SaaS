import type { TaskMeta, Test } from '@vitest/runner'
import { relative } from 'pathe'
import type { Vitest } from 'vitest'
import type { Reporter } from 'vitest/reporters'

interface SlowTestInfo {
  name: string
  file: string
  duration: number
  openHandles?: string[]
  stackTrace?: string
  memoryUsage?: NodeJS.MemoryUsage
}

export default class HangingTestReporter implements Reporter {
  private ctx!: Vitest
  private testStartTimes = new Map<string, number>()
  private slowTests: SlowTestInfo[] = []
  private readonly slowTestThreshold = 3000 // 3 seconds (60% of 5s timeout)

  onInit(ctx: Vitest): void {
    this.ctx = ctx
    this.testStartTimes.clear()
    this.slowTests = []
  }

  onTestBegin(test: Test): void {
    this.testStartTimes.set(test.id, Date.now())
  }

  onTestEnd(test: Test): void {
    const startTime = this.testStartTimes.get(test.id)
    if (!startTime) return

    const duration = Date.now() - startTime
    this.testStartTimes.delete(test.id)

    // Log warnings for tests exceeding threshold
    if (duration > this.slowTestThreshold) {
      const filepath = test.file?.filepath || 'unknown'
      const relativePath = relative(this.ctx.config.root || process.cwd(), filepath)

      const slowTest: SlowTestInfo = {
        name: test.name,
        file: relativePath,
        duration,
        openHandles: this.detectOpenHandles(),
        stackTrace: test.result?.errors?.[0]?.stack,
        memoryUsage: process.memoryUsage(),
      }

      this.slowTests.push(slowTest)

      console.warn(`⚠️  Slow test detected: ${test.name}`)
      console.warn(`   Duration: ${duration}ms (threshold: ${this.slowTestThreshold}ms)`)
      console.warn(`   File: ${relativePath}`)
    }
  }

  onFinished(): void {
    if (this.slowTests.length > 0) {
      console.log('\n📊 Slow Test Summary:')
      console.log('═'.repeat(80))

      this.slowTests
        .sort((a, b) => b.duration - a.duration)
        .forEach((test, index) => {
          console.log(`\n${index + 1}. ${test.name}`)
          console.log(`   File: ${test.file}`)
          console.log(`   Duration: ${test.duration}ms`)

          if (test.openHandles && test.openHandles.length > 0) {
            console.log(`   Open Handles: ${test.openHandles.join(', ')}`)
          }

          if (test.memoryUsage) {
            const heapUsedMB = Math.round(test.memoryUsage.heapUsed / 1024 / 1024)
            const heapTotalMB = Math.round(test.memoryUsage.heapTotal / 1024 / 1024)
            console.log(`   Memory: ${heapUsedMB}MB / ${heapTotalMB}MB`)
          }

          if (test.stackTrace) {
            console.log(`   Stack Trace:\n${test.stackTrace.split('\n').slice(0, 5).join('\n')}`)
          }
        })

      console.log('\n═'.repeat(80))
      console.log(`Total slow tests: ${this.slowTests.length}`)
      console.log(
        '\n⚠️  These tests are approaching the 5s timeout threshold.',
      )
      console.log('Consider optimizing or splitting them into smaller tests.\n')
    }
  }

  private detectOpenHandles(): string[] {
    const handles: string[] = []

    try {
      // Access internal Node.js APIs for handle detection
      // These are not part of the public API but are available in Node.js
      const processAny = process as any
      const activeHandles = processAny._getActiveHandles?.() || []
      const activeRequests = processAny._getActiveRequests?.() || []

      activeHandles.forEach((handle: any) => {
        const handleType = handle.constructor?.name || 'Unknown'
        if (handleType !== 'Unknown') {
          handles.push(handleType)
        }
      })

      activeRequests.forEach((request: any) => {
        const requestType = request.constructor?.name || 'Unknown'
        if (requestType !== 'Unknown') {
          handles.push(requestType)
        }
      })
    } catch (error) {
      // Silently fail if detection not available (e.g., in some Node.js versions)
    }

    return [...new Set(handles)]
  }
}

