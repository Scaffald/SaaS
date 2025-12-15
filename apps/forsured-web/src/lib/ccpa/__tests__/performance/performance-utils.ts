/**
 * Performance Test Utilities
 * REQ-3: CCPA Compliance Implementation - TASK-19
 *
 * Common utilities for CCPA performance testing including:
 * - Execution time measurement
 * - Memory usage tracking
 * - Test data generators
 * - Performance report generation
 */

/**
 * Performance measurement result
 */
export interface PerformanceResult {
  executionTimeMs: number;
  memoryUsageMB: number;
  peakMemoryMB: number;
  success: boolean;
  error?: string;
}

/**
 * Measure execution time of an async function
 */
export async function measureExecutionTime<T>(
  fn: () => Promise<T>
): Promise<{ result: T; executionTimeMs: number }> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  return {
    result,
    executionTimeMs: end - start,
  };
}

/**
 * Measure memory usage before and after execution
 * Note: In browser/Node, memory APIs vary. This provides approximations.
 */
export async function measureMemoryUsage<T>(
  fn: () => Promise<T>
): Promise<PerformanceResult & { result: T }> {
  // Get initial memory (if available)
  const initialMemory = getMemoryUsage();
  const start = performance.now();

  let result: T;
  let peakMemory = initialMemory;
  let error: string | undefined;

  try {
    result = await fn();
    peakMemory = Math.max(peakMemory, getMemoryUsage());
    const end = performance.now();
    const finalMemory = getMemoryUsage();

    return {
      result,
      executionTimeMs: end - start,
      memoryUsageMB: finalMemory - initialMemory,
      peakMemoryMB: peakMemory,
      success: true,
    };
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
    return {
      result: undefined as unknown as T,
      executionTimeMs: performance.now() - start,
      memoryUsageMB: 0,
      peakMemoryMB: peakMemory,
      success: false,
      error,
    };
  }
}

/**
 * Get current memory usage in MB
 */
function getMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    // Node.js environment
    return process.memoryUsage().heapUsed / (1024 * 1024);
  }
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    // Chrome-like browsers with memory API
    const memory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
    return memory.usedJSHeapSize / (1024 * 1024);
  }
  return 0;
}

/**
 * Performance targets for CCPA exports
 */
export const PERFORMANCE_TARGETS = {
  // Export generation targets by data size
  EXPORT_MINIMAL_DATA_MS: 5000,      // <1MB data: <5 seconds
  EXPORT_AVERAGE_DATA_MS: 15000,     // 1-10MB data: <15 seconds
  EXPORT_LARGE_DATA_MS: 45000,       // 10-100MB data: <45 seconds
  EXPORT_MAXIMUM_DATA_MS: 90000,     // 100MB+ data: <90 seconds

  // PDF generation targets
  PDF_100_SKILLS_MS: 10000,          // 100 skills: <10 seconds
  PDF_50_WORK_LOGS_MS: 15000,        // 50 work logs: <15 seconds
  PDF_ALL_CATEGORIES_MS: 30000,      // All categories maxed: <30 seconds

  // Memory limits
  MAX_MEMORY_MB: 512,                // Maximum memory usage

  // Concurrent request targets
  CONCURRENT_10_P95_MS: 30000,       // 10 concurrent: P95 <30s
  CONCURRENT_50_P95_MS: 45000,       // 50 concurrent: P95 <45s
  CONCURRENT_100_P95_MS: 60000,      // 100 concurrent: P95 <60s
};

/**
 * Test data sizes
 */
export const DATA_SIZES = {
  MINIMAL: { records: 10, approximateMB: 0.5 },
  AVERAGE: { records: 100, approximateMB: 5 },
  LARGE: { records: 1000, approximateMB: 50 },
  MAXIMUM: { records: 5000, approximateMB: 150 },
};

/**
 * Create mock user data with minimal records (<1MB)
 */
export function createMinimalUserData() {
  return {
    user_id: `perf-test-user-minimal-${Date.now()}`,
    profile: {
      name: 'Test User Minimal',
      email: 'minimal@test.com',
      created_at: new Date().toISOString(),
    },
    documents: generateDocuments(5),
    tasks: generateTasks(3),
    projects: [],
    policies: generatePolicies(2),
    compliance_records: [],
  };
}

/**
 * Create mock user data with average records (1-10MB)
 */
export function createAverageUserData() {
  return {
    user_id: `perf-test-user-average-${Date.now()}`,
    profile: {
      name: 'Test User Average',
      email: 'average@test.com',
      created_at: new Date().toISOString(),
    },
    documents: generateDocuments(50),
    tasks: generateTasks(30),
    projects: generateProjects(10),
    policies: generatePolicies(15),
    compliance_records: generateComplianceRecords(20),
  };
}

/**
 * Create mock user data with large records (10-100MB)
 */
export function createLargeUserData() {
  return {
    user_id: `perf-test-user-large-${Date.now()}`,
    profile: {
      name: 'Test User Large',
      email: 'large@test.com',
      created_at: new Date().toISOString(),
    },
    documents: generateDocuments(500),
    tasks: generateTasks(300),
    projects: generateProjects(100),
    policies: generatePolicies(150),
    compliance_records: generateComplianceRecords(200),
  };
}

