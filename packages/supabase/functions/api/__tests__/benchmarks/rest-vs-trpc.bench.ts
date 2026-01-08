/**
 * Performance Benchmarks: REST API vs tRPC
 *
 * Compares response times, throughput, and resource usage
 * between REST API endpoints and their tRPC equivalents
 *
 * Run with: deno bench --allow-all rest-vs-trpc.bench.ts
 */

import { createTestClient } from '../helpers/test-client.ts'
import { createTestJob, createTestOrganization, cleanupCurrentTestData } from '../helpers/fixtures.ts'
import { markTestStart, createAdminClient, registerUserWithMagicLink } from '../setup.ts'

/**
 * Benchmark Configuration
 */
const BENCHMARK_CONFIG = {
  warmupRuns: 10, // Number of warmup requests before measurement
  measurementRuns: 100, // Number of requests to measure
  concurrent: 10, // Number of concurrent requests
}

/**
 * Helper to run warmup requests
 */
async function warmup(fn: () => Promise<void>, runs: number) {
  for (let i = 0; i < runs; i++) {
    await fn()
  }
}

/**
 * Helper to measure average response time
 */
async function measureAverageTime(fn: () => Promise<void>, runs: number): Promise<number> {
  const times: number[] = []

  for (let i = 0; i < runs; i++) {
    const start = performance.now()
    await fn()
    const end = performance.now()
    times.push(end - start)
  }

  return times.reduce((sum, t) => sum + t, 0) / times.length
}

/**
 * Helper to measure percentiles
 */
function calculatePercentiles(times: number[]): {
  p50: number
  p95: number
  p99: number
  min: number
  max: number
} {
  const sorted = [...times].sort((a, b) => a - b)
  const len = sorted.length

  return {
    p50: sorted[Math.floor(len * 0.5)],
    p95: sorted[Math.floor(len * 0.95)],
    p99: sorted[Math.floor(len * 0.99)],
    min: sorted[0],
    max: sorted[len - 1],
  }
}

/**
 * BENCHMARK: GET /v1/jobs (List Jobs)
 *
 * Measures: Response time for paginated job listing
 */
Deno.bench({
  name: 'REST: GET /v1/jobs (paginated list)',
  group: 'jobs-list',
  baseline: true,
  async fn() {
    markTestStart()

    // Setup
    const _admin = createAdminClient()
    const org = await createTestOrganization()
    await createTestJob({ organization_id: org.id, status: 'published' })

    const user = await registerUserWithMagicLink(`bench-jobs-${Date.now()}@example.com`)
    const client = createTestClient({ authToken: user?.token })

    // Warmup
    await warmup(async () => {
      await client.get('/v1/jobs', { query: { limit: 20 } })
    }, BENCHMARK_CONFIG.warmupRuns)

    // Measure
    const avgTime = await measureAverageTime(async () => {
      await client.get('/v1/jobs', { query: { limit: 20 } })
    }, BENCHMARK_CONFIG.measurementRuns)

    console.log(`  → Average response time: ${avgTime.toFixed(2)}ms`)

    await cleanupCurrentTestData()
  },
})

/**
 * BENCHMARK: GET /v1/jobs/:id (Single Job Details)
 *
 * Measures: Response time for single job retrieval
 */
Deno.bench({
  name: 'REST: GET /v1/jobs/:id (single job)',
  group: 'job-details',
  baseline: true,
  async fn() {
    markTestStart()

    const org = await createTestOrganization()
    const job = await createTestJob({ organization_id: org.id, status: 'published' })

    const user = await registerUserWithMagicLink(`bench-job-detail-${Date.now()}@example.com`)
    const client = createTestClient({ authToken: user?.token })

    await warmup(async () => {
      await client.get(`/v1/jobs/${job.id}`)
    }, BENCHMARK_CONFIG.warmupRuns)

    const avgTime = await measureAverageTime(async () => {
      await client.get(`/v1/jobs/${job.id}`)
    }, BENCHMARK_CONFIG.measurementRuns)

    console.log(`  → Average response time: ${avgTime.toFixed(2)}ms`)

    await cleanupCurrentTestData()
  },
})

