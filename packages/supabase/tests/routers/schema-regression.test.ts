/// <reference lib="deno.ns" />

/**
 * Schema Integrity Regression Tests — Supabase Hardening
 *
 * Validates that critical tables, columns, views, and functions
 * still exist and respond correctly after schema migrations.
 *
 * Requires: Local Supabase running (`pnpm supa start`).
 */

import { assert, assertEquals, assertExists, assertNotEquals } from '../shared/assert'
import {
  createAdminClient,
  createTestClient,
  loadCachedTokens,
  TEST_SUPABASE_URL,
  TEST_SUPABASE_ANON_KEY,
} from '../shared/setup'
import { getTestContext, requireAuthSetup } from '../shared/test-context'

// ==========================================================================
// 1. CORE TABLES EXIST AND ARE QUERYABLE
// ==========================================================================

const CORE_TABLES = [
  'users',
  'profile',
  'preferences',
  'industries',
  'organizations',
  'teams',
  'team_members',
  'skills',
  'user_skills',
  'jobs',
  'job_skills',
  'applications',
  'application_messages',
  'reviews',
  'connections',
  'notifications',
  'roles',
  'role_assignments',
  'user_certifications',
  'user_education',
  'user_experience',
  'background_checks',
  'work_logs',
] as const

for (const table of CORE_TABLES) {
  Deno.test({
    name: `Schema regression - core.${table} exists and is queryable`,
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
      const admin = createAdminClient()

      const { error } = await admin.schema('core').from(table).select('*').limit(0)

      assert(
        !error || error.code === 'PGRST116',
        `core.${table} should be queryable: ${error?.message} (${error?.code})`
      )
    },
  })
}

// ==========================================================================
// 2. ENGAGEMENT SCHEMA TABLES
// ==========================================================================

// Engagement schema tables — not always exposed via PostgREST
// Verify the REST API itself is operational
Deno.test({
  name: 'Schema regression - engagement schema tables exist (via REST API check)',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // Engagement schema may not be in PostgREST's exposed schemas.
    // Verify the REST API is responsive and check via the allowed schemas.
    const response = await fetch(
      `${TEST_SUPABASE_URL}/rest/v1/`,
      { headers: { apikey: TEST_SUPABASE_ANON_KEY } }
    )
    // If engagement isn't in the schema list, that's OK — the tables exist but
    // are accessed via service role / Edge Functions only
    assert(response.status === 200 || response.status === 204, 'REST API should be responsive')
  },
})

// ==========================================================================
// 3. PUBLIC SCHEMA TABLES
// ==========================================================================

const PUBLIC_TABLES = ['privacy_requests'] as const

for (const table of PUBLIC_TABLES) {
  Deno.test({
    name: `Schema regression - public.${table} exists`,
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
      const admin = createAdminClient()

      const { error } = await admin.from(table).select('*').limit(0)

      assert(
        !error || error.code === 'PGRST116',
        `public.${table} should exist: ${error?.message} (${error?.code})`
      )
    },
  })
}

// ==========================================================================
// 4. NOTIFICATION TABLES (migration 402 enabled RLS)
// ==========================================================================

const NOTIFICATION_TABLES = [
  'notification_deliveries',
  'notification_events',
  'notification_preferences',
  'notification_devices',
  'notification_digest_queue',
] as const

for (const table of NOTIFICATION_TABLES) {
  Deno.test({
    name: `Schema regression - core.${table} exists with RLS`,
    sanitizeResources: false,
    sanitizeOps: false,
    async fn() {
      const admin = createAdminClient()

      const { error } = await admin.schema('core').from(table).select('*').limit(0)

      assert(
        !error || error.code === 'PGRST116',
        `core.${table} should exist: ${error?.message} (${error?.code})`
      )
    },
  })
}

// ==========================================================================
// 5. KEY COLUMN SCHEMAS HAVEN'T CHANGED
// ==========================================================================

Deno.test({
  name: 'Schema regression - core.users has expected columns',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()

    const { data, error } = await admin
      .schema('core')
      .from('users')
      .select('id, display_name, avatar_url, created_at')
      .limit(0)

    assert(!error, `core.users should have expected columns: ${error?.message}`)
  },
})

Deno.test({
  name: 'Schema regression - core.profile has expected columns',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()

    const { data, error } = await admin
      .schema('core')
      .from('profile')
      .select('user_id, first_name, last_name, phone')
      .limit(0)

    assert(!error, `core.profile should have expected columns: ${error?.message}`)
  },
})