/**
 * Create mock user data with maximum records (100MB+)
 */
export function createMaximumUserData() {
  return {
    user_id: `perf-test-user-maximum-${Date.now()}`,
    profile: {
      name: 'Test User Maximum',
      email: 'maximum@test.com',
      created_at: new Date().toISOString(),
    },
    documents: generateDocuments(2000),
    tasks: generateTasks(1500),
    projects: generateProjects(500),
    policies: generatePolicies(800),
    compliance_records: generateComplianceRecords(1000),
  };
}

/**
 * Generate mock documents
 */
function generateDocuments(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `doc-${i}`,
    file_name: `document_${i}.pdf`,
    file_type: 'application/pdf',
    file_size: Math.floor(Math.random() * 1000000) + 10000, // 10KB - 1MB
    uploaded_at: new Date(Date.now() - i * 86400000).toISOString(),
    document_type: ['policy', 'certificate', 'contract', 'report'][i % 4],
    description: `Test document ${i} with sample description text that adds some size to the export data.`,
  }));
}

/**
 * Generate mock tasks
 */
function generateTasks(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `task-${i}`,
    title: `Task ${i}: Compliance review and documentation`,
    description: `Detailed task description for task ${i}. This includes various compliance requirements and documentation needs.`,
    status: ['pending', 'in_progress', 'completed', 'cancelled'][i % 4],
    created_at: new Date(Date.now() - i * 86400000).toISOString(),
    due_date: new Date(Date.now() + i * 86400000).toISOString(),
    priority: ['low', 'medium', 'high'][i % 3],
  }));
}

/**
 * Generate mock projects
 */
function generateProjects(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `project-${i}`,
    name: `Project ${i}: Insurance Compliance Review`,
    description: `Comprehensive project description for project ${i}. Covers all aspects of compliance management.`,
    status: ['active', 'completed', 'on_hold'][i % 3],
    created_at: new Date(Date.now() - i * 86400000 * 7).toISOString(),
    budget: Math.floor(Math.random() * 100000) + 10000,
    client_name: `Client ${i}`,
  }));
}

/**
 * Generate mock insurance policies
 */
function generatePolicies(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `policy-${i}`,
    policy_number: `POL-${100000 + i}`,
    coverage_type: ['general_liability', 'workers_comp', 'auto', 'professional'][i % 4],
    coverage_amount: (i + 1) * 500000,
    premium: (i + 1) * 5000,
    effective_date: new Date(Date.now() - 180 * 86400000).toISOString(),
    expiration_date: new Date(Date.now() + 180 * 86400000).toISOString(),
    carrier_name: `Insurance Carrier ${i % 10}`,
    status: ['active', 'expired', 'pending'][i % 3],
  }));
}

/**
 * Generate mock compliance records
 */
function generateComplianceRecords(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `compliance-${i}`,
    check_type: ['policy_verification', 'coverage_check', 'expiration_alert'][i % 3],
    result: ['pass', 'fail', 'warning'][i % 3],
    checked_at: new Date(Date.now() - i * 86400000).toISOString(),
    notes: `Compliance check ${i} notes with detailed findings and recommendations.`,
    score: Math.floor(Math.random() * 30) + 70,
  }));
}

/**
 * Calculate percentile from array of values
 */
export function calculatePercentile(values: number[], percentile: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((percentile / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

/**
 * Generate performance report
 */
export function generatePerformanceReport(results: {
  testName: string;
  executionTimes: number[];
  memoryUsages: number[];
  targetMs: number;
}[]): string {
  const lines: string[] = [
    '# CCPA Export Performance Report',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Summary',
    '',
  ];

  for (const result of results) {
    const avg = result.executionTimes.reduce((a, b) => a + b, 0) / result.executionTimes.length;
    const p95 = calculatePercentile(result.executionTimes, 95);
    const p99 = calculatePercentile(result.executionTimes, 99);
    const maxMemory = Math.max(...result.memoryUsages);
    const passed = p95 <= result.targetMs;

    lines.push(`### ${result.testName}`);
    lines.push(`- Status: ${passed ? 'PASSED' : 'FAILED'}`);
    lines.push(`- Target: ${result.targetMs}ms`);
    lines.push(`- Average: ${avg.toFixed(2)}ms`);
    lines.push(`- P95: ${p95.toFixed(2)}ms`);
    lines.push(`- P99: ${p99.toFixed(2)}ms`);
    lines.push(`- Max Memory: ${maxMemory.toFixed(2)}MB`);
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Wait for a specified duration (for rate limiting)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run function with concurrency limit
 */
export async function runConcurrent<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<{ results: T[]; executionTimes: number[] }> {
  const results: T[] = [];
  const executionTimes: number[] = [];
  let index = 0;

  async function runNext(): Promise<void> {
    const currentIndex = index++;
    if (currentIndex >= tasks.length) return;

    const start = performance.now();
    const result = await tasks[currentIndex]();
    executionTimes.push(performance.now() - start);
    results.push(result);

    await runNext();
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, runNext);
  await Promise.all(workers);

  return { results, executionTimes };
}
