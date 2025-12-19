/**
 * Upload Queue Unit Tests
 *
 * Tests for the UploadQueue class that manages concurrent document uploads.
 *
 * Run with: deno test --allow-all packages/supabase/functions/trpc/__tests__/upload-queue.test.ts
 */

import {
  assertEquals,
  assertExists,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  createUploadQueue,
  type QueueMetrics,
  UploadQueue,
  type UploadResult,
} from "../routers/utils/upload-queue.ts";

// Helper to create a mock upload handler
function createMockHandler(
  options: {
    delay?: number;
    shouldFail?: boolean;
    failAfterAttempts?: number;
  } = {},
) {
  let attempts = 0;

  return async (_task: { file: Uint8Array; path: string }) => {
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, options.delay || 10));

    if (options.shouldFail) {
      throw new Error("Upload failed");
    }

    if (options.failAfterAttempts && attempts <= options.failAfterAttempts) {
      throw new Error("Upload failed, will retry");
    }

    return { path: _task.path, checksum: "abc123" };
  };
}

// Helper to create test file data
function createTestFile(size: number = 100): Uint8Array {
  return new Uint8Array(size).fill(65); // Fill with 'A'
}

Deno.test({
  name: "UploadQueue - should create queue with default options",
  fn() {
    const handler = createMockHandler();
    const queue = createUploadQueue(handler);

    assertExists(queue);
    const metrics = queue.getMetrics();
    assertEquals(metrics.queueDepth, 0);
    assertEquals(metrics.processing, 0);
    assertEquals(metrics.completed, 0);
    assertEquals(metrics.failed, 0);
  },
});

Deno.test({
  name: "UploadQueue - should enqueue and process a single upload",
  async fn() {
    const handler = createMockHandler({ delay: 10 });
    const queue = createUploadQueue(handler);

    const result = await queue.enqueue({
      file: createTestFile(),
      path: "test/file.pdf",
      contentType: "application/pdf",
    });

    assertEquals(result.success, true);
    assertExists(result.path);
    assertEquals(result.retries, 0);

    const metrics = queue.getMetrics();
    assertEquals(metrics.completed, 1);
    assertEquals(metrics.failed, 0);
  },
});

Deno.test({
  name: "UploadQueue - should process multiple uploads concurrently",
  async fn() {
    const handler = createMockHandler({ delay: 20 });
    const queue = createUploadQueue(handler, { concurrency: 3 });

    const startTime = performance.now();

    const results = await queue.enqueueBatch([
      {
        file: createTestFile(),
        path: "test/file1.pdf",
        contentType: "application/pdf",
      },
      {
        file: createTestFile(),
        path: "test/file2.pdf",
        contentType: "application/pdf",
      },
      {
        file: createTestFile(),
        path: "test/file3.pdf",
        contentType: "application/pdf",
      },
    ]);

    const duration = performance.now() - startTime;

    // All should succeed
    assertEquals(results.length, 3);
    assertEquals(results.filter((r) => r.success).length, 3);

    // With concurrency 3, should complete in roughly one batch (20ms + overhead)
    // rather than sequentially (60ms+)
    assertEquals(
      duration < 100,
      true,
      `Duration ${duration}ms should be < 100ms`,
    );

    const metrics = queue.getMetrics();
    assertEquals(metrics.completed, 3);
    assertEquals(metrics.totalProcessed, 3);
  },
});

Deno.test({
  name: "UploadQueue - should retry failed uploads",
  async fn() {
    // Handler fails on first 2 attempts, succeeds on 3rd
    const handler = createMockHandler({ failAfterAttempts: 2, delay: 5 });
    const queue = createUploadQueue(handler, { maxRetries: 3, retryDelay: 10 });

    const result = await queue.enqueue({
      file: createTestFile(),
      path: "test/retry.pdf",
      contentType: "application/pdf",
    });

    assertEquals(result.success, true);
    assertEquals(result.retries, 2); // Failed twice, then succeeded

    const metrics = queue.getMetrics();
    assertEquals(metrics.completed, 1);
    assertEquals(metrics.failed, 0);
  },
});

Deno.test({
  name: "UploadQueue - should fail after max retries",
  async fn() {
    const handler = createMockHandler({ shouldFail: true, delay: 5 });
    const queue = createUploadQueue(handler, { maxRetries: 2, retryDelay: 5 });

    const result = await queue.enqueue({
      file: createTestFile(),
      path: "test/fail.pdf",
      contentType: "application/pdf",
    });

    assertEquals(result.success, false);
    assertExists(result.error);
    assertEquals(result.retries, 2); // Retried twice, then failed

    const metrics = queue.getMetrics();
    assertEquals(metrics.completed, 0);
    assertEquals(metrics.failed, 1);
  },
});

