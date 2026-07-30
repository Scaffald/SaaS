/**
 * Performance Monitoring Unit Tests
 *
 * Tests for the PerformanceMonitor class that tracks API performance.
 *
 * Run with: deno test --allow-all packages/supabase/functions/trpc/__tests__/performance-monitoring.test.ts
 */

import {
  assertEquals,
  assertExists,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';
import {
  getPerformanceMonitor,
  PerformanceMonitor,
  type RequestMetric,
  resetPerformanceMonitor,
  withTiming,
} from '../routers/utils/performance-monitoring.ts';

Deno.test({
  name: "PerformanceMonitor - should create monitor with default options",
  fn() {
    const monitor = new PerformanceMonitor();
    assertExists(monitor);

    const snapshot = monitor.getSnapshot();
    assertEquals(snapshot.totalRequests, 0);
  },
});

Deno.test({
  name: "PerformanceMonitor - should record request metrics",
  fn() {
    const monitor = new PerformanceMonitor();

    monitor.record({
      path: "documents.upload",
      method: "mutation",
      durationMs: 100,
      success: true,
    });

    const snapshot = monitor.getSnapshot();
    assertEquals(snapshot.totalRequests, 1);
    assertEquals(snapshot.successfulRequests, 1);
    assertEquals(snapshot.failedRequests, 0);
  },
});

Deno.test({
  name: "PerformanceMonitor - should track success and failure separately",
  fn() {
    const monitor = new PerformanceMonitor();

    monitor.record({
      path: "documents.upload",
      method: "mutation",
      durationMs: 100,
      success: true,
    });

    monitor.record({
      path: "documents.upload",
      method: "mutation",
      durationMs: 200,
      success: false,
      errorCode: "INTERNAL_ERROR",
    });

    const snapshot = monitor.getSnapshot();
    assertEquals(snapshot.totalRequests, 2);
    assertEquals(snapshot.successfulRequests, 1);
    assertEquals(snapshot.failedRequests, 1);
  },
});

Deno.test({
  name: "PerformanceMonitor - should calculate average response time",
  fn() {
    const monitor = new PerformanceMonitor();

    monitor.record({
      path: "test",
      method: "query",
      durationMs: 100,
      success: true,
    });
    monitor.record({
      path: "test",
      method: "query",
      durationMs: 200,
      success: true,
    });
    monitor.record({
      path: "test",
      method: "query",
      durationMs: 300,
      success: true,
    });

    const snapshot = monitor.getSnapshot();
    assertEquals(snapshot.avgResponseTimeMs, 200); // (100 + 200 + 300) / 3
  },
});

Deno.test({
  name: "PerformanceMonitor - should calculate p95 response time",
  fn() {
    const monitor = new PerformanceMonitor();

    // Add 100 metrics with values 1-100
    for (let i = 1; i <= 100; i++) {
      monitor.record({
        path: "test",
        method: "query",
        durationMs: i,
        success: true,
      });
    }

    const snapshot = monitor.getSnapshot();
    // p95 should be around 95
    assertEquals(snapshot.p95ResponseTimeMs >= 94, true);
    assertEquals(snapshot.p95ResponseTimeMs <= 96, true);
  },
});

Deno.test({
  name: "PerformanceMonitor - should detect slow queries",
  fn() {
    const slowQueries: RequestMetric[] = [];
    const monitor = new PerformanceMonitor({
      slowQueryThresholdMs: 500,
      onSlowQuery: (metric) => {
        slowQueries.push(metric);
      },
    });

    monitor.record({
      path: "fast",
      method: "query",
      durationMs: 100,
      success: true,
    });
    monitor.record({
      path: "slow",
      method: "query",
      durationMs: 600,
      success: true,
    });
    monitor.record({
      path: "also-slow",
      method: "query",
      durationMs: 1000,
      success: true,
    });

    assertEquals(slowQueries.length, 2);
    assertEquals(slowQueries[0].path, "slow");
    assertEquals(slowQueries[1].path, "also-slow");

    const snapshot = monitor.getSnapshot();
    assertEquals(snapshot.slowQueries, 2);
  },
});

Deno.test({
  name: "PerformanceMonitor - should track upload throughput",
  fn() {
    const monitor = new PerformanceMonitor();

    // 1MB upload in 1 second = 1 MB/s
    monitor.recordUpload("documents.upload", 1000, 1024 * 1024, true);

    const snapshot = monitor.getSnapshot();
    assertEquals(snapshot.totalBytesTransferred, 1024 * 1024);
  },
});

Deno.test({
  name: "PerformanceMonitor - should calculate endpoint metrics",
  fn() {
    const monitor = new PerformanceMonitor();

    // Multiple requests to different endpoints
    monitor.record({
      path: "documents.upload",
      method: "mutation",
      durationMs: 100,
      success: true,
    });
    monitor.record({
      path: "documents.upload",
      method: "mutation",
      durationMs: 200,
      success: true,
    });
    monitor.record({
      path: "documents.upload",
      method: "mutation",
      durationMs: 300,
      success: false,
    });

    monitor.record({
      path: "documents.get",
      method: "query",
      durationMs: 50,
      success: true,
    });
    monitor.record({
      path: "documents.get",
      method: "query",
      durationMs: 60,
      success: true,
    });

    const snapshot = monitor.getSnapshot();
    assertEquals(snapshot.endpointMetrics.length, 2);

    const uploadMetrics = snapshot.endpointMetrics.find((m) =>
      m.path === "documents.upload"
    );
    assertExists(uploadMetrics);
    assertEquals(uploadMetrics.requestCount, 3);
    assertEquals(uploadMetrics.successCount, 2);
    assertEquals(uploadMetrics.errorCount, 1);
    assertEquals(uploadMetrics.errorRate, 1 / 3);

    const getMetrics = snapshot.endpointMetrics.find((m) =>
      m.path === "documents.get"
    );
    assertExists(getMetrics);
    assertEquals(getMetrics.requestCount, 2);
    assertEquals(getMetrics.errorRate, 0);
  },
});

Deno.test({
  name: "PerformanceMonitor - should prune old metrics",
  async fn() {
    const monitor = new PerformanceMonitor({ windowMs: 100 });

    monitor.record({
      path: "old",
      method: "query",
      durationMs: 50,
      success: true,
    });

    await new Promise((resolve) => setTimeout(resolve, 150));

    monitor.record({
      path: "new",
      method: "query",
      durationMs: 50,
      success: true,
    });

    const snapshot = monitor.getSnapshot();
    assertEquals(snapshot.totalRequests, 1);

    const metrics = snapshot.endpointMetrics;
    assertEquals(metrics.length, 1);
    assertEquals(metrics[0].path, "new");
  },
});

Deno.test({
  name: "PerformanceMonitor - should use startRequest timer",
  async fn() {
    const monitor = new PerformanceMonitor();

    const endTimer = monitor.startRequest("documents.get");

    // Simulate some work
    await new Promise((resolve) => setTimeout(resolve, 20));

    endTimer();

    const snapshot = monitor.getSnapshot();
    assertEquals(snapshot.totalRequests, 1);
    assertEquals(snapshot.avgResponseTimeMs >= 15, true);
  },
});

Deno.test({
  name: "PerformanceMonitor - should get slow queries sorted by duration",
  fn() {
    const monitor = new PerformanceMonitor({ slowQueryThresholdMs: 100 });

    monitor.record({
      path: "slow1",
      method: "query",
      durationMs: 200,
      success: true,
    });
    monitor.record({
      path: "slow2",
      method: "query",
      durationMs: 500,
      success: true,
    });
    monitor.record({
      path: "slow3",
      method: "query",
      durationMs: 300,
      success: true,
    });
    monitor.record({
      path: "fast",
      method: "query",
      durationMs: 50,
      success: true,
    });

    const slowQueries = monitor.getSlowQueries();

    assertEquals(slowQueries.length, 3);
    assertEquals(slowQueries[0].path, "slow2"); // Slowest first
    assertEquals(slowQueries[1].path, "slow3");
    assertEquals(slowQueries[2].path, "slow1");
  },
});

Deno.test({
  name: "PerformanceMonitor - should clear all metrics",
  fn() {
    const monitor = new PerformanceMonitor();

    monitor.record({
      path: "test",
      method: "query",
      durationMs: 100,
      success: true,
    });
    monitor.record({
      path: "test",
      method: "query",
      durationMs: 200,
      success: true,
    });

    monitor.clear();

    const snapshot = monitor.getSnapshot();
    assertEquals(snapshot.totalRequests, 0);
  },
});

Deno.test({
  name: "PerformanceMonitor - should get raw metrics",
  fn() {
    const monitor = new PerformanceMonitor();

    monitor.record({
      path: "test1",
      method: "query",
      durationMs: 100,
      success: true,
    });
    monitor.record({
      path: "test2",
      method: "mutation",
      durationMs: 200,
      success: false,
    });

    const raw = monitor.getRawMetrics();

    assertEquals(raw.length, 2);
    assertEquals(raw[0].path, "test1");
    assertEquals(raw[1].path, "test2");
    assertExists(raw[0].timestamp);
  },
});

Deno.test({
  name: "PerformanceMonitor - should limit max metrics history",
  fn() {
    const monitor = new PerformanceMonitor({ maxMetricsHistory: 10 });

    // Add 20 metrics
    for (let i = 0; i < 20; i++) {
      monitor.record({
        path: `test-${i}`,
        method: "query",
        durationMs: 50,
        success: true,
      });
    }

    const raw = monitor.getRawMetrics();
    assertEquals(raw.length <= 10, true);
  },
});

Deno.test({
  name: "PerformanceMonitor - should calculate min/max duration per endpoint",
  fn() {
    const monitor = new PerformanceMonitor();

    monitor.record({
      path: "test",
      method: "query",
      durationMs: 100,
      success: true,
    });
    monitor.record({
      path: "test",
      method: "query",
      durationMs: 50,
      success: true,
    });
    monitor.record({
      path: "test",
      method: "query",
      durationMs: 200,
      success: true,
    });

    const snapshot = monitor.getSnapshot();
    const endpointMetrics = snapshot.endpointMetrics.find((m) =>
      m.path === "test"
    );

    assertExists(endpointMetrics);
    assertEquals(endpointMetrics.minDurationMs, 50);
    assertEquals(endpointMetrics.maxDurationMs, 200);
  },
});

Deno.test({
  name: "PerformanceMonitor - should return empty snapshot when no data",
  fn() {
    const monitor = new PerformanceMonitor();

    const snapshot = monitor.getSnapshot();

    assertEquals(snapshot.totalRequests, 0);
    assertEquals(snapshot.successfulRequests, 0);
    assertEquals(snapshot.failedRequests, 0);
    assertEquals(snapshot.avgResponseTimeMs, 0);
    assertEquals(snapshot.p95ResponseTimeMs, 0);
    assertEquals(snapshot.slowQueries, 0);
    assertEquals(snapshot.totalBytesTransferred, 0);
    assertEquals(snapshot.overallThroughputMBps, 0);
    assertEquals(snapshot.endpointMetrics.length, 0);
  },
});

// Singleton tests
Deno.test({
  name: "getPerformanceMonitor - should return singleton instance",
  fn() {
    resetPerformanceMonitor();

    const monitor1 = getPerformanceMonitor();
    const monitor2 = getPerformanceMonitor();

    assertEquals(monitor1 === monitor2, true);

    resetPerformanceMonitor();
  },
});

Deno.test({
  name: "resetPerformanceMonitor - should clear and create new instance",
  fn() {
    const monitor1 = getPerformanceMonitor();
    monitor1.record({
      path: "test",
      method: "query",
      durationMs: 100,
      success: true,
    });

    resetPerformanceMonitor();

    const monitor2 = getPerformanceMonitor();
    const snapshot = monitor2.getSnapshot();
    assertEquals(snapshot.totalRequests, 0);

    resetPerformanceMonitor();
  },
});

// withTiming wrapper tests
Deno.test({
  name: "withTiming - should wrap async function with timing",
  async fn() {
    resetPerformanceMonitor();

    const wrappedFn = withTiming(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
      return 'result';
    }, "test.operation");

    const result = await wrappedFn();

    assertEquals(result, "result");

    const monitor = getPerformanceMonitor();
    const snapshot = monitor.getSnapshot();
    assertEquals(snapshot.totalRequests, 1);
    assertEquals(snapshot.avgResponseTimeMs >= 15, true);

    resetPerformanceMonitor();
  },
});
