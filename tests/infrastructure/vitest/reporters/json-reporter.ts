import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { File, Reporter, Vitest } from 'vitest';

interface TestResult {
  file: string;
  name: string;
  duration: number;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
}

interface JSONReportOutput {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestResult[];
  errors: Array<{ message: string; stack?: string }>;
}

export default class JSONReporter implements Reporter {
  private ctx!: Vitest;
  private tests: TestResult[] = [];
  private startTime: number = Date.now();
  private errors: Array<{ message: string; stack?: string }> = [];
  private passed = 0;
  private failed = 0;
  private skipped = 0;

  onInit(ctx: Vitest): void {
    this.ctx = ctx;
    this.startTime = Date.now();
  }

  onTestEnd(file: File): void {
    if (!file.tasks) return;

    file.tasks.forEach((task) => {
      if (task.type === 'test') {
        const status = task.result?.state === 'pass' ? 'pass' : task.result?.state === 'skip' ? 'skip' : 'fail';
        const result: TestResult = {
          file: file.filepath || 'unknown',
          name: task.name,
          duration: task.result?.duration || 0,
          status,
        };

        if (status === 'fail' && task.result?.errors?.[0]) {
          result.error = task.result.errors[0].message;
        }

        this.tests.push(result);

        if (status === 'pass') this.passed++;
        if (status === 'fail') this.failed++;
        if (status === 'skip') this.skipped++;
      }
    });
  }

  onRunComplete(): void {
    const duration = Date.now() - this.startTime;
    const output: JSONReportOutput = {
      timestamp: new Date().toISOString(),
      totalTests: this.tests.length,
      passed: this.passed,
      failed: this.failed,
      skipped: this.skipped,
      duration,
      tests: this.tests,
      errors: this.errors,
    };

    const reportPath = `${this.ctx.config.root}/tests/reports/coverage/test-results.json`;
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(output, null, 2));

    console.log(`📊 JSON report written to: ${reportPath}`);
  }
}
