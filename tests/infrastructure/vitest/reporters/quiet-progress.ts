import type {
  Suite,
  TaskMeta,
  TaskResultPack,
  TaskState,
  Test,
} from "@vitest/runner";
import type { Vitest } from "vitest";
import type { Reporter } from "vitest/reporters";
import { relative } from "pathe";
import pc from "picocolors";
import { DefaultReporter } from "vitest/reporters";

import {
  describeVerboseSource,
  isVerboseSuite,
} from "../../logging/test-log-flags";

const failureIcon = pc.red("✖");
const successIcon = pc.green("✓");
const skippedIcon = pc.yellow("↷");
const prefix = pc.dim("[vitest]");
const debugReporter = process.env.TEST_LOG_DEBUG === "1";

export default class QuietProgressReporter implements Reporter {
  private ctx!: Vitest;
  private fallback = new DefaultReporter();
  private startedSuites = new Set<string>();
  private completedSuites = new Set<string>();
  private runningSuites = new Set<string>();
  private recordedStates = new Map<string, TaskState>();
  private queuedFiles: string[] = [];
  private currentFile?: string;
  private rootDir = process.cwd();
  private hasLoggedAllFiles = false;

  onInit(ctx: Vitest): void {
    this.ctx = ctx;
    this.rootDir = ctx.config.root ?? process.cwd();
    this.fallback.onInit(ctx);
    this.startedSuites.clear();
    this.recordedStates.clear();
    this.completedSuites.clear();
    this.runningSuites.clear();
    this.queuedFiles = [];
    this.currentFile = undefined;
    this.hasLoggedAllFiles = false;
  }

  onPathsCollected(paths: string[] = []): void {
    if (paths.length > 0) {
      this.queuedFiles = paths;
      // Log all files as "queued" upfront so we can see which ones will run
      // This helps identify hanging tests - if a file is queued but never completed, it's hanging
      for (const filepath of paths) {
        if (filepath) {
          // Normalize path to ensure consistent comparison
          const normalizedPath = filepath.replace(/\\/g, "/");
          if (!this.startedSuites.has(normalizedPath)) {
            this.logSuitePlan(normalizedPath);
          }
        }
      }
      this.hasLoggedAllFiles = true;
    }
    this.completedSuites.clear();
    this.currentFile = undefined;
    // Don't call updateCurrentFile() here since we've already logged all files
  }

  onTaskUpdate(packs: TaskResultPack[]): void {
    // Log all files that haven't been logged yet (fallback if onPathsCollected wasn't called)
    // This ensures we see all files that will run, even if paths weren't collected upfront
    // Only do this once to avoid performance issues
    if (!this.hasLoggedAllFiles) {
      const allFiles = this.ctx.state.getFiles();
      for (const file of allFiles) {
        const filepath = file.filepath;
        if (filepath) {
          const normalizedPath = filepath.replace(/\\/g, "/");
          if (!this.startedSuites.has(normalizedPath)) {
            this.logSuitePlan(normalizedPath);
          }
        }
      }
      // Mark as logged if we found any files (even if some were already logged)
      if (allFiles.length > 0) {
        this.hasLoggedAllFiles = true;
      }
    }

    // Log currently running files to help identify hangs
    // Check all files in state and log any that are running but not yet logged as running
    // This is a continuous check (not just on state transition) to catch files that enter "run" state
    const allFiles = this.ctx.state.getFiles();
    for (const file of allFiles) {
      const filepath = file.filepath;
      if (!filepath) continue;
      
      const normalizedPath = filepath.replace(/\\/g, "/");
      const state = file.result?.state;
      
      // Log files that are running but we haven't logged yet
      if (state === "run" && !this.runningSuites.has(normalizedPath)) {
        this.logSuiteRunning(normalizedPath);
      }
      
      // Also log files stuck in "pending" for a while (potential hang indicator)
      // This helps catch files that never transition to "run" state
      if (state === "pending" && !this.startedSuites.has(normalizedPath)) {
        // File is queued but stuck in pending - might be hanging
        // We already logged it as "queued", so this is just for reference
      }
    }

    for (const [taskId, result, meta] of packs) {
      if (!result) {
        continue;
      }
      if (this.recordedStates.get(taskId) === result.state) {
        continue;
      }
      this.recordedStates.set(taskId, result.state);
      const task = this.ctx.state.idMap.get(taskId);
      if (debugReporter) {
        this.ctx.logger.log(
          `${prefix} debug task=${taskId} type=${
            task?.type ?? "unknown"
          } file=${task?.file?.filepath ?? "n/a"} parent=${
            task && "suite" in task && task.suite
              ? task.suite.filepath ?? "n/a"
              : "n/a"
          } state=${result?.state ?? "unknown"} meta=${
            JSON.stringify(meta ?? {})
          }`,
        );
      }
      if (!task) {
        continue;
      }
      if (task.type === "suite") {
        // Log "running" when file suite enters "run" state (actually executing)
        if (result.state === "run" && this.isFileSuiteId(taskId)) {
          const filepath = (task as Suite).file?.filepath ??
            (task as Suite).filepath;
          if (filepath) {
            const normalizedPath = filepath.replace(/\\/g, "/");
            // Log "queued" if not already logged (fallback)
            if (!this.startedSuites.has(normalizedPath)) {
              this.logSuitePlan(normalizedPath);
            }
            // Log "running" when file actually starts executing
            if (!this.runningSuites.has(normalizedPath)) {
              this.logSuiteRunning(normalizedPath);
            }
          }
        }
        this.markSuiteCompletion(task as Suite, result.state, taskId);
      } else if (task.type === "test") {
        this.logTestEvent(task as Test, result.state);
      }
    }
    this.updateCurrentFile();
    if (debugReporter) {
      const fileStates = this.ctx
        .state
        .getFiles()
        .map((file) =>
          `${file.filepath ?? "n/a"}:${file.result?.state ?? "pending"}`
        )
        .join(", ");
      this.ctx.logger.log(`${prefix} debug file-states ${fileStates}`);
    }
  }