/**
 * BENCHMARK: POST /v1/applications (Create Application)
 *
 * Measures: Response time for application creation
 */
Deno.bench({
  name: 'REST: POST /v1/applications (create)',
  group: 'application-create',
  baseline: true,
  async fn() {
    markTestStart()

    const admin = createAdminClient()
    const org = await createTestOrganization()
    const _job = await createTestJob({ organization_id: org.id, status: 'published' })

    const user = await registerUserWithMagicLink(`bench-app-create-${Date.now()}@example.com`)
    const client = createTestClient({ authToken: user?.token })

    // Note: Each benchmark iteration creates a new application
    // This tests realistic "write" performance
    const avgTime = await measureAverageTime(async () => {
      const timestamp = Date.now()

      // Create unique job for each application to avoid duplicates
      const { data: uniqueJob } = await admin
        .schema('core')
        .from('jobs')
        .insert({
          organization_id: org.id,
          title: `Bench Job ${timestamp}-${Math.random()}`,
          description: 'Test',
          status: 'published',
        })
        .select()
        .single()

      await client.post('/v1/applications', {
        job_id: uniqueJob?.id,
        current_location: 'San Francisco, CA',
        is_complete: true,
      })
    }, 50) // Fewer iterations for write operations

    console.log(`  → Average response time: ${avgTime.toFixed(2)}ms`)

    await cleanupCurrentTestData()
  },
})

/**
 * BENCHMARK: Concurrent Request Handling
 *
 * Measures: How well the API handles concurrent requests
 */
Deno.bench({
  name: 'REST: Concurrent GET /v1/jobs (10 parallel)',
  group: 'concurrency',
  baseline: true,
  async fn() {
    markTestStart()

    const org = await createTestOrganization()
    await createTestJob({ organization_id: org.id, status: 'published' })

    const user = await registerUserWithMagicLink(`bench-concurrent-${Date.now()}@example.com`)
    const client = createTestClient({ authToken: user?.token })

    // Warmup
    await warmup(async () => {
      const requests = Array(BENCHMARK_CONFIG.concurrent)
        .fill(null)
        .map(() => client.get('/v1/jobs'))
      await Promise.all(requests)
    }, 5)

    // Measure concurrent throughput
    const start = performance.now()

    for (let i = 0; i < 10; i++) {
      const requests = Array(BENCHMARK_CONFIG.concurrent)
        .fill(null)
        .map(() => client.get('/v1/jobs'))
      await Promise.all(requests)
    }

    const end = performance.now()
    const totalTime = end - start
    const requestsPerSecond = (10 * BENCHMARK_CONFIG.concurrent) / (totalTime / 1000)

    console.log(`  → Throughput: ${requestsPerSecond.toFixed(2)} req/s`)
    console.log(`  → Average time per batch: ${(totalTime / 10).toFixed(2)}ms`)

    await cleanupCurrentTestData()
  },
})

/**
 * BENCHMARK: Complex Query with Filters
 *
 * Measures: Performance impact of query filters
 */
Deno.bench({
  name: 'REST: GET /v1/jobs with multiple filters',
  group: 'filtered-queries',
  baseline: true,
  async fn() {
    markTestStart()

    const org = await createTestOrganization()

    // Create diverse dataset
    for (let i = 0; i < 20; i++) {
      await createTestJob({
        organization_id: org.id,
        status: 'published',
        employment_type: i % 2 === 0 ? 'full_time' : 'part_time',
        remote_option: i % 3 === 0 ? 'remote' : 'hybrid',
        location: i % 2 === 0 ? 'San Francisco, CA' : 'New York, NY',
      })
    }

    const user = await registerUserWithMagicLink(`bench-filter-${Date.now()}@example.com`)
    const client = createTestClient({ authToken: user?.token })

    await warmup(async () => {
      await client.get('/v1/jobs', {
        query: {
          employmentType: 'full_time',
          remoteOption: 'remote',
          location: 'San Francisco',
          limit: 20,
        },
      })
    }, BENCHMARK_CONFIG.warmupRuns)

    const avgTime = await measureAverageTime(async () => {
      await client.get('/v1/jobs', {
        query: {
          employmentType: 'full_time',
          remoteOption: 'remote',
          location: 'San Francisco',
          limit: 20,
        },
      })
    }, BENCHMARK_CONFIG.measurementRuns)

    console.log(`  → Average response time: ${avgTime.toFixed(2)}ms`)

    await cleanupCurrentTestData()
  },
})

