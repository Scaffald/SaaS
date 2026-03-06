/**
 * Setup for SDK integration tests. No MSW – tests hit the real API.
 * Run only when SCAFFALD_INTEGRATION=1 and local API is available.
 */

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'http://127.0.0.1:54321'
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  ''

export const isIntegrationEnabled = (): boolean => {
  if (process.env.SCAFFALD_INTEGRATION !== '1' && process.env.REAL_API !== '1') {
    return false
  }
  const isLocal =
    SUPABASE_URL.includes('127.0.0.1') || SUPABASE_URL.includes('localhost')
  return isLocal && Boolean(SUPABASE_ANON_KEY)
}

export function getIntegrationConfig(): {
  baseUrl: string
  supabaseUrl: string
  supabaseAnonKey: string
  testUserEmail: string
  testUserPassword: string
} {
  const baseUrl = `${SUPABASE_URL}/functions/v1/api`
  return {
    baseUrl,
    supabaseUrl: SUPABASE_URL,
    supabaseAnonKey: SUPABASE_ANON_KEY,
    testUserEmail: process.env.SCAFFALD_TEST_USER_EMAIL || 'test@example.com',
    testUserPassword: process.env.SCAFFALD_TEST_USER_PASSWORD || 'test123456',
  }
}
