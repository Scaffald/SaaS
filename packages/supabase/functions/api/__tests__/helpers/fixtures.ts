/**
 * Test Fixtures
 * Utilities for creating test data in the database
 */

import { createAdminClient, getTestStartTime } from '../setup.ts'

/**
 * Generate unique test identifier
 */
function generateTestId(): string {
  return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`
}

/**
 * Create a test user
 */
export async function createTestUser(overrides: {
  email?: string
  name?: string
} = {}) {
  const admin = createAdminClient()

  const email = overrides.email || `${generateTestId()}@example.com`
  const name = overrides.name || 'Test User'

  // Create user via Supabase Auth
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: 'testpassword123',
    email_confirm: true,
    user_metadata: {
      name,
    },
  })

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`)
  }

  return {
    id: data.user.id,
    email: data.user.email || email,
    name,
  }
}

/**
 * Create a test organization
 */
export async function createTestOrganization(overrides: {
  name?: string
  slug?: string
} = {}) {
  const admin = createAdminClient()

  const name = overrides.name || `Test Org ${generateTestId()}`
  const slug = overrides.slug || `test-org-${generateTestId()}`

  const { data, error} = await admin
    .schema('core')
    .from('organizations')
    .insert({
      name,
      slug,
      type: 'employer',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create test organization: ${error.message}`)
  }

  return data
}

/**
 * Create a test job
 */
export async function createTestJob(overrides: {
  organization_id?: string
  title?: string
  description?: string
  status?: 'draft' | 'open' | 'paused' | 'closed' | 'published'
  employment_type?: 'full_time' | 'part_time' | 'contract' | 'temp' | 'intern'
  remote_option?: 'on_site' | 'hybrid' | 'remote'
  location?: string
} = {}) {
  const admin = createAdminClient()

  // Create org if not provided
  let organizationId = overrides.organization_id
  if (!organizationId) {
    const org = await createTestOrganization()
    organizationId = org.id
  }

  const { data, error } = await admin
    .schema('core')
    .from('jobs')
    .insert({
      organization_id: organizationId,
      title: overrides.title || `Test Job ${generateTestId()}`,
      description: overrides.description || 'This is a test job description',
      status: overrides.status || 'published',
      employment_type: overrides.employment_type || 'full_time',
      remote_option: overrides.remote_option || 'remote',
      location: overrides.location || 'San Francisco, CA',
      pay_range_min_cents: 10000000, // $100k
      pay_range_max_cents: 15000000, // $150k
      pay_range_type: 'salary',
      number_of_openings: 1,
      is_featured: false,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create test job: ${error.message}`)
  }

  return data
}

/**
 * Create a test application
 */
export async function createTestApplication(overrides: {
  job_id?: string
  user_id?: string
  status?: 'pending' | 'reviewing' | 'interviewing' | 'offer' | 'accepted' | 'rejected' | 'withdrawn'
  type?: 'quick' | 'full'
} = {}) {
  const admin = createAdminClient()

  // Create job if not provided
  let jobId = overrides.job_id
  if (!jobId) {
    const job = await createTestJob()
    jobId = job.id
  }

  // Create user if not provided
  let userId = overrides.user_id
  if (!userId) {
    const user = await createTestUser()
    userId = user.id
  }

  const { data, error } = await admin
    .schema('core')
    .from('applications')
    .insert({
      job_id: jobId,
      user_id: userId,
      status: overrides.status || 'pending',
      type: overrides.type || 'quick',
      screening_answers: {},
      custom_answers: {},
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create test application: ${error.message}`)
  }

  return data
}

/**
 * Create a test API key
 */
export async function createTestApiKey(overrides: {
  organization_id?: string
  name?: string
  environment?: 'test' | 'live'
  tier?: 'free' | 'pro' | 'enterprise'
  scopes?: string[]
  expires_at?: string
} = {}) {
  const admin = createAdminClient()

  // Create org if not provided
  let organizationId = overrides.organization_id
  if (!organizationId) {
    const org = await createTestOrganization()
    organizationId = org.id
  }

  // Generate API key (sk_test_ or sk_live_ prefix)
  const environment = overrides.environment || 'test'
  const keyPrefix = environment === 'test' ? 'sk_test_' : 'sk_live_'
  const keySecret = generateTestId()
  const rawKey = `${keyPrefix}${keySecret}`

  // Hash the key (SHA-256)
  const encoder = new TextEncoder()
  const data = encoder.encode(rawKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const keyHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')

  const { data: apiKeyData, error } = await admin
    .schema('core')
    .from('api_keys')
    .insert({
      organization_id: organizationId,
      name: overrides.name || `Test API Key ${generateTestId()}`,
      key_hash: keyHash,
      key_prefix: keyPrefix.slice(0, -1), // Remove trailing underscore
      environment,
      scopes: overrides.scopes || ['jobs:read', 'applications:write'],
      tier: overrides.tier || 'free',
      expires_at: overrides.expires_at || null,
      active: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create test API key: ${error.message}`)
  }

  return {
    ...apiKeyData,
    raw_key: rawKey, // Include raw key for testing
  }
}

/**
 * Create multiple test jobs in bulk
 */
export async function createTestJobs(
  count: number,
  overrides: Parameters<typeof createTestJob>[0] = {}
): Promise<Awaited<ReturnType<typeof createTestJob>>[]> {
  const jobs = []
  for (let i = 0; i < count; i++) {
    const job = await createTestJob({
      ...overrides,
      title: `${overrides.title || 'Test Job'} #${i + 1}`,
    })
    jobs.push(job)
  }
  return jobs
}

/**
 * Clean up test data created after a specific timestamp
 */
export async function cleanupTestDataAfter(timestamp: number) {
  const admin = createAdminClient()

  const timestampStr = new Date(timestamp).toISOString()

  try {
    // Clean in dependency order
    await admin
      .schema('core')
      .from('applications')
      .delete()
      .gte('created_at', timestampStr)

    await admin.schema('core').from('jobs').delete().gte('created_at', timestampStr)

    await admin
      .schema('core')
      .from('api_key_usage')
      .delete()
      .gte('created_at', timestampStr)

    await admin
      .schema('core')
      .from('api_keys')
      .delete()
      .gte('created_at', timestampStr)

    await admin
      .schema('core')
      .from('organizations')
      .delete()
      .gte('created_at', timestampStr)

    // Note: Users created via Supabase Auth need to be cleaned separately
    // This is typically done via the auth admin API
  } catch (error) {
    console.error('Error cleaning up test data:', error)
  }
}

/**
 * Clean up all test data from current test run
 */
export async function cleanupCurrentTestData() {
  const startTime = getTestStartTime()
  await cleanupTestDataAfter(startTime)
}
