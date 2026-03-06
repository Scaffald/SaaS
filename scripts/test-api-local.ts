#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * Local API Test Script
 * Tests REST API routes with optional JWT. Use TEST_ACCESS_TOKEN for a Supabase
 * session access_token, or the script will try signInWithPassword with test user.
 *
 * Usage:
 *   TEST_ACCESS_TOKEN="eyJ..." pnpm exec deno run --allow-net --allow-env scripts/test-api-local.ts
 *   # Or ensure test user exists and run without token:
 *   pnpm exec deno run --allow-net --allow-env scripts/test-api-local.ts
 *
 * See packages/supabase/functions/api/AUTH.md for auth details.
 */

import { createClient } from 'npm:@supabase/supabase-js@2.39.0'

const SUPABASE_URL =
  Deno.env.get('EXPO_PUBLIC_SUPABASE_URL') ||
  Deno.env.get('SUPABASE_URL') ||
  'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY =
  Deno.env.get('EXPO_PUBLIC_SUPABASE_ANON_KEY') ||
  Deno.env.get('SUPABASE_ANON_KEY') ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

const API_BASE = `${SUPABASE_URL}/functions/v1/api`

/** Auth expectation: none = anon ok, requireAuth = need JWT/API key, requireRole = need office role (403 without) */
type AuthType = 'none' | 'requireAuth' | 'requireRole'

interface EndpointDef {
  path: string
  method: string
  authType: AuthType
  note?: string
}

const ENDPOINTS: EndpointDef[] = [
  { path: '/health', method: 'GET', authType: 'none', note: 'no auth' },
  { path: '/v1/auth/roles', method: 'GET', authType: 'requireAuth', note: 'token check' },
  { path: '/v1/auth/session', method: 'GET', authType: 'requireAuth', note: 'token check' },
  { path: '/v1/jobs', method: 'GET', authType: 'none' },
  { path: '/v1/jobs/filter-options', method: 'GET', authType: 'none' },
  { path: '/v1/industries', method: 'GET', authType: 'none' },
  { path: '/v1/api-keys', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/connections', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/notifications', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/profile-views', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/feedback/user-feedback', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/resume/wizard-state', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/success-fees/status', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/id-verification/pricing', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/office/jobs', method: 'GET', authType: 'requireRole', note: '403 without office role' },
  { path: '/v1/office/organizations', method: 'GET', authType: 'requireRole', note: '403 without office role' },
  { path: '/v1/notifications/admin', method: 'GET', authType: 'requireRole', note: '403 without office role' },
  { path: '/v1/onet/skills', method: 'GET', authType: 'none' },
  { path: '/v1/news', method: 'GET', authType: 'none' },
  { path: '/v1/map/location-counts', method: 'GET', authType: 'none' },
<<<<<<< HEAD
  // Profile
  { path: '/v1/profiles/experience', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/profiles/experience/summary', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/profiles/education', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/profiles/certifications/top-level', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/profiles/certifications/tree', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/profiles/portfolio', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/profiles/widgets/general-info', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/profiles/completion/status', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/profiles/skills', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/profiles/employment', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/profile-wizard/progress', method: 'GET', authType: 'requireAuth' },
  // User profiles (preview may 400 without userId; smoke check)
  { path: '/v1/user-profiles/preview', method: 'GET', authType: 'requireAuth', note: 'may 400 if no userId' },
  // Other
  { path: '/v1/prerequisites', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/teams', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/organizations', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/inquiries', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/background-checks', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/legal-agreements', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/account-deletion', method: 'GET', authType: 'requireAuth' },
  { path: '/v1/documents/storage-preference', method: 'GET', authType: 'requireAuth' },
=======
>>>>>>> bcccec207 (chore: SDK integration tests, supabase config, forsured-web updates, and infra cleanup)
]

async function fetchWithAuth(
  path: string,
  method: string,
  token: string | null
): Promise<{ status: number; ok: boolean }> {
  const url = `${API_BASE}${path}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  } else {
    headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`
  }
  try {
    const res = await fetch(url, { method, headers })
    return { status: res.status, ok: res.ok }
  } catch (e) {
    console.error(`Request failed ${method} ${path}:`, e)
    return { status: 0, ok: false }
  }
}

