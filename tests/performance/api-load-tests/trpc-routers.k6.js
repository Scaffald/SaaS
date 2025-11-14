/**
 * tRPC Router Load Testing
 *
 * k6 load testing script for tRPC endpoints.
 * Tests API endpoint concurrency and validates response times.
 *
 * Task 7: tRPC Router Load Testing and Concurrency Validation
 *
 * Run with: k6 run trpc-routers.k6.js
 *
 * Note: Update the baseURL to match your environment
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

// Custom metrics
const errorRate = new Rate('errors')

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 100 }, // Stay at 100 users
    { duration: '30s', target: 500 }, // Ramp up to 500 users
    { duration: '1m', target: 500 }, // Stay at 500 users
    { duration: '30s', target: 1000 }, // Ramp up to 1000 users
    { duration: '1m', target: 1000 }, // Stay at 1000 users
    { duration: '30s', target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests should be below 500ms
    http_req_failed: ['rate<0.01'], // Error rate should be less than 1%
    errors: ['rate<0.01'], // Custom error rate should be less than 1%
  },
}

// Base URL - update for your environment
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081'
const API_URL = `${BASE_URL}/api/trpc`

// tRPC endpoints to test
const endpoints = [
  { path: '/dashboard', procedure: 'dashboard' },
  { path: '/profile', procedure: 'profile' },
  { path: '/discover.workers', procedure: 'discover.workers' },
  { path: '/discover.jobs', procedure: 'discover.jobs' },
  { path: '/discover.employers', procedure: 'discover.employers' },
]

/**
 * Generate a test session (simulated authentication)
 */
function getSessionHeaders() {
  // In a real scenario, you'd authenticate and get a session token
  // For load testing, you might use a test token or skip auth
  return {
    'Content-Type': 'application/json',
    // 'Authorization': 'Bearer test-token',
  }
}

/**
 * Make a tRPC request
 */
function makeTRPCRequest(procedure, input = {}) {
  const url = `${API_URL}/${procedure}`
  const payload = JSON.stringify({
    json: input,
  })

  const params = {
    headers: getSessionHeaders(),
    tags: { name: procedure },
  }

  const response = http.post(url, payload, params)

  const success = check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
    'response has data': (r) => r.body.length > 0,
  })

  if (!success) {
    errorRate.add(1)
  } else {
    errorRate.add(0)
  }

  return response
}

/**
 * Main test function
 */
export default function () {
  // Select a random endpoint to test
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)]

  // Make request
  const response = makeTRPCRequest(endpoint.procedure)

  // Validate response
  check(response, {
    [`${endpoint.procedure} status is 200`]: (r) => r.status === 200,
    [`${endpoint.procedure} response time < 500ms`]: (r) => r.timings.duration < 500,
    [`${endpoint.procedure} has valid JSON`]: (r) => {
      try {
        JSON.parse(r.body)
        return true
      } catch {
        return false
      }
    },
  })

  // Sleep between requests (simulate user think time)
  sleep(Math.random() * 2 + 1) // 1-3 seconds
}

/**
 * Setup function (runs once before all VUs)
 */
export function setup() {
  console.log('Starting load test...')
  console.log(`Base URL: ${BASE_URL}`)
  console.log(`Testing endpoints: ${endpoints.map((e) => e.procedure).join(', ')}`)
  return {}
}

/**
 * Teardown function (runs once after all VUs)
 */
export function teardown(data) {
  console.log('Load test complete!')
}

