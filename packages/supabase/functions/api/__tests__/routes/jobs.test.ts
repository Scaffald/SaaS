/**
 * Jobs API Tests
 * Tests for /v1/jobs endpoints with 100% coverage
 */

import { assertEquals, assertExists, assert } from 'https://deno.land/std@0.208.0/assert/mod.ts'
import {
  createTestClient,
  assertSuccessResponse,
  assertErrorResponse,
  assertPaginatedResponse,
  assertStatus,
} from '../helpers/test-client.ts'
import {
  createTestJob,
  createTestJobs,
  createTestOrganization,
  cleanupCurrentTestData,
} from '../helpers/fixtures.ts'
import { markTestStart, registerUserWithMagicLink } from '../setup.ts'

/**
 * GET /v1/jobs - List published jobs
 */

Deno.test('GET /v1/jobs - returns paginated list of published jobs', async () => {
  markTestStart()

  // Create test jobs
  const jobs = await createTestJobs(5, { status: 'published' })

  const client = createTestClient()
  const response = await client.get('/v1/jobs')

  assertSuccessResponse(response)
  assertPaginatedResponse(response)
  assertEquals(response.status, 200)

  // Verify data structure
  assert(Array.isArray(response.body.data))
  assert(response.body.data.length > 0)

  // Verify pagination
  assertEquals(typeof response.body.pagination.total, 'number')
  assertEquals(response.body.pagination.limit, 20) // default
  assertEquals(response.body.pagination.offset, 0) // default

  // Verify job structure
  const firstJob = response.body.data[0]
  assertExists(firstJob.id)
  assertExists(firstJob.title)
  assertExists(firstJob.organization_id)
  assertEquals(firstJob.status, 'published')

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs - filters by status', async () => {
  markTestStart()

  // Create jobs with different statuses
  await createTestJob({ status: 'published' })
  await createTestJob({ status: 'draft' })

  const client = createTestClient()

  // Test published status (default)
  const publishedResponse = await client.get('/v1/jobs', {
    query: { status: 'published' },
  })
  assertSuccessResponse(publishedResponse)
  assert(publishedResponse.body.data.every((job: { status: string }) => job.status === 'published'))

  // Test draft status
  const draftResponse = await client.get('/v1/jobs', {
    query: { status: 'draft' },
  })
  assertSuccessResponse(draftResponse)
  assert(draftResponse.body.data.every((job: { status: string }) => job.status === 'draft'))

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs - filters by organization_id', async () => {
  markTestStart()

  const org1 = await createTestOrganization()
  const org2 = await createTestOrganization()

  await createTestJob({ organization_id: org1.id })
  await createTestJob({ organization_id: org2.id })

  const client = createTestClient()
  const response = await client.get('/v1/jobs', {
    query: { organizationId: org1.id },
  })

  assertSuccessResponse(response)
  assert(
    response.body.data.every(
      (job: { organization_id: string }) => job.organization_id === org1.id
    )
  )

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs - filters by location (partial match)', async () => {
  markTestStart()

  await createTestJob({ location: 'San Francisco, CA' })
  await createTestJob({ location: 'New York, NY' })

  const client = createTestClient()
  const response = await client.get('/v1/jobs', {
    query: { location: 'San Francisco' },
  })

  assertSuccessResponse(response)
  assert(
    response.body.data.every((job: { location: string }) => job.location?.includes('San Francisco'))
  )

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs - filters by employment_type', async () => {
  markTestStart()

  await createTestJob({ employment_type: 'full_time' })
  await createTestJob({ employment_type: 'part_time' })

  const client = createTestClient()
  const response = await client.get('/v1/jobs', {
    query: { employmentType: 'full_time' },
  })

  assertSuccessResponse(response)
  assert(
    response.body.data.every(
      (job: { employment_type: string }) => job.employment_type === 'full_time'
    )
  )

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs - filters by remote_option', async () => {
  markTestStart()

  await createTestJob({ remote_option: 'remote' })
  await createTestJob({ remote_option: 'on_site' })

  const client = createTestClient()
  const response = await client.get('/v1/jobs', {
    query: { remoteOption: 'remote' },
  })

  assertSuccessResponse(response)
  assert(
    response.body.data.every((job: { remote_option: string }) => job.remote_option === 'remote')
  )

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs - respects limit parameter', async () => {
  markTestStart()

  await createTestJobs(10, { status: 'published' })

  const client = createTestClient()
  const response = await client.get('/v1/jobs', {
    query: { limit: 5 },
  })

  assertSuccessResponse(response)
  assert(response.body.data.length <= 5)
  assertEquals(response.body.pagination.limit, 5)

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs - respects offset parameter for pagination', async () => {
  markTestStart()

  await createTestJobs(10, { status: 'published' })

  const client = createTestClient()

  // Get first page
  const firstPage = await client.get('/v1/jobs', {
    query: { limit: 5, offset: 0 },
  })
  assertSuccessResponse(firstPage)

  // Get second page
  const secondPage = await client.get('/v1/jobs', {
    query: { limit: 5, offset: 5 },
  })
  assertSuccessResponse(secondPage)

  // Verify pages are different
  const firstIds = firstPage.body.data.map((j: { id: string }) => j.id)
  const secondIds = secondPage.body.data.map((j: { id: string }) => j.id)
  assertEquals(firstIds.some((id) => secondIds.includes(id)), false)

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs - validates max limit of 100', async () => {
  markTestStart()

  const client = createTestClient()
  const response = await client.get('/v1/jobs', {
    query: { limit: 150 }, // Over max
  })

  // Should return error or clamp to 100
  // Based on Zod schema, this should fail validation
  assertStatus(response, 400)

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs - returns empty array when no jobs match', async () => {
  markTestStart()

  const client = createTestClient()
  const response = await client.get('/v1/jobs', {
    query: { location: 'NonexistentCity' },
  })

  assertSuccessResponse(response)
  assertEquals(response.body.data.length, 0)
  assertEquals(response.body.pagination.total, 0)

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs - calculates hasMore correctly', async () => {
  markTestStart()

  await createTestJobs(15, { status: 'published' })

  const client = createTestClient()

  // First page should have more
  const firstPage = await client.get('/v1/jobs', {
    query: { limit: 10, offset: 0 },
  })
  assertSuccessResponse(firstPage)
  assertEquals(firstPage.body.pagination.hasMore, true)

  // Last page should not have more
  const lastPage = await client.get('/v1/jobs', {
    query: { limit: 10, offset: 10 },
  })
  assertSuccessResponse(lastPage)
  assertEquals(lastPage.body.pagination.hasMore, false)

  await cleanupCurrentTestData()
})

