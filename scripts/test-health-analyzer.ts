/**
 * Test Health Analyzer
 *
 * Analyzes test results to provide actionable insights:
 * - Slowest tests (sorted by duration)
 * - Most frequent failures
 * - Flaky test detection (inconsistent results across runs)
 * - Performance trends
 * - Actionable recommendations
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get script directory - ES module compatible
const __filename = fileURLToPath(import.meta.url);
const scriptDir = dirname(__filename);

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

interface TestHistory {
  testId: string; // `${file}::${name}`
  runs: Array<{
    timestamp: string;
    status: 'pass' | 'fail' | 'skip';
    duration: number;
    error?: string;
  }>;
  failureCount: number;
  passCount: number;
  skipCount: number;
  averageDuration: number;
  lastStatus: 'pass' | 'fail' | 'skip';
  isFlaky: boolean;
  flakinessScore: number; // 0-1, higher = more flaky
}

interface SlowTest {
  test: TestResult;
  duration: number;
  threshold: number;
  percentile: number; // How slow compared to other tests
}

interface FailureAnalysis {
  test: TestResult;
  failureCount: number;
  lastFailure: string;
  errorPattern: string; // Simplified error message pattern
}

interface FlakyTest {
  testId: string;
  file: string;
  name: string;
  flakinessScore: number;
  passRate: number;
  failureRate: number;
  recentRuns: Array<{ timestamp: string; status: 'pass' | 'fail' | 'skip' }>;
  recommendation: string;
}

interface HealthReport {
  timestamp: string;
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    totalDuration: number;
    averageTestDuration: number;
  };
  slowestTests: SlowTest[];
  mostFailures: FailureAnalysis[];
  flakyTests: FlakyTest[];
  asyncErrors: string[];
  recommendations: string[];
  performanceTrends?: {
    totalDurationChange: number;
    averageDurationChange: number;
    failureRateChange: number;
  };
}

const SLOW_THRESHOLD_MS = 5000; // 5 seconds
const VERY_SLOW_THRESHOLD_MS = 10000; // 10 seconds
const FLAKY_THRESHOLD = 0.3; // 30% inconsistency
const HISTORY_FILE = resolve(scriptDir, '../tests/reports/coverage/test-history.json');
const MAX_HISTORY_RUNS = 50; // Keep last 50 runs per test

/**
 * Get unique test identifier
 */
function getTestId(test: TestResult): string {
  return `${test.file}::${test.name}`;
}

/**
 * Load historical test data
 */
function loadTestHistory(): Map<string, TestHistory> {
  if (!existsSync(HISTORY_FILE)) {
    return new Map();
  }

  try {
    const data = JSON.parse(readFileSync(HISTORY_FILE, 'utf-8'));
    const history = new Map<string, TestHistory>();

    if (Array.isArray(data)) {
      // Legacy format: array of runs
      data.forEach((run: JSONReportOutput) => {
        if (run.tests) {
          run.tests.forEach((test) => {
            const testId = getTestId(test);
            if (!history.has(testId)) {
              history.set(testId, {
                testId,
                runs: [],
                failureCount: 0,
                passCount: 0,
                skipCount: 0,
                averageDuration: 0,
                lastStatus: test.status,
                isFlaky: false,
                flakinessScore: 0,
              });
            }

            const testHistory = history.get(testId)!;
            testHistory.runs.push({
              timestamp: run.timestamp,
              status: test.status,
              duration: test.duration,
              error: test.error,
            });

            // Keep only recent runs
            if (testHistory.runs.length > MAX_HISTORY_RUNS) {
              testHistory.runs.shift();
            }
          });
        }
      });
    } else if (data.tests) {
      // New format: map of test histories
      Object.entries(data.tests).forEach(([testId, testData]: [string, any]) => {
        history.set(testId, testData as TestHistory);
      });
    }

    // Recalculate statistics
    history.forEach((testHistory) => {
      testHistory.failureCount = testHistory.runs.filter((r) => r.status === 'fail').length;
      testHistory.passCount = testHistory.runs.filter((r) => r.status === 'pass').length;
      testHistory.skipCount = testHistory.runs.filter((r) => r.status === 'skip').length;
      testHistory.averageDuration =
        testHistory.runs.reduce((sum, r) => sum + r.duration, 0) / testHistory.runs.length || 0;

      if (testHistory.runs.length > 0) {
        testHistory.lastStatus = testHistory.runs[testHistory.runs.length - 1].status;
      }

      // Calculate flakiness score
      if (testHistory.runs.length >= 3) {
        const statuses = testHistory.runs.map((r) => r.status);
        const uniqueStatuses = new Set(statuses);
        const statusCounts = new Map<string, number>();

        statuses.forEach((status) => {
          statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
        });

        // Flakiness: inconsistency in results
        // If a test has both passes and failures, it's flaky
        const hasPassAndFail = statusCounts.has('pass') && statusCounts.has('fail');
        const totalRuns = testHistory.runs.length;
        const maxCount = Math.max(...Array.from(statusCounts.values()));
        const consistency = maxCount / totalRuns;

        testHistory.flakinessScore = hasPassAndFail
          ? 1 - consistency // More inconsistent = higher flakiness
          : 1 - consistency * 0.5; // Less flaky if only one status type

        testHistory.isFlaky = testHistory.flakinessScore >= FLAKY_THRESHOLD;
      }
    });

    return history;
  } catch (error) {
    console.warn('⚠️  Could not load test history:', error);
    return new Map();
  }
}

