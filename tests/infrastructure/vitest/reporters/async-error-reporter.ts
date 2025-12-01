import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Reporter, Vitest } from 'vitest';

interface AsyncError {
  timestamp: string;
  error: string;
  stack?: string;
  type: string;
}

export default class AsyncErrorReporter implements Reporter {
  private ctx!: Vitest;
  private asyncErrors: AsyncError[] = [];

  onInit(ctx: Vitest): void {
    this.ctx = ctx;
    this.asyncErrors = [];

    // Set up global unhandled rejection handler
    process.on('unhandledRejection', (reason, promise) => {
      this.asyncErrors.push({
        timestamp: new Date().toISOString(),
        error: String(reason),
        type: 'UnhandledPromiseRejection',
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    });

    // Set up uncaught exception handler
    process.on('uncaughtException', (error) => {
      this.asyncErrors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        type: 'UncaughtException',
        stack: error.stack,
      });
    });
  }

  onRunComplete(): void {
    if (this.asyncErrors.length > 0) {
      console.warn('\n⚠️  Async Errors Detected:');
      console.warn('═'.repeat(80));

      this.asyncErrors.forEach((error, index) => {
        console.warn(`\n${index + 1}. [${error.type}] ${error.error}`);
        console.warn(`   Time: ${error.timestamp}`);
        if (error.stack) {
          console.warn(`   Stack:\n${error.stack.split('\n').slice(0, 5).join('\n')}`);
        }
      });

      console.warn('\n═'.repeat(80));
      console.warn(`Total async errors: ${this.asyncErrors.length}\n`);

      // Write to JSON file for CI systems
      const reportPath = `${this.ctx.config.root}/tests/reports/coverage/async-errors.json`;
      mkdirSync(dirname(reportPath), { recursive: true });
      writeFileSync(
        reportPath,
        JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            totalErrors: this.asyncErrors.length,
            errors: this.asyncErrors,
          },
          null,
          2,
        ),
      );

      console.log(`📄 Async error report written to: ${reportPath}`);
    }
  }
}