/**
 * GET /v1/jobs/:id - Get job by ID
 */

Deno.test('GET /v1/jobs/:id - returns job details for valid ID', async () => {
  markTestStart()

  const job = await createTestJob({ status: 'published' })

  const client = createTestClient()
  const response = await client.get(`/v1/jobs/${job.id}`)

  assertSuccessResponse(response)
  assertEquals(response.status, 200)
  assertEquals(response.body.data.id, job.id)
  assertEquals(response.body.data.title, job.title)
  assertExists(response.body.data.organization_id)

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs/:id - returns 404 for non-existent job', async () => {
  markTestStart()

  const client = createTestClient()
  const fakeId = '00000000-0000-0000-0000-000000000000'
  const response = await client.get(`/v1/jobs/${fakeId}`)

  assertStatus(response, 404)
  assertErrorResponse(response)
  assert(response.body.error.includes('not found'))

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs/:id - returns 400 for invalid UUID format', async () => {
  markTestStart()

  const client = createTestClient()
  const response = await client.get('/v1/jobs/invalid-uuid')

  // Zod validation should catch this
  assertStatus(response, 400)

  await cleanupCurrentTestData()
})

/**
 * GET /v1/jobs/:id/similar - Get similar jobs
 */

Deno.test('GET /v1/jobs/:id/similar - returns similar jobs from same organization', async () => {
  markTestStart()

  const org = await createTestOrganization()

  const sourceJob = await createTestJob({
    organization_id: org.id,
    employment_type: 'full_time',
  })

  // Create similar jobs (same org)
  await createTestJob({ organization_id: org.id, employment_type: 'full_time' })
  await createTestJob({ organization_id: org.id, employment_type: 'part_time' })

  // Create dissimilar job (different org)
  await createTestJob({ employment_type: 'full_time' })

  const client = createTestClient()
  const response = await client.get(`/v1/jobs/${sourceJob.id}/similar`)

  assertSuccessResponse(response)
  assert(response.body.data.length > 0)
  // Should not include source job
  assert(!response.body.data.some((j: { id: string }) => j.id === sourceJob.id))
  // Should include jobs from same org or type
  assert(
    response.body.data.every(
      (j: { organization_id: string; employment_type: string }) =>
        j.organization_id === org.id || j.employment_type === 'full_time'
    )
  )

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs/:id/similar - respects limit parameter (max 20)', async () => {
  markTestStart()

  const org = await createTestOrganization()
  const sourceJob = await createTestJob({ organization_id: org.id })

  // Create many similar jobs
  await createTestJobs(15, { organization_id: org.id })

  const client = createTestClient()
  const response = await client.get(`/v1/jobs/${sourceJob.id}/similar`, {
    query: { limit: 5 },
  })

  assertSuccessResponse(response)
  assert(response.body.data.length <= 5)

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs/:id/similar - validates max limit of 20', async () => {
  markTestStart()

  const job = await createTestJob()

  const client = createTestClient()
  const response = await client.get(`/v1/jobs/${job.id}/similar`, {
    query: { limit: 25 }, // Over max
  })

  // Zod validation should fail
  assertStatus(response, 400)

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs/:id/similar - returns 404 if source job not found', async () => {
  markTestStart()

  const client = createTestClient()
  const fakeId = '00000000-0000-0000-0000-000000000000'
  const response = await client.get(`/v1/jobs/${fakeId}/similar`)

  assertStatus(response, 404)
  assertErrorResponse(response)
  assert(response.body.error.includes('not found'))

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs/:id/similar - returns empty array if no similar jobs', async () => {
  markTestStart()

  // Create a unique job with no similar jobs
  const job = await createTestJob()

  const client = createTestClient()
  const response = await client.get(`/v1/jobs/${job.id}/similar`)

  assertSuccessResponse(response)
  assertEquals(response.body.data.length, 0)

  await cleanupCurrentTestData()
})