/**
 * Save historical test data
 */
function saveTestHistory(currentRun: JSONReportOutput, history: Map<string, TestHistory>): void {
  // Update history with current run
  if (currentRun.tests) {
    currentRun.tests.forEach((test) => {
      const testId = getTestId(test);
      if (!history.has(testId)) {
        history.set(testId, {
          testId,
          runs: [],
          failureCount: 0,
          passCount: 0,
          skipCount: 0,
          averageDuration: 0,
          lastStatus: test.status,
          isFlaky: false,
          flakinessScore: 0,
        });
      }

      const testHistory = history.get(testId)!;
      testHistory.runs.push({
        timestamp: currentRun.timestamp,
        status: test.status,
        duration: test.duration,
        error: test.error,
      });

      // Keep only recent runs
      if (testHistory.runs.length > MAX_HISTORY_RUNS) {
        testHistory.runs.shift();
      }

      // Recalculate stats
      testHistory.failureCount = testHistory.runs.filter((r) => r.status === 'fail').length;
      testHistory.passCount = testHistory.runs.filter((r) => r.status === 'pass').length;
      testHistory.skipCount = testHistory.runs.filter((r) => r.status === 'skip').length;
      testHistory.averageDuration =
        testHistory.runs.reduce((sum, r) => sum + r.duration, 0) / testHistory.runs.length || 0;
      testHistory.lastStatus = test.status;

      // Recalculate flakiness
      if (testHistory.runs.length >= 3) {
        const statuses = testHistory.runs.map((r) => r.status);
        const statusCounts = new Map<string, number>();

        statuses.forEach((status) => {
          statusCounts.set(status, (statusCounts.get(status) || 0) + 1);
        });

        const hasPassAndFail = statusCounts.has('pass') && statusCounts.has('fail');
        const totalRuns = testHistory.runs.length;
        const maxCount = Math.max(...Array.from(statusCounts.values()));
        const consistency = maxCount / totalRuns;

        testHistory.flakinessScore = hasPassAndFail
          ? 1 - consistency
          : 1 - consistency * 0.5;

        testHistory.isFlaky = testHistory.flakinessScore >= FLAKY_THRESHOLD;
      }
    });
  }

  // Save to file
  try {
    const dir = dirname(HISTORY_FILE);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    const dataToSave = {
      lastUpdated: new Date().toISOString(),
      tests: Object.fromEntries(history),
    };

    writeFileSync(HISTORY_FILE, JSON.stringify(dataToSave, null, 2));
  } catch (error) {
    console.warn('⚠️  Could not save test history:', error);
  }
}

/**
 * Analyze test health and provide actionable insights
 */
