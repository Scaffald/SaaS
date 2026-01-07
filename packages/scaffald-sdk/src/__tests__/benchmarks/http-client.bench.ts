/**
 * HTTP Client Performance Benchmarks
 * Measures request/response performance, retry logic, and middleware overhead
 */

import { bench, describe } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { Scaffald } from '../../client'

const BASE_URL = 'http://localhost:3000'

// Setup MSW server for benchmarks
const server = setupServer(
  // Fast response endpoint
  http.get(`${BASE_URL}/v1/jobs`, async () => {
    return HttpResponse.json({
      data: Array.from({ length: 20 }, (_, i) => ({
        id: `job_${i}`,
        title: `Job ${i}`,
        company: `Company ${i}`,
      })),
      meta: {
        total: 100,
        page: 1,
        limit: 20,
      },
    })
  }),

  // Slow response endpoint (500ms delay)
  http.get(`${BASE_URL}/v1/jobs/slow`, async () => {
    await new Promise((resolve) => setTimeout(resolve, 500))
    return HttpResponse.json({ data: { id: 'job_123' } })
  }),

  // Retry endpoint (fails twice, succeeds third time)
  http.get(`${BASE_URL}/v1/jobs/retry`, async () => {
    const retryCount = Number.parseInt(
      (globalThis as { retryCount?: string }).retryCount || '0',
      10
    )
    ;(globalThis as { retryCount: string }).retryCount = String(retryCount + 1)

    if (retryCount < 2) {
      return HttpResponse.json({ error: 'Server error' }, { status: 500 })
    }

    ;(globalThis as { retryCount: string }).retryCount = '0'
    return HttpResponse.json({ data: { id: 'job_123' } })
  })
)

// Start server before benchmarks
server.listen({ onUnhandledRequest: 'bypass' })

// Create client instance
const client = new Scaffald({
  apiKey: 'test_key',
  baseUrl: BASE_URL,
  maxRetries: 3,
})

describe('HTTP Client Performance', () => {
  bench(
    'basic GET request',
    async () => {
      await client.jobs.list({ limit: 20 })
    },
    { iterations: 100 }
  )

  bench(
    'parallel requests (5 concurrent)',
    async () => {
      await Promise.all([
        client.jobs.list({ limit: 20 }),
        client.jobs.list({ limit: 20 }),
        client.jobs.list({ limit: 20 }),
        client.jobs.list({ limit: 20 }),
        client.jobs.list({ limit: 20 }),
      ])
    },
    { iterations: 50 }
  )

  bench(
    'request with query parameters',
    async () => {
      await client.jobs.list({
        limit: 20,
        page: 1,
      })
    },
    { iterations: 100 }
  )
})

describe('Retry Logic Performance', () => {
  bench('successful request (no retries)', async () => {
    await client.jobs.list({ limit: 20 })
  })

  bench(
    'request with retries (2 failures, 1 success)',
    async () => {
      try {
        await fetch(`${BASE_URL}/v1/jobs/retry`, {
          headers: { Authorization: 'Bearer test_key' },
        })
      } catch {
        // Ignore errors
      }
    },
    {
      iterations: 10, // Lower iterations since this includes retries
    }
  )
})

describe('Response Parsing Performance', () => {
  bench('parse 20 job records', async () => {
    await client.jobs.list({ limit: 20 })
  })

  bench('parse 100 job records', async () => {
    // Create temporary handler for large response
    const largeResponseServer = setupServer(
      http.get(`${BASE_URL}/v1/jobs`, async () => {
        return HttpResponse.json({
          data: Array.from({ length: 100 }, (_, i) => ({
            id: `job_${i}`,
            title: `Job ${i}`,
            company: `Company ${i}`,
            description: `This is a job description for Job ${i}. It contains detailed information about the role, requirements, and benefits.`,
            location: `City ${i}, State`,
            salary_range: { min: 80000 + i * 1000, max: 120000 + i * 1000 },
          })),
          meta: {
            total: 1000,
            page: 1,
            limit: 100,
          },
        })
      })
    )

    largeResponseServer.listen({ onUnhandledRequest: 'bypass' })
    await client.jobs.list({ limit: 100 })
    largeResponseServer.close()
  })
})

// Cleanup after benchmarks
server.close()