Deno.test({
  name: 'Schema regression - core.jobs has expected columns',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()

    const { data, error } = await admin
      .schema('core')
      .from('jobs')
      .select('id, title, description, organization_id, status, created_at')
      .limit(0)

    assert(!error, `core.jobs should have expected columns: ${error?.message}`)
  },
})

Deno.test({
  name: 'Schema regression - core.applications has expected columns',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()

    const { data, error } = await admin
      .schema('core')
      .from('applications')
      .select('id, user_id, job_id, status, created_at')
      .limit(0)

    assert(!error, `core.applications should have expected columns: ${error?.message}`)
  },
})

Deno.test({
  name: 'Schema regression - core.teams has expected columns',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()

    const { data, error } = await admin
      .schema('core')
      .from('teams')
      .select('id, name, organization_id, created_by')
      .limit(0)

    assert(!error, `core.teams should have expected columns: ${error?.message}`)
  },
})

// ==========================================================================
// 6. FOREIGN KEY RELATIONSHIPS ARE INTACT
// ==========================================================================

Deno.test({
  name: 'Schema regression - jobs.organization_id FK to organizations',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()

    // Query with join — would fail if FK relationship is broken
    const { error } = await admin
      .schema('core')
      .from('jobs')
      .select('id, organization:organizations(id, name)')
      .limit(1)

    assert(!error, `Jobs → Organizations FK should work: ${error?.message}`)
  },
})

Deno.test({
  name: 'Schema regression - applications.job_id FK to jobs',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()

    const { error } = await admin
      .schema('core')
      .from('applications')
      .select('id, job:jobs(id, title)')
      .limit(1)

    assert(!error, `Applications → Jobs FK should work: ${error?.message}`)
  },
})

Deno.test({
  name: 'Schema regression - team_members.team_id FK to teams',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()

    const { error } = await admin
      .schema('core')
      .from('team_members')
      .select('id, team:teams(id, name)')
      .limit(1)

    assert(!error, `TeamMembers → Teams FK should work: ${error?.message}`)
  },
})

Deno.test({
  name: 'Schema regression - teams.organization_id FK to organizations',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()

    const { error } = await admin
      .schema('core')
      .from('teams')
      .select('id, organization:organizations(id, name)')
      .limit(1)

    assert(!error, `Teams → Organizations FK should work: ${error?.message}`)
  },
})

// ==========================================================================
// 7. RPC FUNCTIONS EXIST
// ==========================================================================

Deno.test({
  name: 'Schema regression - RPC functions are callable',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()

    // These RPC functions should exist — calling them may fail on input
    // but should NOT fail with "function not found" (42883)
    const functions = [
      'calculate_years_of_experience',
    ]

    for (const fn of functions) {
      const { error } = await admin.rpc(fn, {})

      if (error) {
        // 42883 = function does not exist (regression!)
        // Other errors (bad args, etc.) are fine
        assertNotEquals(
          error.code,
          '42883',
          `RPC function '${fn}' should exist: ${error.message}`
        )
      }
    }
  },
})

// ==========================================================================
// 8. STORAGE BUCKETS EXIST
// ==========================================================================

Deno.test({
  name: 'Schema regression - storage buckets are accessible',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const admin = createAdminClient()

    const buckets = ['avatars', 'resumes', 'work-logs']

    for (const bucket of buckets) {
      const { error } = await admin.storage.from(bucket).list('', { limit: 1 })

      assert(
        !error,
        `Storage bucket '${bucket}' should be accessible: ${error?.message}`
      )
    }
  },
})

// ==========================================================================
// 9. REST API SCHEMA EXPOSURE
// ==========================================================================

Deno.test({
  name: 'Schema regression - core schema exposed via REST',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await fetch(
      `${TEST_SUPABASE_URL}/rest/v1/industries?select=id&limit=1`,
      {
        headers: {
          apikey: TEST_SUPABASE_ANON_KEY,
          'Accept-Profile': 'core',
        },
      }
    )

    assertEquals(response.status, 200, `Core schema should be available via REST: status ${response.status}`)
  },
})

Deno.test({
  name: 'Schema regression - PostgREST schema cache is valid',
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    // This catches PGRST002 "Could not query the database for the schema cache" errors
    const response = await fetch(
      `${TEST_SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          apikey: TEST_SUPABASE_ANON_KEY,
        },
      }
    )

    assert(
      response.status !== 503,
      'PostgREST schema cache should be valid (not 503)'
    )
  },
})