export function analyzeTestHealth(): HealthReport {
  const reportPath = resolve(scriptDir, '../tests/reports/coverage/test-results.json');
  const history = loadTestHistory();

  const report: HealthReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalTests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      totalDuration: 0,
      averageTestDuration: 0,
    },
    slowestTests: [],
    mostFailures: [],
    flakyTests: [],
    asyncErrors: [],
    recommendations: [],
  };

  try {
    const data: JSONReportOutput = JSON.parse(readFileSync(reportPath, 'utf-8'));

    // Summary
    report.summary = {
      totalTests: data.totalTests,
      passed: data.passed,
      failed: data.failed,
      skipped: data.skipped,
      totalDuration: data.duration,
      averageTestDuration: data.duration / data.totalTests || 0,
    };

    if (!data.tests || data.tests.length === 0) {
      report.recommendations.push('⚠️  No test results found. Run tests first.');
      return report;
    }

    // Calculate percentiles for duration analysis
    const durations = data.tests.map((t) => t.duration).sort((a, b) => a - b);
    const p50 = durations[Math.floor(durations.length * 0.5)] || 0;
    const p90 = durations[Math.floor(durations.length * 0.9)] || 0;
    const p95 = durations[Math.floor(durations.length * 0.95)] || 0;

    // Identify slowest tests
    const slowTests = data.tests
      .filter((test) => test.duration > SLOW_THRESHOLD_MS)
      .map((test) => {
        const percentile =
          durations.filter((d) => d < test.duration).length / durations.length;
        return {
          test,
          duration: test.duration,
          threshold: SLOW_THRESHOLD_MS,
          percentile: Math.round(percentile * 100),
        };
      })
      .sort((a, b) => b.duration - a.duration);

    report.slowestTests = slowTests;

    // Identify most frequent failures
    const failureMap = new Map<string, FailureAnalysis>();

    data.tests
      .filter((test) => test.status === 'fail')
      .forEach((test) => {
        const testId = getTestId(test);
        if (!failureMap.has(testId)) {
          const testHistory = history.get(testId);
          failureMap.set(testId, {
            test,
            failureCount: testHistory?.failureCount || 1,
            lastFailure: data.timestamp,
            errorPattern: test.error
              ? test.error.substring(0, 100).replace(/\s+/g, ' ')
              : 'Unknown error',
          });
        } else {
          const existing = failureMap.get(testId)!;
          existing.failureCount++;
        }
      });

    // Also include historical failures
    history.forEach((testHistory, testId) => {
      if (testHistory.failureCount > 0 && !failureMap.has(testId)) {
        // Find the test in current run
        const currentTest = data.tests.find((t) => getTestId(t) === testId);
        if (currentTest) {
          failureMap.set(testId, {
            test: currentTest,
            failureCount: testHistory.failureCount,
            lastFailure: testHistory.runs[testHistory.runs.length - 1]?.timestamp || 'Unknown',
            errorPattern: testHistory.runs
              .filter((r) => r.error)
              .map((r) => r.error?.substring(0, 100).replace(/\s+/g, ' ') || '')
              .find((e) => e) || 'Unknown error',
          });
        }
      }
    });

    report.mostFailures = Array.from(failureMap.values())
      .sort((a, b) => b.failureCount - a.failureCount)
      .slice(0, 20); // Top 20

    // Detect flaky tests
    const flakyTests: FlakyTest[] = [];

    history.forEach((testHistory, testId) => {
      if (testHistory.isFlaky && testHistory.runs.length >= 3) {
        const currentTest = data.tests.find((t) => getTestId(t) === testId);
        if (currentTest) {
          const totalRuns = testHistory.runs.length;
          const passRate = testHistory.passCount / totalRuns;
          const failureRate = testHistory.failureCount / totalRuns;

          let recommendation = '';
          if (failureRate > 0.5) {
            recommendation = 'High failure rate - investigate root cause';
          } else if (passRate < 0.7) {
            recommendation = 'Inconsistent results - check for race conditions or timing issues';
          } else {
            recommendation = 'Occasional failures - review error patterns';
          }

          flakyTests.push({
            testId,
            file: currentTest.file,
            name: currentTest.name,
            flakinessScore: Math.round(testHistory.flakinessScore * 100),
            passRate: Math.round(passRate * 100),
            failureRate: Math.round(failureRate * 100),
            recentRuns: testHistory.runs.slice(-10).map((r) => ({
              timestamp: r.timestamp,
              status: r.status,
            })),
            recommendation,
          });
        }
      }
    });

    report.flakyTests = flakyTests.sort((a, b) => b.flakinessScore - a.flakinessScore);

    // Check for async errors
    try {
      const asyncErrorPath = resolve(scriptDir, '../tests/reports/coverage/async-errors.json');
      if (existsSync(asyncErrorPath)) {
        const asyncErrorData = JSON.parse(readFileSync(asyncErrorPath, 'utf-8'));
        report.asyncErrors = asyncErrorData.errors?.map((e: any) => e.error || e.message) || [];
      }
    } catch {
      // No async errors file
    }

    // Generate actionable recommendations
    if (report.slowestTests.length > 0) {
      const verySlow = report.slowestTests.filter((t) => t.duration > VERY_SLOW_THRESHOLD_MS);
      if (verySlow.length > 0) {
        report.recommendations.push(
          `🐌 ${verySlow.length} very slow test(s) (>${VERY_SLOW_THRESHOLD_MS}ms). Consider splitting or optimizing these tests.`,
        );
      } else {
        report.recommendations.push(
          `⏱️  ${report.slowestTests.length} slow test(s) (>${SLOW_THRESHOLD_MS}ms). Monitor for performance regressions.`,
        );
      }
    }

    if (report.mostFailures.length > 0) {
      const topFailure = report.mostFailures[0];
      report.recommendations.push(
        `❌ ${report.mostFailures.length} test(s) with failures. Top failure: "${topFailure.test.name}" (${topFailure.failureCount} failure(s)).`,
      );
    }

    if (report.flakyTests.length > 0) {
      report.recommendations.push(
        `🔄 ${report.flakyTests.length} flaky test(s) detected. These tests have inconsistent results across runs.`,
      );
    }

    if (report.asyncErrors.length > 0) {
      report.recommendations.push(
        `⚠️  ${report.asyncErrors.length} async error(s) detected. Check for unhandled promise rejections.`,
      );
    }

    if (data.failed > 0) {
      const failureRate = (data.failed / data.totalTests) * 100;
      if (failureRate > 10) {
        report.recommendations.push(
          `📉 High failure rate: ${failureRate.toFixed(1)}%. Review test suite health.`,
        );
      }
    }

    // Performance insights
    if (p95 > SLOW_THRESHOLD_MS) {
      report.recommendations.push(
        `📊 95th percentile test duration is ${Math.round(p95)}ms. Consider optimizing slowest tests.`,
      );
    }

    if (
      report.slowestTests.length === 0 &&
      report.mostFailures.length === 0 &&
      report.flakyTests.length === 0 &&
      data.failed === 0
    ) {
      report.recommendations.push('✅ All tests passing! No health issues detected.');
    }

    // Save history for next run
    saveTestHistory(data, history);
  } catch (error: any) {
    if (error?.code === 'ENOENT' && error?.path?.includes('test-results.json')) {
      report.recommendations.push(
        '📝 No test results found. Run tests first to generate results: `pnpm test:unit`',
      );
    } else {
      console.warn('⚠️  Could not analyze test results:', error);
      report.recommendations.push(`❌ Error analyzing test results: ${error?.message || error}`);
    }
  }

  return report;
}

