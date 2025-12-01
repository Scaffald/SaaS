import type { Reporter } from "vitest/reporters";
import type { Vitest } from "vitest/node";
import { relative } from "pathe";

// Vitest task/file type definitions (compatible with vitest internal types)
interface VitestTask {
  type: "test" | "suite";
  name: string;
  tasks?: VitestTask[];
  result?: {
    state?: "pass" | "fail" | "skip";
    duration?: number;
    errors?: Array<{ message?: string; stack?: string }>;
  };
}

interface VitestFile {
  filepath?: string;
  tasks?: VitestTask[];
  result?: {
    duration?: number;
  };
}

interface FileProgress {
  filepath: string;
  relativePath: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  startTime: number;
  errors: Array<{ testName: string; error: string; stack?: string }>;
}

interface ErrorInfo {
  file: string;
  testName: string;
  error: string;
  stack?: string;
}

/**
 * Quiet Progress Reporter
 *
 * Minimal output that shows:
 * - Single line per file when completed
 * - Failures inline with error details
 * - Summary at the end with coverage info
 *
 * Eliminates the "flashing" queue display and reduces visual noise.
 */
export default class QuietProgressReporter implements Reporter {
  private ctx!: Vitest;
  private fileProgress = new Map<string, FileProgress>();
  private startTime = 0;
  private totalFiles = 0;
  private completedFiles = 0;
  private totalTests = 0;
  private totalPassed = 0;
  private totalFailed = 0;
  private totalSkipped = 0;
  private allErrors: ErrorInfo[] = [];

  onInit(ctx: Vitest): void {
    this.ctx = ctx;
    this.startTime = Date.now();
    this.fileProgress.clear();
    this.completedFiles = 0;
    this.totalTests = 0;
    this.totalPassed = 0;
    this.totalFailed = 0;
    this.totalSkipped = 0;
    this.allErrors = [];

    // Clear console and show header
    console.log("\n🧪 Running tests...\n");
  }

  onCollected(files?: VitestFile[]): void {
    if (!files) return;

    this.totalFiles = files.length;

    // Initialize progress for each file
    for (const file of files) {
      const filepath = file.filepath ?? "unknown";
      const relativePath = relative(
        this.ctx.config.root || process.cwd(),
        filepath,
      );

      this.fileProgress.set(filepath, {
        filepath,
        relativePath,
        total: this.countTests(file),
        passed: 0,
        failed: 0,
        skipped: 0,
        startTime: Date.now(),
        errors: [],
      });
    }

    console.log(`📁 ${this.totalFiles} test files collected\n`);
  }

  private countTests(file: VitestFile): number {
    let count = 0;
    const countTasks = (tasks: VitestTask[]) => {
      for (const task of tasks) {
        if (task.type === "test") {
          count++;
        } else if (task.type === "suite" && task.tasks) {
          countTasks(task.tasks);
        }
      }
    };
    if (file.tasks) {
      countTasks(file.tasks);
    }
    return count;
  }

  onFinished(files?: VitestFile[], errors?: unknown[]): void {
    // Process all completed files
    if (files) {
      for (const file of files) {
        const filepath = file.filepath ?? "unknown";
        const relativePath = relative(
          this.ctx.config.root || process.cwd(),
          filepath,
        );
        const duration = file.result?.duration || 0;

        let passed = 0;
        let failed = 0;
        let skipped = 0;
        const fileErrors: Array<{
          testName: string;
          error: string;
          stack?: string;
        }> = [];

        const processTasks = (tasks: VitestTask[]) => {
          for (const task of tasks) {
            if (task.type === "test") {
              const state = task.result?.state;
              if (state === "pass") {
                passed++;
                this.totalPassed++;
              } else if (state === "fail") {
                failed++;
                this.totalFailed++;

                // Capture error details
                const error = task.result?.errors?.[0];
                if (error) {
                  fileErrors.push({
                    testName: task.name,
                    error: error.message ?? "Unknown error",
                    stack: error.stack,
                  });
                }
              } else if (state === "skip") {
                skipped++;
                this.totalSkipped++;
              }
              this.totalTests++;
            } else if (task.type === "suite" && task.tasks) {
              processTasks(task.tasks);
            }
          }
        };

        if (file.tasks) {
          processTasks(file.tasks);
        }

        // Print file result
        const durationStr = this.formatDuration(duration);
        const testCount = passed + failed + skipped;

        if (failed > 0) {
          console.log(
            `❌ ${relativePath} (${testCount} tests, ${failed} failed) ${durationStr}`,
          );

          // Show failures immediately
          for (const err of fileErrors) {
            console.log(`   └─ ✗ ${err.testName}`);
            console.log(`      ${err.error}`);
            this.allErrors.push({ file: relativePath, ...err });
          }
        } else if (skipped === testCount) {
          console.log(
            `⏭️  ${relativePath} (${testCount} skipped) ${durationStr}`,
          );
        } else {
          console.log(`✓ ${relativePath} (${testCount} tests) ${durationStr}`);
        }
      }
    }

    // Print summary
    this.printSummary();
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    }
    return `${(ms / 1000).toFixed(2)}s`;
  }

  private printSummary(): void {
    const totalDuration = Date.now() - this.startTime;

    console.log("\n" + "═".repeat(60));
    console.log("📊 Test Summary");
    console.log("═".repeat(60));

    console.log(
      `\n   Total:   ${this.totalTests} tests in ${this.totalFiles} files`,
    );
    console.log(`   Passed:  ${this.totalPassed} ✓`);

    if (this.totalFailed > 0) {
      console.log(`   Failed:  ${this.totalFailed} ✗`);
    }

    if (this.totalSkipped > 0) {
      console.log(`   Skipped: ${this.totalSkipped} ⏭️`);
    }

    console.log(`   Time:    ${this.formatDuration(totalDuration)}`);

    // If there were failures, show a summary of failed tests
    if (this.allErrors.length > 0) {
      console.log("\n" + "─".repeat(60));
      console.log("❌ Failed Tests:");
      console.log("─".repeat(60));

      for (const err of this.allErrors) {
        console.log(`\n   ${err.file}`);
        console.log(`   └─ ${err.testName}`);
        console.log(`      ${err.error}`);
        if (err.stack) {
          // Show first 3 lines of stack trace
          const stackLines = err.stack.split("\n").slice(1, 4);
          for (const line of stackLines) {
            console.log(`      ${line.trim()}`);
          }
        }
      }
    }

    console.log("\n" + "═".repeat(60));

    // Final status
    if (this.totalFailed === 0) {
      console.log("✅ All tests passed!\n");
    } else {
      console.log(`❌ ${this.totalFailed} test(s) failed\n`);
    }
  }
}
