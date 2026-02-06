/**
 * Industries API Tests
 * Tests for /v1/industries endpoints
 */

import { assertEquals, assertExists, assert } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import {
  createTestClient,
  assertSuccessResponse,
  assertErrorResponse,
  assertStatus,
} from '../helpers/test-client.ts'
import { cleanupCurrentTestData } from '../helpers/fixtures.ts'
import { markTestStart } from '../setup.ts'

Deno.test('GET /v1/industries - returns list of industries', async () => {
  markTestStart()

  const client = createTestClient()
  const response = await client.get('/v1/industries')

  assertSuccessResponse(response)
  assertEquals(response.status, 200)
  assert(Array.isArray(response.body.data))
  assertEquals(typeof response.body.total, 'number')
  assertEquals(response.body.data.length, response.body.total)

  if (response.body.data.length > 0) {
    const first = response.body.data[0]
    assertExists(first.id)
    assertExists(first.name)
    assertExists(first.slug)
  }

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/industries/:slug - returns industry when slug exists', async () => {
  markTestStart()

  const client = createTestClient()
  const listResponse = await client.get('/v1/industries')
  assertSuccessResponse(listResponse)

  if (listResponse.body.data.length === 0) {
    await cleanupCurrentTestData()
    return
  }

  const slug = listResponse.body.data[0].slug
  const response = await client.get(`/v1/industries/${slug}`)

  assertSuccessResponse(response)
  assertEquals(response.body.data.slug, slug)
  assertExists(response.body.data.id)
  assertExists(response.body.data.name)

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/industries/:slug - returns 404 for unknown slug', async () => {
  markTestStart()

  const client = createTestClient()
  const response = await client.get('/v1/industries/nonexistent-slug-12345')

  assertStatus(response, 404)
  assertErrorResponse(response)
  assert(response.body.error?.toLowerCase().includes('not found'))

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/industries - requires authentication', async () => {
  markTestStart()

  const client = createTestClient()
  client.setAuthToken('')
  const response = await client.get('/v1/industries', {
    headers: { Authorization: '' },
  })

  assertStatus(response, 401)
  await cleanupCurrentTestData()
})