/**
 * Format duration for display
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Truncate file path for display
 */
function truncatePath(path: string, maxLength = 60): string {
  if (path.length <= maxLength) {
    return path;
  }
  const parts = path.split('/');
  if (parts.length > 2) {
    return `.../${parts.slice(-2).join('/')}`;
  }
  return `...${path.slice(-maxLength + 3)}`;
}

// Print health report if run directly
// Check if this is the main module (ES module compatible)
const isMainModule = import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('test-health-analyzer.ts');
if (isMainModule) {
  const report = analyzeTestHealth();

  console.log('\n📊 Test Health Report');
  console.log('═'.repeat(80));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`\nSummary:`);
  console.log(`  Total Tests: ${report.summary.totalTests}`);
  console.log(`  Passed: ${report.summary.passed} ✅`);
  console.log(`  Failed: ${report.summary.failed} ${report.summary.failed > 0 ? '❌' : ''}`);
  console.log(`  Skipped: ${report.summary.skipped}`);
  console.log(`  Total Duration: ${formatDuration(report.summary.totalDuration)}`);
  console.log(
    `  Average Test Duration: ${formatDuration(report.summary.averageTestDuration)}`,
  );

  if (report.slowestTests.length > 0) {
    console.log(`\n🐌 Slowest Tests (Top 10):`);
    report.slowestTests.slice(0, 10).forEach((slowTest, index) => {
      const { test, duration, percentile } = slowTest;
      const icon = duration > VERY_SLOW_THRESHOLD_MS ? '🐌' : '⏱️';
      console.log(
        `  ${index + 1}. ${icon} ${test.name} - ${formatDuration(duration)} (${percentile}th percentile)`,
      );
      console.log(`     ${truncatePath(test.file)}`);
    });
  }

  if (report.mostFailures.length > 0) {
    console.log(`\n❌ Most Frequent Failures (Top 10):`);
    report.mostFailures.slice(0, 10).forEach((failure, index) => {
      const { test, failureCount, errorPattern } = failure;
      console.log(`  ${index + 1}. ${test.name} - ${failureCount} failure(s)`);
      console.log(`     ${truncatePath(test.file)}`);
      if (errorPattern && errorPattern !== 'Unknown error') {
        console.log(`     Error: ${errorPattern.substring(0, 80)}...`);
      }
    });
  }

  if (report.flakyTests.length > 0) {
    console.log(`\n🔄 Flaky Tests (Top 10):`);
    report.flakyTests.slice(0, 10).forEach((flaky, index) => {
      const { name, file, flakinessScore, passRate, failureRate, recommendation } = flaky;
      console.log(`  ${index + 1}. ${name} - Flakiness: ${flakinessScore}%`);
      console.log(`     ${truncatePath(file)}`);
      console.log(`     Pass Rate: ${passRate}% | Failure Rate: ${failureRate}%`);
      console.log(`     💡 ${recommendation}`);
      console.log(
        `     Recent: ${flaky.recentRuns.map((r) => r.status === 'pass' ? '✅' : r.status === 'fail' ? '❌' : '⏭️').join(' ')}`,
      );
    });
  }

  if (report.asyncErrors.length > 0) {
    console.log(`\n⚠️  Async Errors:`);
    report.asyncErrors.slice(0, 5).forEach((error, index) => {
      console.log(`  ${index + 1}. ${error.substring(0, 100)}...`);
    });
  }

  if (report.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    report.recommendations.forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
  }

  console.log('═'.repeat(80) + '\n');
}