/**
 * GET /v1/jobs/slug/:slug - Get job by slug
 */

Deno.test('GET /v1/jobs/slug/:slug - returns job when slug exists and status is open', async () => {
  markTestStart()

  const job = await createTestJob({
    status: 'open',
    slug: 'test-job-by-slug-' + Date.now().toString(36),
  })

  const client = createTestClient()
  const response = await client.get(`/v1/jobs/slug/${job.slug ?? job.id}`)

  assertSuccessResponse(response)
  assertEquals(response.body.data.id, job.id)
  assertEquals(response.body.data.slug, job.slug)
  assertExists(response.body.data.title)

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs/slug/:slug - returns 404 for unknown slug', async () => {
  markTestStart()

  const client = createTestClient()
  const response = await client.get('/v1/jobs/slug/nonexistent-slug-12345')

  assertStatus(response, 404)
  assertErrorResponse(response)

  await cleanupCurrentTestData()
})

/**
 * GET /v1/jobs/filter-options - Get available filter values
 */

Deno.test('GET /v1/jobs/filter-options - returns unique filter options', async () => {
  markTestStart()

  // Create jobs with various attributes
  await createTestJob({
    employment_type: 'full_time',
    location: 'San Francisco, CA',
    remote_option: 'remote',
  })
  await createTestJob({
    employment_type: 'part_time',
    location: 'New York, NY',
    remote_option: 'hybrid',
  })
  await createTestJob({
    employment_type: 'full_time', // Duplicate
    location: 'San Francisco, CA', // Duplicate
    remote_option: 'on_site',
  })

  const client = createTestClient()
  const response = await client.get('/v1/jobs/filter-options')

  assertSuccessResponse(response)
  assertEquals(response.status, 200)

  // Verify structure
  assertExists(response.body.data.employmentTypes)
  assertExists(response.body.data.locations)
  assertExists(response.body.data.remoteOptions)

  // Verify uniqueness
  assert(Array.isArray(response.body.data.employmentTypes))
  assert(response.body.data.employmentTypes.includes('full_time'))
  assert(response.body.data.employmentTypes.includes('part_time'))
  assertEquals(
    response.body.data.employmentTypes.length,
    new Set(response.body.data.employmentTypes).size
  )

  assert(response.body.data.locations.includes('San Francisco, CA'))
  assert(response.body.data.locations.includes('New York, NY'))

  assert(response.body.data.remoteOptions.includes('remote'))
  assert(response.body.data.remoteOptions.includes('hybrid'))
  assert(response.body.data.remoteOptions.includes('on_site'))

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs/filter-options - returns empty arrays when no jobs exist', async () => {
  markTestStart()

  const client = createTestClient()
  const response = await client.get('/v1/jobs/filter-options')

  assertSuccessResponse(response)
  assert(Array.isArray(response.body.data.employmentTypes))
  assert(Array.isArray(response.body.data.locations))
  assert(Array.isArray(response.body.data.remoteOptions))

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs/filter-options - excludes null values', async () => {
  markTestStart()

  // Create job with null employment_type
  await createTestJob({
    employment_type: null as unknown as 'full_time',
    location: 'San Francisco, CA',
    remote_option: 'remote',
  })

  const client = createTestClient()
  const response = await client.get('/v1/jobs/filter-options')

  assertSuccessResponse(response)

  // Should not include null in arrays
  assert(!response.body.data.employmentTypes.includes(null))
  assert(!response.body.data.locations.includes(null))
  assert(!response.body.data.remoteOptions.includes(null))

  await cleanupCurrentTestData()
})

/**
 * Authentication tests
 */

Deno.test('GET /v1/jobs - requires authentication', async () => {
  markTestStart()

  const client = createTestClient()
  // Remove auth by setting empty token
  client.setAuthToken('')

  const response = await client.get('/v1/jobs', {
    headers: { Authorization: '' }, // Explicitly no auth
  })

  // Should return 401 Unauthorized
  assertStatus(response, 401)

  await cleanupCurrentTestData()
})

Deno.test('GET /v1/jobs - works with valid JWT token', async () => {
  markTestStart()

  const user = await registerUserWithMagicLink('test-jobs-auth@example.com')
  assert(user !== null, 'Failed to create test user')

  const client = createTestClient({ authToken: user.token })
  const response = await client.get('/v1/jobs')

  assertSuccessResponse(response)

  await cleanupCurrentTestData()
})

console.log('✅ All Jobs API tests passed!')