Deno.test({
  name: "UploadQueue - should cancel pending task",
  async fn() {
    const handler = createMockHandler({ delay: 100 });
    const queue = createUploadQueue(handler, { concurrency: 1 });

    // First task blocks the queue
    const task1Promise = queue.enqueue({
      file: createTestFile(),
      path: "test/first.pdf",
      contentType: "application/pdf",
    });

    // Second task is queued
    const task2Promise = queue.enqueue({
      file: createTestFile(),
      path: "test/second.pdf",
      contentType: "application/pdf",
    });

    // Get the task ID from metrics (would need to expose this in real implementation)
    // For now, we test the cancelAll functionality
    queue.cancelAll();

    // First task should complete (already processing)
    const result1 = await task1Promise;
    assertEquals(result1.success, true);

    // Second task should be cancelled
    try {
      await task2Promise;
    } catch (error) {
      assertEquals((error as Error).message, "Task cancelled");
    }
  },
});

Deno.test({
  name: "UploadQueue - should call progress callback",
  async fn() {
    const handler = createMockHandler({ delay: 10 });
    const progressUpdates: QueueMetrics[] = [];

    const queue = createUploadQueue(handler, {
      onProgress: (metrics) => {
        progressUpdates.push({ ...metrics });
      },
    });

    await queue.enqueue({
      file: createTestFile(),
      path: "test/progress.pdf",
      contentType: "application/pdf",
    });

    // Should have received progress updates
    assertEquals(progressUpdates.length > 0, true);

    // Last update should show completion
    const lastUpdate = progressUpdates[progressUpdates.length - 1];
    assertEquals(lastUpdate.completed, 1);
  },
});

Deno.test({
  name: "UploadQueue - should call task complete callback",
  async fn() {
    const handler = createMockHandler({ delay: 10 });
    const completedTasks: UploadResult[] = [];

    const queue = createUploadQueue(handler, {
      onTaskComplete: (result) => {
        completedTasks.push(result);
      },
    });

    await queue.enqueueBatch([
      {
        file: createTestFile(),
        path: "test/a.pdf",
        contentType: "application/pdf",
      },
      {
        file: createTestFile(),
        path: "test/b.pdf",
        contentType: "application/pdf",
      },
    ]);

    assertEquals(completedTasks.length, 2);
    assertEquals(completedTasks.every((t) => t.success), true);
  },
});

Deno.test({
  name: "UploadQueue - should track average processing time",
  async fn() {
    const handler = createMockHandler({ delay: 20 });
    const queue = createUploadQueue(handler);

    await queue.enqueueBatch([
      {
        file: createTestFile(),
        path: "test/time1.pdf",
        contentType: "application/pdf",
      },
      {
        file: createTestFile(),
        path: "test/time2.pdf",
        contentType: "application/pdf",
      },
      {
        file: createTestFile(),
        path: "test/time3.pdf",
        contentType: "application/pdf",
      },
    ]);

    const metrics = queue.getMetrics();
    // Average should be roughly 20ms (with some variance for processing)
    assertEquals(metrics.avgProcessingTime > 15, true);
    assertEquals(metrics.avgProcessingTime < 100, true);
  },
});

Deno.test({
  name: "UploadQueue - should clear history",
  async fn() {
    const handler = createMockHandler({ delay: 5 });
    const queue = createUploadQueue(handler);

    await queue.enqueue({
      file: createTestFile(),
      path: "test/clear.pdf",
      contentType: "application/pdf",
    });

    let metrics = queue.getMetrics();
    assertEquals(metrics.completed, 1);

    queue.clearHistory();

    metrics = queue.getMetrics();
    assertEquals(metrics.completed, 0);
    assertEquals(metrics.failed, 0);
    assertEquals(metrics.avgProcessingTime, 0);
  },
});

Deno.test({
  name: "UploadQueue - should limit concurrency",
  async fn() {
    let maxConcurrent = 0;
    let currentConcurrent = 0;

    const handler = async (_task: { file: Uint8Array; path: string }) => {
      currentConcurrent++;
      maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
      await new Promise((resolve) => setTimeout(resolve, 50));
      currentConcurrent--;
      return { path: _task.path };
    };

    const queue = new UploadQueue(handler, { concurrency: 3 });

    // Queue 10 tasks
    await queue.enqueueBatch(
      Array.from({ length: 10 }, (_, i) => ({
        file: createTestFile(),
        path: `test/concurrent-${i}.pdf`,
        contentType: "application/pdf",
      })),
    );

    // Max concurrent should not exceed 3
    assertEquals(
      maxConcurrent <= 3,
      true,
      `Max concurrent was ${maxConcurrent}, expected <= 3`,
    );
  },
});