function tokenCheck(token: string): Promise<boolean> {
  return fetchWithAuth('/v1/auth/session', 'GET', token).then((r) => r.ok)
}

async function testHealth(): Promise<boolean> {
<<<<<<< HEAD
  const url = `${API_BASE}/health`
  try {
    const res = await fetch(url, { method: 'GET' })
    if (!res.ok) {
      console.error(`   Health GET ${url} → ${res.status} ${res.statusText}`)
      if (res.status === 404) {
        console.error('   A 404 here often means the function server is running old code (e.g. with basePath). Restart: pnpm supa functions serve api')
      }
      return false
    }
    const data = await res.json()
    return data?.status === 'ok'
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error(`   Health GET ${url} failed: ${msg}`)
    console.error('   Ensure Supabase is running (pnpm supa start) and the API function is served (pnpm supa functions serve api).')
    console.error('   If using .env, ensure EXPO_PUBLIC_SUPABASE_URL or SUPABASE_URL points to local (e.g. http://127.0.0.1:54321).')
    return false
  }
=======
  const res = await fetch(`${API_BASE}/health`, { method: 'GET' })
  if (!res.ok) return false
  const data = await res.json()
  return data?.status === 'ok'
>>>>>>> bcccec207 (chore: SDK integration tests, supabase config, forsured-web updates, and infra cleanup)
}

async function main() {
  console.log('🚀 API endpoint test script')
  console.log(`   API_BASE=${API_BASE}`)

  const healthOk = await testHealth()
  if (!healthOk) {
    console.log('\n❌ Health check failed. Is the API running?')
    console.log('   Try: pnpm supa functions serve api  (or supabase functions serve api)')
    Deno.exit(1)
  }
  console.log('   Health: ✅')

  let token: string | null = Deno.env.get('TEST_ACCESS_TOKEN')?.trim() ?? null

  if (!token) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123456',
    })
    if (error || !data.session?.access_token) {
      console.log('\n⚠️  No TEST_ACCESS_TOKEN and test user sign-in failed.')
      console.log('   Set TEST_ACCESS_TOKEN to a Supabase session access_token, or create test user test@example.com / test123456')
      console.log('   Proceeding with anon key only (requireAuth/requireRole routes will show 401/403).\n')
    } else {
      token = data.session.access_token
      console.log('   Token: from signInWithPassword ✅')
    }
  } else {
    console.log('   Token: from TEST_ACCESS_TOKEN')
  }

  if (token) {
    const valid = await tokenCheck(token)
    if (!valid) {
      console.log('\n⚠️  Token check failed (GET /v1/auth/session returned non-2xx).')
      console.log('   Ensure SUPABASE_URL/issuer match where the token was issued (e.g. local 127.0.0.1:54321).')
      console.log('   Proceeding anyway to show per-route status.\n')
    } else {
      console.log('   Token validity: ✅\n')
    }
  }

  console.log('Endpoint results (with ' + (token ? 'JWT' : 'anon key') + '):\n')
  console.log('| path | method | status | authType | note |')
  console.log('|------|--------|--------|----------|------|')

  for (const ep of ENDPOINTS) {
    const { status } = await fetchWithAuth(ep.path, ep.method, token)
    const note = ep.note ?? ''
    const statusStr = status === 0 ? 'ERR' : String(status)
    const expected =
      ep.authType === 'requireRole' && token && status === 403
        ? ' (expected 403 if no office role)'
        : ep.authType === 'requireAuth' && !token && status === 401
          ? ' (expected 401 without token)'
          : ''
    console.log(`| ${ep.path} | ${ep.method} | ${statusStr} | ${ep.authType} | ${note}${expected} |`)
  }

  console.log('\n📊 Done. Use session.access_token (not provider_token) for Bearer auth. See packages/supabase/functions/api/AUTH.md')
}

main()
