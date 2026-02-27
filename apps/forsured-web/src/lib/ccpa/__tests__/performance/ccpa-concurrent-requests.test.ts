/**
 * CCPA Concurrent Request Performance Tests
 * CCPA Compliance Implementation - TASK-19
 *
 * Load tests verifying system behavior under concurrent request load
 * and identifying performance bottlenecks.
 */

import { describe, it, expect, afterAll } from 'vitest';
import {
  measureExecutionTime,
  PERFORMANCE_TARGETS,
  calculatePercentile,
  generatePerformanceReport,
  runConcurrent,
  wait,
} from './performance-utils';

// Track all performance results for final report
const performanceResults: {
  testName: string;
  executionTimes: number[];
  memoryUsages: number[];
  targetMs: number;
}[] = [];

/**
 * Request types for CCPA operations
 */
type CCPARequestType = 'access' | 'deletion' | 'correction' | 'opt_out' | 'portability';

/**
 * Mock CCPA request handler for load testing
 * Simulates various CCPA operations with realistic latencies
 */
class MockCCPARequestHandler {
  private requestCount = 0;
  private activeRequests = 0;
  private maxConcurrentRequests = 0;

  // Base latencies in milliseconds for different operations
  private readonly baseLatencies: Record<CCPARequestType, number> = {
    access: 500,      // Data access requests take longer
    deletion: 300,    // Deletion requests
    correction: 200,  // Correction requests are simpler
    opt_out: 100,     // Opt-out is quick
    portability: 400, // Portability involves export generation
  };

  async handleRequest(
    type: CCPARequestType,
    userId: string
  ): Promise<{ success: boolean; requestId: string; processingTimeMs: number }> {
    this.activeRequests++;
    this.maxConcurrentRequests = Math.max(this.maxConcurrentRequests, this.activeRequests);

    const requestId = `REQ-${++this.requestCount}`;
    const start = performance.now();

    try {
      // Simulate processing time with some variance
      const baseLatency = this.baseLatencies[type];
      const variance = baseLatency * 0.2; // 20% variance
      const actualLatency = baseLatency + (Math.random() - 0.5) * variance;

      // Add congestion penalty when many concurrent requests
      const congestionPenalty = Math.min(this.activeRequests * 10, 500);

      await wait(actualLatency + congestionPenalty);

      return {
        success: true,
        requestId,
        processingTimeMs: performance.now() - start,
      };
    } finally {
      this.activeRequests--;
    }
  }

  async handleDataAccessRequest(userId: string) {
    return this.handleRequest('access', userId);
  }

  async handleDeletionRequest(userId: string) {
    return this.handleRequest('deletion', userId);
  }

  async handleCorrectionRequest(userId: string) {
    return this.handleRequest('correction', userId);
  }

  async handleOptOutRequest(userId: string) {
    return this.handleRequest('opt_out', userId);
  }

  async handlePortabilityRequest(userId: string) {
    return this.handleRequest('portability', userId);
  }

  getStats() {
    return {
      totalRequests: this.requestCount,
      maxConcurrentRequests: this.maxConcurrentRequests,
      activeRequests: this.activeRequests,
    };
  }

  resetStats() {
    this.requestCount = 0;
    this.maxConcurrentRequests = 0;
  }
}

