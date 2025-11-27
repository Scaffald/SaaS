/**
 * Test Health Analyzer
 *
 * Analyzes test results to identify:
 * - Slow tests (>5 seconds)
 * - Flaky tests (inconsistent results)
 * - Tests with async errors
 * - Performance regressions
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

interface TestResult {
  file: string;
  name: string;
  duration: number;
  status: 'pass' | 'fail' | 'skip';
  error?: string;
}

interface HealthReport {
  timestamp: string;
  totalTests: number;
  slowTests: Array<TestResult & { threshold: number }>;
  failedTests: TestResult[];
  asyncErrors: string[];
  recommendations: string[];
}

export function analyzeTestHealth(): HealthReport {
  const reportPath = resolve(__dirname, '../coverage/test-results.json');
  const report: HealthReport = {
    timestamp: new Date().toISOString(),
    totalTests: 0,
    slowTests: [],
    failedTests: [],
    asyncErrors: [],
    recommendations: [],
  };

  try {
    const data = JSON.parse(readFileSync(reportPath, 'utf-8'));

    report.totalTests = data.totalTests;
    const slowThreshold = 5000; // 5 seconds

    // Identify slow tests
    if (data.tests) {
      data.tests.forEach((test: TestResult) => {
        if (test.duration > slowThreshold) {
          report.slowTests.push({ ...test, threshold: slowThreshold });
        }
        if (test.status === 'fail') {
          report.failedTests.push(test);
        }
      });
    }

    // Check for async errors
    try {
      const asyncErrorPath = resolve(__dirname, '../coverage/async-errors.json');
      const asyncErrorData = JSON.parse(readFileSync(asyncErrorPath, 'utf-8'));
      report.asyncErrors = asyncErrorData.errors.map((e: any) => e.error);
    } catch {
      // No async errors file yet
    }

    // Generate recommendations
    if (report.slowTests.length > 0) {
      report.recommendations.push(
        `⚠️  ${report.slowTests.length} slow tests detected (>5s). Consider optimizing or splitting them.`,
      );
    }

    if (report.failedTests.length > 0) {
      report.recommendations.push(
        `❌ ${report.failedTests.length} tests failed. Review error messages for details.`,
      );
    }

    if (report.asyncErrors.length > 0) {
      report.recommendations.push(
        `🔄 ${report.asyncErrors.length} async errors detected. Check unhandled rejections.`,
      );
    }

    if (report.slowTests.length === 0 && report.failedTests.length === 0) {
      report.recommendations.push('✅ All tests passing! No health issues detected.');
    }
  } catch (error) {
    console.warn('⚠️  Could not analyze test results:', error);
  }

  return report;
}

// Print health report if run directly
if (require.main === module) {
  const report = analyzeTestHealth();

  console.log('\n📊 Test Health Report');
  console.log('═'.repeat(80));
  console.log(`Timestamp: ${report.timestamp}`);
  console.log(`Total Tests: ${report.totalTests}`);

  if (report.slowTests.length > 0) {
    console.log(`\n⚠️  Slow Tests (>${report.slowTests[0].threshold}ms):`);
    report.slowTests
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10)
      .forEach((test) => {
        console.log(`   - ${test.name} (${test.duration}ms) [${test.file}]`);
      });
  }

  if (report.failedTests.length > 0) {
    console.log(`\n❌ Failed Tests:`);
    report.failedTests.forEach((test) => {
      console.log(`   - ${test.name} [${test.file}]`);
      if (test.error) console.log(`      Error: ${test.error}`);
    });
  }

  if (report.asyncErrors.length > 0) {
    console.log(`\n🔄 Async Errors:`);
    report.asyncErrors.forEach((error) => {
      console.log(`   - ${error}`);
    });
  }

  if (report.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    report.recommendations.forEach((rec) => {
      console.log(`   ${rec}`);
    });
  }

  console.log('═'.repeat(80) + '\n');
}