  async onFinished(
    files = this.ctx.state.getFiles(),
    errors = this.ctx.state.getUnhandledErrors(),
  ): Promise<void> {
    this.ctx.logger.log();
    await this.fallback.onFinished(files, errors);
  }

  private logSuitePlan(filepath: string): void {
    // Normalize path for consistent storage
    const normalizedPath = filepath.replace(/\\/g, "/");
    this.startedSuites.add(normalizedPath);
    const relativePath = relative(this.rootDir, normalizedPath) ||
      normalizedPath;
    const verboseSource = isVerboseSuite(normalizedPath)
      ? describeVerboseSource(normalizedPath)
      : undefined;
    const suffix = verboseSource ? pc.dim(` (${verboseSource})`) : "";
    // Use console.log directly to ensure immediate flush (no buffering)
    console.log(`${prefix} queued ${relativePath}${suffix}`);
  }

  private logSuiteRunning(filepath: string): void {
    const normalizedPath = filepath.replace(/\\/g, "/");
    this.runningSuites.add(normalizedPath);
    const relativePath = relative(this.rootDir, normalizedPath) ||
      normalizedPath;
    // Use console.log directly to ensure immediate flush (no buffering)
    console.log(`${prefix} running ${relativePath}`);
  }

  private logSuiteCompletion(filepath: string): void {
    const normalizedPath = filepath.replace(/\\/g, "/");
    this.runningSuites.delete(normalizedPath); // Remove from running set
    const relativePath = relative(this.rootDir, normalizedPath) ||
      normalizedPath;
    this.ctx.logger.log(`${prefix} completed ${relativePath}`);
  }

  private markSuiteCompletion(
    suite: Suite,
    state: TaskState,
    taskId: string,
  ): void {
    if (state === "run") {
      return;
    }
    const filepath = suite.file?.filepath ?? suite.filepath;
    if (!filepath || !this.isFileSuiteId(taskId)) {
      return;
    }
    this.completedSuites.add(filepath);
    this.logSuiteCompletion(filepath);
    if (debugReporter) {
      this.ctx.logger.log(`${prefix} debug suite-complete ${filepath}`);
    }
  }

  private updateCurrentFile(): void {
    // This method is kept for backward compatibility but is no longer needed
    // since we log all files upfront in onPathsCollected
    // It's still called but won't log duplicates due to startedSuites check
    if (this.queuedFiles.length === 0) {
      this.queuedFiles = this.ctx
        .state
        .getFiles()
        .map((file) => file.filepath)
        .filter((path): path is string => Boolean(path));
    }
    const next = this.queuedFiles.find((filepath) =>
      !this.completedSuites.has(filepath)
    );
    if (next && next !== this.currentFile) {
      this.currentFile = next;
      // Only log if not already logged (prevents duplicates from onPathsCollected)
      const normalizedPath = next.replace(/\\/g, "/");
      if (!this.startedSuites.has(normalizedPath)) {
        this.logSuitePlan(normalizedPath);
      }
    }
  }

  private isFileSuiteId(taskId: string): boolean {
    return taskId.split("_").length === 2;
  }

  private logTestEvent(test: Test, state: TaskState): void {
    const filepath = test.file?.filepath;
    if (!filepath) {
      return;
    }
    if (state === "fail") {
      this.logFailure(test);
      return;
    }
    if (!isVerboseSuite(filepath)) {
      return;
    }
    if (state === "pass") {
      this.ctx.logger.log(`${successIcon} ${this.composeTestLabel(test)}`);
    } else if (state === "skip" || state === "todo") {
      this.ctx.logger.log(
        `${skippedIcon} ${this.composeTestLabel(test)} (${state})`,
      );
    }
  }

  private composeTestLabel(test: Test): string {
    const relativePath = test.file?.filepath
      ? this.relativeToRoot(test.file.filepath)
      : "";
    const scope = this.buildSuiteChain(test);
    const locationPrefix = relativePath ? `${relativePath} › ` : "";
    return `${locationPrefix}${scope}`;
  }

  private relativeToRoot(filepath: string): string {
    return relative(this.rootDir, filepath) || filepath;
  }

  private buildSuiteChain(test: Test): string {
    const names: string[] = [];
    let cursor = test.suite;
    while (cursor) {
      if (cursor.name) {
        names.unshift(cursor.name);
      }
      cursor = cursor.suite;
    }
    names.push(test.name);
    return names.join(" › ");
  }

  private logFailure(test: Test): void {
    this.ctx.logger.log(`${failureIcon} ${this.composeTestLabel(test)}`);
    const errors = test.result?.errors ?? [];
    if (errors.length === 0) {
      return;
    }
    for (const error of errors) {
      if (!error) {
        continue;
      }
      const message = error.message ?? "";
      if (message) {
        this.ctx.logger.log(pc.red(message));
      }
      const stack = error.stack ??
        (typeof error.cause === "object" && error.cause &&
            "stack" in error.cause
          ? String((error.cause as { stack?: string }).stack ?? "")
          : undefined);
      if (stack) {
        this.ctx.logger.log(pc.dim(stack));
      }
    }
  }
}
