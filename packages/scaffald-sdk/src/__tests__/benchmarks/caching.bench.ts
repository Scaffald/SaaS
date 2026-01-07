/**
 * SDK Performance Benchmarks
 * Measures SDK instance creation, method calls, and memory usage
 */

import { bench, describe } from 'vitest'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'
import { Scaffald } from '../../client'

const BASE_URL = 'http://localhost:3000'

// Setup MSW server
const server = setupServer(
  http.get(`${BASE_URL}/v1/jobs`, async () => {
    return HttpResponse.json({
      data: Array.from({ length: 20 }, (_, i) => ({
        id: `job_${i}`,
        title: `Job ${i}`,
      })),
    })
  }),

  http.get(`${BASE_URL}/v1/jobs/:id`, async ({ params }) => {
    return HttpResponse.json({
      data: {
        id: params.id,
        title: 'Software Engineer',
        company: 'Tech Corp',
      },
    })
  })
)

server.listen({ onUnhandledRequest: 'bypass' })

// Create client instance
const client = new Scaffald({
  apiKey: 'test_key',
  baseUrl: BASE_URL,
  maxRetries: 3,
})

describe('SDK Instance Performance', () => {
  bench(
    'create SDK instance',
    () => {
      new Scaffald({
        apiKey: 'test_key',
        baseUrl: BASE_URL,
      })
    },
    { iterations: 1000 }
  )

  bench(
    'resource method call',
    async () => {
      await client.jobs.list({ limit: 20 })
    },
    { iterations: 100 }
  )
})

describe('Request Patterns', () => {
  bench(
    'sequential requests (10)',
    async () => {
      for (let i = 0; i < 10; i++) {
        await client.jobs.retrieve(`job_${i}`)
      }
    },
    { iterations: 10 }
  )

  bench(
    'parallel requests (10 concurrent)',
    async () => {
      await Promise.all(Array.from({ length: 10 }, (_, i) => client.jobs.retrieve(`job_${i}`)))
    },
    { iterations: 20 }
  )
})

describe('Memory Usage', () => {
  bench(
    'create 100 client instances',
    () => {
      const clients = Array.from(
        { length: 100 },
        () =>
          new Scaffald({
            apiKey: 'test_key',
            baseUrl: BASE_URL,
          })
      )

      // Keep reference to prevent GC
      if (clients.length === 0) console.log('No clients')
    },
    { iterations: 10 }
  )
})

server.close()
