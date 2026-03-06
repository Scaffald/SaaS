/**
 * Experience REST API Tests
 * Tests for /v1/profiles/experience endpoints (GET list, GET summary, POST save, POST delete)
 */

import { assertEquals, assert } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import { createTestClient, assertStatus, assertErrorResponse } from '../helpers/test-client.ts'
import { getAuthToken, markTestStart } from '../setup.ts'

const TEST_EMAIL = 'test@example.com'
const TEST_PASSWORD = 'test123456'

Deno.test('GET /v1/profiles/experience - returns list for authenticated user', async () => {
  markTestStart()

  const token = await getAuthToken(TEST_EMAIL, TEST_PASSWORD)
  if (!token) {
    throw new Error('Test user test@example.com not found. Run pnpm supa db reset to seed 002a_seed-api-test-user.sql')
  }

  const client = createTestClient({ authToken: token })
  const response = await client.get('/v1/profiles/experience')

  assertStatus(response, 200)
  assert(Array.isArray(response.body))
})

Deno.test('GET /v1/profiles/experience - returns 401 without auth', async () => {
  markTestStart()

  const client = createTestClient()
  client.setAuthToken('')
  const response = await client.get('/v1/profiles/experience', {
    headers: { Authorization: '' },
  })

  assertStatus(response, 401)
  assertErrorResponse(response)
})

Deno.test('GET /v1/profiles/experience/summary - returns career level for authenticated user', async () => {
  markTestStart()

  const token = await getAuthToken(TEST_EMAIL, TEST_PASSWORD)
  if (!token) {
    throw new Error('Test user not found. Run pnpm supa db reset.')
  }

  const client = createTestClient({ authToken: token })
  const response = await client.get('/v1/profiles/experience/summary')

  assertStatus(response, 200)
  assert(response.body && typeof response.body === 'object')
  assert('career_level' in response.body)
})

Deno.test('GET /v1/profiles/experience/summary - returns 401 without auth', async () => {
  markTestStart()

  const client = createTestClient()
  client.setAuthToken('')
  const response = await client.get('/v1/profiles/experience/summary', {
    headers: { Authorization: '' },
  })

  assertStatus(response, 401)
  assertErrorResponse(response)
})

Deno.test('POST /v1/profiles/experience - saves experience entries', async () => {
  markTestStart()

  const token = await getAuthToken(TEST_EMAIL, TEST_PASSWORD)
  if (!token) {
    throw new Error('Test user not found. Run pnpm supa db reset.')
  }

  const client = createTestClient({ authToken: token })
  const response = await client.post('/v1/profiles/experience', {
    career_level: 'mid',
    experience_entries: [
      {
        job_title: 'Test Engineer',
        company_name: 'Test Co',
        is_remote: false,
        is_current: true,
      },
    ],
  })

  assertStatus(response, 200)
  assert(response.body && typeof response.body === 'object')
  assertEquals((response.body as { success?: boolean }).success, true)
  assert(Array.isArray((response.body as { experience_entries?: unknown[] }).experience_entries))
})

Deno.test('POST /v1/profiles/experience - returns 401 without auth', async () => {
  markTestStart()

  const client = createTestClient()
  client.setAuthToken('')
  const response = await client.post(
    '/v1/profiles/experience',
    { experience_entries: [] },
    { headers: { Authorization: '' } }
  )

  assertStatus(response, 401)
  assertErrorResponse(response)
})

Deno.test('POST /v1/profiles/experience/delete - deletes entry owned by user', async () => {
  markTestStart()

  const token = await getAuthToken(TEST_EMAIL, TEST_PASSWORD)
  if (!token) {
    throw new Error('Test user not found. Run pnpm supa db reset.')
  }

  const client = createTestClient({ authToken: token })
  const listRes = await client.get('/v1/profiles/experience')
  assertStatus(listRes, 200)
  const entries = listRes.body as unknown[]
  if (entries.length === 0) {
    return
  }
  const id = (entries[0] as { id?: string }).id
  if (!id) {
    return
  }

  const response = await client.post('/v1/profiles/experience/delete', {
    experienceId: id,
  })

  assertStatus(response, 200)
  assertEquals((response.body as { success?: boolean }).success, true)
})

Deno.test('POST /v1/profiles/experience/delete - returns 401 without auth', async () => {
  markTestStart()

  const client = createTestClient()
  client.setAuthToken('')
  const response = await client.post(
    '/v1/profiles/experience/delete',
    { experienceId: '00000000-0000-0000-0000-000000000000' },
    { headers: { Authorization: '' } }
  )

  assertStatus(response, 401)
  assertErrorResponse(response)
})