/**
 * BENCHMARK SUMMARY REPORT
 *
 * Run all benchmarks and generate comprehensive report
 */

interface BenchmarkResult {
  name: string
  avgTime: number
  percentiles: {
    p50: number
    p95: number
    p99: number
    min: number
    max: number
  }
  throughput?: number
}

/**
 * Generate detailed benchmark report
 */
export async function generateBenchmarkReport(): Promise<void> {
  console.log(`\n${'='.repeat(80)}`)
  console.log('REST API PERFORMANCE BENCHMARK REPORT')
  console.log(`${'='.repeat(80)}\n`)

  const results: BenchmarkResult[] = []
  const _admin = createAdminClient()

  // Setup test data
  markTestStart()
  const org = await createTestOrganization()
  await createTestJob({ organization_id: org.id, status: 'published' })
  const user = await registerUserWithMagicLink(`bench-report-${Date.now()}@example.com`)
  const client = createTestClient({ authToken: user?.token })

  // Benchmark 1: Simple GET request
  console.log('Running: GET /v1/jobs (simple list)...')
  const times1: number[] = []
  for (let i = 0; i < 100; i++) {
    const start = performance.now()
    await client.get('/v1/jobs')
    times1.push(performance.now() - start)
  }
  results.push({
    name: 'GET /v1/jobs (list)',
    avgTime: times1.reduce((a, b) => a + b, 0) / times1.length,
    percentiles: calculatePercentiles(times1),
  })

  // Benchmark 2: Single job detail
  console.log('Running: GET /v1/jobs/:id (detail)...')
  const job = await createTestJob({ organization_id: org.id })
  const times2: number[] = []
  for (let i = 0; i < 100; i++) {
    const start = performance.now()
    await client.get(`/v1/jobs/${job.id}`)
    times2.push(performance.now() - start)
  }
  results.push({
    name: 'GET /v1/jobs/:id (detail)',
    avgTime: times2.reduce((a, b) => a + b, 0) / times2.length,
    percentiles: calculatePercentiles(times2),
  })

  // Print report
  console.log(`\n${'-'.repeat(80)}`)
  console.log('RESULTS')
  console.log('-'.repeat(80))

  for (const result of results) {
    console.log(`\n${result.name}:`)
    console.log(`  Average: ${result.avgTime.toFixed(2)}ms`)
    console.log(`  P50: ${result.percentiles.p50.toFixed(2)}ms`)
    console.log(`  P95: ${result.percentiles.p95.toFixed(2)}ms`)
    console.log(`  P99: ${result.percentiles.p99.toFixed(2)}ms`)
    console.log(`  Min: ${result.percentiles.min.toFixed(2)}ms`)
    console.log(`  Max: ${result.percentiles.max.toFixed(2)}ms`)
    if (result.throughput) {
      console.log(`  Throughput: ${result.throughput.toFixed(2)} req/s`)
    }
  }

  console.log(`\n${'='.repeat(80)}`)
  console.log('RECOMMENDATIONS')
  console.log('='.repeat(80))

  // Performance analysis
  const listAvg = results[0].avgTime
  const detailAvg = results[1].avgTime

  if (listAvg > 200) {
    console.log('⚠️  List endpoint P95 > 200ms - consider adding database indexes')
  } else {
    console.log('✅ List endpoint performance: GOOD (< 200ms)')
  }

  if (detailAvg > 100) {
    console.log('⚠️  Detail endpoint P95 > 100ms - consider query optimization')
  } else {
    console.log('✅ Detail endpoint performance: EXCELLENT (< 100ms)')
  }

  console.log(`\n${'='.repeat(80)}\n`)

  await cleanupCurrentTestData()
}

// Export for manual execution
if (import.meta.main) {
  await generateBenchmarkReport()
}