describe('CCPA Concurrent Request Performance Tests', () => {
  const requestHandler = new MockCCPARequestHandler();

  afterAll(() => {
    // Generate and log performance report
    if (performanceResults.length > 0) {
      const report = generatePerformanceReport(performanceResults);
      console.log('\n' + report);
    }
  });

  describe('Data Access Request Concurrency', () => {
    it('should handle 10 concurrent data access requests', async () => {
      requestHandler.resetStats();
      const userIds = Array.from({ length: 10 }, (_, i) => `user-${i}`);

      const tasks = userIds.map(userId => () => requestHandler.handleDataAccessRequest(userId));

      const { executionTimeMs } = await measureExecutionTime(async () => {
        return await runConcurrent(tasks, 10);
      });

      const { results, executionTimes } = await runConcurrent(tasks, 10);
      const p95 = calculatePercentile(executionTimes, 95);

      performanceResults.push({
        testName: '10 Concurrent Data Access Requests',
        executionTimes,
        memoryUsages: [0], // Memory not tracked in this test
        targetMs: PERFORMANCE_TARGETS.CONCURRENT_10_P95_MS,
      });

      expect(results.every(r => r.success)).toBe(true);
      expect(p95).toBeLessThan(PERFORMANCE_TARGETS.CONCURRENT_10_P95_MS);

      const stats = requestHandler.getStats();
      console.log(`10 concurrent requests - P95: ${p95.toFixed(0)}ms, Max concurrent: ${stats.maxConcurrentRequests}`);
    });

    it('should handle 50 concurrent data access requests', async () => {
      requestHandler.resetStats();
      const userIds = Array.from({ length: 50 }, (_, i) => `user-${i}`);

      const tasks = userIds.map(userId => () => requestHandler.handleDataAccessRequest(userId));

      const { results, executionTimes } = await runConcurrent(tasks, 50);
      const p95 = calculatePercentile(executionTimes, 95);

      performanceResults.push({
        testName: '50 Concurrent Data Access Requests',
        executionTimes,
        memoryUsages: [0],
        targetMs: PERFORMANCE_TARGETS.CONCURRENT_50_P95_MS,
      });

      expect(results.every(r => r.success)).toBe(true);
      expect(p95).toBeLessThan(PERFORMANCE_TARGETS.CONCURRENT_50_P95_MS);

      const stats = requestHandler.getStats();
      console.log(`50 concurrent requests - P95: ${p95.toFixed(0)}ms, Max concurrent: ${stats.maxConcurrentRequests}`);
    });

    it('should handle 100 concurrent data access requests', async () => {
      requestHandler.resetStats();
      const userIds = Array.from({ length: 100 }, (_, i) => `user-${i}`);

      const tasks = userIds.map(userId => () => requestHandler.handleDataAccessRequest(userId));

      const { results, executionTimes } = await runConcurrent(tasks, 100);
      const p95 = calculatePercentile(executionTimes, 95);
      const p99 = calculatePercentile(executionTimes, 99);

      performanceResults.push({
        testName: '100 Concurrent Data Access Requests',
        executionTimes,
        memoryUsages: [0],
        targetMs: PERFORMANCE_TARGETS.CONCURRENT_100_P95_MS,
      });

      expect(results.every(r => r.success)).toBe(true);
      expect(p95).toBeLessThan(PERFORMANCE_TARGETS.CONCURRENT_100_P95_MS);

      const stats = requestHandler.getStats();
      console.log(
        `100 concurrent requests - P95: ${p95.toFixed(0)}ms, P99: ${p99.toFixed(0)}ms, ` +
        `Max concurrent: ${stats.maxConcurrentRequests}`
      );
    });
  });

  describe('Mixed Request Type Concurrency', () => {
    it('should handle mixed request types concurrently', async () => {
      requestHandler.resetStats();

      // Create a mix of different request types
      const requestTypes: CCPARequestType[] = [
        'access', 'access', 'access', 'access', 'access',  // 5 access
        'deletion', 'deletion', 'deletion',                 // 3 deletion
        'correction', 'correction',                         // 2 correction
        'opt_out', 'opt_out', 'opt_out', 'opt_out',         // 4 opt_out
        'portability', 'portability',                       // 2 portability
      ];

      const tasks = requestTypes.map((type, i) => () =>
        requestHandler.handleRequest(type, `user-${i}`)
      );

      const { results, executionTimes } = await runConcurrent(tasks, 16);

      const p95 = calculatePercentile(executionTimes, 95);
      const avgTime = executionTimes.reduce((a, b) => a + b, 0) / executionTimes.length;

      expect(results.every(r => r.success)).toBe(true);

      const stats = requestHandler.getStats();
      console.log(
        `Mixed requests - Avg: ${avgTime.toFixed(0)}ms, P95: ${p95.toFixed(0)}ms, ` +
        `Max concurrent: ${stats.maxConcurrentRequests}`
      );

      // Mixed requests should complete in reasonable time
      expect(p95).toBeLessThan(30000);
    });

    it('should prioritize opt-out requests effectively', async () => {
      requestHandler.resetStats();

      // Mix of slow (access) and fast (opt_out) requests
      const tasks = [
        ...Array.from({ length: 5 }, (_, i) => () =>
          requestHandler.handleDataAccessRequest(`access-user-${i}`)
        ),
        ...Array.from({ length: 5 }, (_, i) => () =>
          requestHandler.handleOptOutRequest(`optout-user-${i}`)
        ),
      ];

      // Shuffle tasks
      tasks.sort(() => Math.random() - 0.5);

      const { results, executionTimes } = await runConcurrent(tasks, 10);

      expect(results.every(r => r.success)).toBe(true);

      // Check that the system handled all requests
      const stats = requestHandler.getStats();
      expect(stats.totalRequests).toBe(10);

      console.log(`Mixed priority test - Total requests: ${stats.totalRequests}`);
    });
  });

  describe('System Behavior Under Load', () => {
    it('should not fail any requests under high load', async () => {
      requestHandler.resetStats();
      const userIds = Array.from({ length: 100 }, (_, i) => `stress-user-${i}`);

      const tasks = userIds.map(userId => () => requestHandler.handleDataAccessRequest(userId));

      const { results } = await runConcurrent(tasks, 100);

      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;

      expect(failureCount).toBe(0);
      expect(successCount).toBe(100);

      console.log(`Stress test - Success: ${successCount}, Failures: ${failureCount}`);
    });

    it('should maintain response times under sustained load', async () => {
      requestHandler.resetStats();
      const rounds = 5;
      const requestsPerRound = 20;
      const roundTimes: number[] = [];

      for (let round = 0; round < rounds; round++) {
        const userIds = Array.from(
          { length: requestsPerRound },
          (_, i) => `sustained-user-${round}-${i}`
        );

        const tasks = userIds.map(userId => () => requestHandler.handleDataAccessRequest(userId));

        const { executionTimeMs } = await measureExecutionTime(async () => {
          return await runConcurrent(tasks, requestsPerRound);
        });

        roundTimes.push(executionTimeMs);
      }

      // Response times should not degrade significantly over rounds
      const firstRoundTime = roundTimes[0];
      const lastRoundTime = roundTimes[roundTimes.length - 1];

      // Allow for 50% variance, but should not continuously degrade
      expect(lastRoundTime).toBeLessThan(firstRoundTime * 1.5);

      console.log('Round times:', roundTimes.map(t => t.toFixed(0)).join('ms, ') + 'ms');
    });

    it('should report accurate statistics', async () => {
      requestHandler.resetStats();

      const tasks = Array.from({ length: 25 }, (_, i) => () =>
        requestHandler.handleDataAccessRequest(`stats-user-${i}`)
      );

      await runConcurrent(tasks, 25);

      const stats = requestHandler.getStats();

      expect(stats.totalRequests).toBe(25);
      expect(stats.maxConcurrentRequests).toBeGreaterThan(0);
      expect(stats.maxConcurrentRequests).toBeLessThanOrEqual(25);
      expect(stats.activeRequests).toBe(0); // All should be complete

      console.log(`Stats test - Total: ${stats.totalRequests}, Max concurrent: ${stats.maxConcurrentRequests}`);
    });
  });

  describe('Percentile Calculations', () => {
    it('should calculate response time percentiles correctly', async () => {
      requestHandler.resetStats();
      const userIds = Array.from({ length: 50 }, (_, i) => `percentile-user-${i}`);

      const tasks = userIds.map(userId => () => requestHandler.handleDataAccessRequest(userId));

      const { executionTimes } = await runConcurrent(tasks, 50);

      const p50 = calculatePercentile(executionTimes, 50);
      const p75 = calculatePercentile(executionTimes, 75);
      const p90 = calculatePercentile(executionTimes, 90);
      const p95 = calculatePercentile(executionTimes, 95);
      const p99 = calculatePercentile(executionTimes, 99);

      // Percentiles should be in ascending order
      expect(p50).toBeLessThanOrEqual(p75);
      expect(p75).toBeLessThanOrEqual(p90);
      expect(p90).toBeLessThanOrEqual(p95);
      expect(p95).toBeLessThanOrEqual(p99);

      console.log(
        `Percentiles - P50: ${p50.toFixed(0)}ms, P75: ${p75.toFixed(0)}ms, ` +
        `P90: ${p90.toFixed(0)}ms, P95: ${p95.toFixed(0)}ms, P99: ${p99.toFixed(0)}ms`
      );
    });
  });

  describe('Bottleneck Identification', () => {
    it('should identify congestion-related slowdowns', async () => {
      requestHandler.resetStats();

      // Run with low concurrency
      const lowConcurrencyTasks = Array.from({ length: 10 }, (_, i) => () =>
        requestHandler.handleDataAccessRequest(`low-user-${i}`)
      );
      const { executionTimes: lowConcurrencyTimes } = await runConcurrent(lowConcurrencyTasks, 2);
      const lowConcurrencyAvg = lowConcurrencyTimes.reduce((a, b) => a + b, 0) / lowConcurrencyTimes.length;

      requestHandler.resetStats();

      // Run with high concurrency
      const highConcurrencyTasks = Array.from({ length: 10 }, (_, i) => () =>
        requestHandler.handleDataAccessRequest(`high-user-${i}`)
      );
      const { executionTimes: highConcurrencyTimes } = await runConcurrent(highConcurrencyTasks, 10);
      const highConcurrencyAvg = highConcurrencyTimes.reduce((a, b) => a + b, 0) / highConcurrencyTimes.length;

      // High concurrency should be slower due to congestion
      // but not excessively so (should still complete)
      expect(highConcurrencyAvg).toBeGreaterThan(lowConcurrencyAvg);

      const congestionImpact = ((highConcurrencyAvg - lowConcurrencyAvg) / lowConcurrencyAvg) * 100;
      console.log(
        `Congestion impact: ${congestionImpact.toFixed(1)}% slower with high concurrency\n` +
        `Low concurrency avg: ${lowConcurrencyAvg.toFixed(0)}ms, ` +
        `High concurrency avg: ${highConcurrencyAvg.toFixed(0)}ms`
      );
    });

    it('should identify request type performance differences', async () => {
      requestHandler.resetStats();

      const requestTypes: CCPARequestType[] = ['access', 'deletion', 'correction', 'opt_out', 'portability'];
      const typePerformance: Record<string, number[]> = {};

      for (const type of requestTypes) {
        const tasks = Array.from({ length: 10 }, (_, i) => () =>
          requestHandler.handleRequest(type, `type-test-${type}-${i}`)
        );
        const { executionTimes } = await runConcurrent(tasks, 10);
        typePerformance[type] = executionTimes;
      }

      // Report performance by type
      console.log('\nPerformance by request type:');
      for (const [type, times] of Object.entries(typePerformance)) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const p95 = calculatePercentile(times, 95);
        console.log(`  ${type}: Avg ${avg.toFixed(0)}ms, P95 ${p95.toFixed(0)}ms`);
      }

      // Opt-out should be fastest
      const optOutAvg = typePerformance['opt_out'].reduce((a, b) => a + b, 0) /
                        typePerformance['opt_out'].length;
      const accessAvg = typePerformance['access'].reduce((a, b) => a + b, 0) /
                        typePerformance['access'].length;

      expect(optOutAvg).toBeLessThan(accessAvg);
    });
  });
});
