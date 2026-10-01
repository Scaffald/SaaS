/// <reference lib="deno.ns" />

/**
 * Shared test setup helpers for the standalone tRPC test workspace.
 */

import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const CURRENT_DIR = dirname(fileURLToPath(import.meta.url))
const TOKENS_FIXTURE_PATH = join(CURRENT_DIR, '../fixtures/tokens.json')

/**
 * First env var that is actually set to something.
 *
 * `??` was the wrong operator here: it falls back on `undefined`, not on `''`.
 * A CI job that exports `SUPABASE_ANON_KEY: ${{ secrets.MISSING }}` hands these
 * suites an EMPTY STRING, which beat the default — and every test then died on
 * `supabaseKey is required`, which reads like a broken test rather than an
 * unset secret. Cost an entire CI run to diagnose (#914).
 */
function envOr(names: string[], fallback: string): string {
  for (const name of names) {
    const value = Deno.env.get(name)
    if (value !== undefined && value.trim() !== '') return value
  }
  return fallback
}

export const TEST_SUPABASE_URL = envOr(
  ['EXPO_PUBLIC_SUPABASE_URL', 'SUPABASE_URL'],
  'http://127.0.0.1:54321',
)

export const TEST_SUPABASE_ANON_KEY = envOr(
  ['EXPO_PUBLIC_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY'],
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
)

export const TEST_SUPABASE_SERVICE_KEY = envOr(
  ['SUPABASE_SERVICE_ROLE_KEY'],
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU',
)

export const TEST_MAILPIT_URL = 'http://127.0.0.1:54324'

export interface TestUserDefinition {
  email: string
  password: string
}

// These must match what the seeds actually create, or every suite that needs a
// token fails at setup and takes ~100 unrelated assertions with it (#478).
//
// `regular` said 'testpassword123' while seeds/002a_seed-api-test-user.sql
// creates test@example.com with 'test123456'. Measured against the running
// stack: the seeded password returns 200 from /auth/v1/token, the constant here
// returned 400. The seed is the source of truth for local users, so this
// follows it rather than the other way round.
//
// `admin` has no seed at all -- no admin@example.com exists in auth.users -- so
// anything reaching for the admin token still fails. Seeding it needs a
// decision about which role it should carry; tracked on #478.
export const TEST_USERS: Record<'regular' | 'admin' | 'office', TestUserDefinition> = {
  regular: {
    email: 'test@example.com',
    password: 'test123456',
  },
  admin: {
    email: 'admin@example.com',
    password: 'adminpassword123',
  },
  // Seeded by `seeds/002_seed-users.sql`, which grants the core team addresses
  // the platform `office` role. `admin` above carries `worker/platform` only
  // (#478), so office-gated suites that reached for it got a 403 and read it
  // as a broken endpoint. Anything hitting /v1/office/** wants this one.
  office: {
    email: 'zach@unicorn.love',
    password: 'password123',
  },
}

export interface CachedTokenEntry {
  token: string
  email: string
  userId: string
  expiresAt: number
}

export interface CachedTokens {
  regular: CachedTokenEntry
  admin: CachedTokenEntry
  /**
   * A token that actually holds the platform `office` role. Optional so an
   * older fixture on disk still loads; suites that need it should assert.
   */
  office?: CachedTokenEntry
  cachedAt: number
}

export function createTestClient(authToken?: string): SupabaseClient {
  const headers: Record<string, string> = authToken ? { Authorization: `Bearer ${authToken}` } : {}

  return createClient(TEST_SUPABASE_URL, TEST_SUPABASE_ANON_KEY, {
    global: { headers },
  })
}

export function createAdminClient(): SupabaseClient {
  return createClient(TEST_SUPABASE_URL, TEST_SUPABASE_SERVICE_KEY)
}

export async function getAuthToken(email: string, password: string): Promise<string | null> {
  const supabase = createTestClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Auth error:', error)
    return null
  }

  return data.session?.access_token ?? null
}

type TrpcCallType = 'query' | 'mutation'

interface CallTRPCEndpointOptions {
  authToken?: string
  type?: TrpcCallType
  headers?: Record<string, string>
}

/**
 * Fetch with timeout protection
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 5000
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function callTRPCEndpoint(
  path: string,
  input?: unknown,
  optionsOrToken: CallTRPCEndpointOptions | string = {}
) {
  const normalizedOptions: CallTRPCEndpointOptions =
    typeof optionsOrToken === 'string' ? { authToken: optionsOrToken } : optionsOrToken

  const { authToken, type = 'query', headers: extraHeaders } = normalizedOptions

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${
      authToken && authToken.length > 0 ? authToken : TEST_SUPABASE_ANON_KEY
    }`,
    ...extraHeaders,
  }

  const baseUrl = `${TEST_SUPABASE_URL}/functions/v1/trpc/${path}`

  if (type === 'mutation') {
    const response = await fetchWithTimeout(
      `${baseUrl}?batch=1`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          0: input ?? null,
        }),
      },
      5000
    )

    const data = await response.json()
    return Array.isArray(data) ? data : [data]
  }

  const url =
    input === undefined
      ? baseUrl
      : `${baseUrl}?batch=1&input=${encodeURIComponent(JSON.stringify({ '0': input }))}`

  const response = await fetchWithTimeout(
    url,
    {
      method: 'GET',
      headers,
    },
    5000
  )

  const data = await response.json()
  return Array.isArray(data) ? data : [data]
}

export async function cleanupTestData(): Promise<void> {
  const admin = createAdminClient()

  await admin.from('applications').delete().like('user_id', '%')
  await admin.from('jobs').delete().like('title', 'Test%')
}

export async function loadCachedTokens(): Promise<CachedTokens | null> {
  try {
    const content = await Deno.readTextFile(TOKENS_FIXTURE_PATH)
    return JSON.parse(content)
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return null
    }
    throw error
  }
}

export async function saveCachedTokens(tokens: CachedTokens): Promise<void> {
  await ensureFixturesDir()
  await Deno.writeTextFile(TOKENS_FIXTURE_PATH, JSON.stringify(tokens, null, 2))
}

async function ensureFixturesDir(): Promise<void> {
  try {
    await Deno.mkdir(join(CURRENT_DIR, '../fixtures'), { recursive: true })
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error
    }
  }
}

export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() >= expiresAt - 60_000
}

export interface InbucketEmail {
  id: string
  from: string
  to: string[]
  subject: string
  date: string
  body?: {
    text?: string
    html?: string
  }
}

/**
 * Get latest email from Mailpit for a specific recipient
 * Uses timeout-based polling instead of retry loops to prevent hanging
 */
export async function getLatestEmail(
  recipient: string,
  timeoutMs = 5000
): Promise<InbucketEmail | null> {
  const startTime = Date.now()
  const pollInterval = 500

  while (Date.now() - startTime < timeoutMs) {
    try {
      // Check if we have time for another poll
      const remainingTime = timeoutMs - (Date.now() - startTime)
      if (remainingTime < pollInterval) {
        break
      }

      // Get list of emails from Mailpit with timeout
      const response = await fetchWithTimeout(
        `${TEST_MAILPIT_URL}/api/v1/messages`,
        {},
        Math.min(2000, remainingTime)
      )

      if (!response.ok) {
        // Wait before retrying if we have time
        if (Date.now() - startTime + pollInterval < timeoutMs) {
          await delay(pollInterval)
        }
        continue
      }

      const data = await response.json()
      const emails = data.messages ?? []

      // Filter emails for this recipient
      const recipientEmails = emails.filter((email: { To: { Address: string }[] }) =>
        email.To?.some((to: { Address: string }) => to.Address === recipient)
      )

      if (!recipientEmails.length) {
        // Wait before retrying if we have time
        if (Date.now() - startTime + pollInterval < timeoutMs) {
          await delay(pollInterval)
        }
        continue
      }

      // Get the latest email (first in list)
      const latestEmail = recipientEmails[0]
      const emailResponse = await fetchWithTimeout(
        `${TEST_MAILPIT_URL}/api/v1/message/${latestEmail.ID}`,
        {},
        Math.min(2000, timeoutMs - (Date.now() - startTime))
      )

      if (!emailResponse.ok) {
        throw new Error(`Failed to fetch email details: ${emailResponse.status}`)
      }

      const emailData = await emailResponse.json()

      return {
        id: emailData.ID,
        from: emailData.From?.Address ?? '',
        to: emailData.To?.map((t: { Address: string }) => t.Address) ?? [],
        subject: emailData.Subject,
        date: emailData.Date,
        body: {
          text: emailData.Text,
          html: emailData.HTML,
        },
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Timeout occurred, check if we have time for another attempt
        if (Date.now() - startTime + pollInterval < timeoutMs) {
          await delay(pollInterval)
          continue
        }
      }
      // For other errors, log and continue if we have time
      if (Date.now() - startTime + pollInterval < timeoutMs) {
        console.error('Error fetching email:', error)
        await delay(pollInterval)
      }
    }
  }

  throw new Error(`Email not received within ${timeoutMs}ms for ${recipient}`)
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function extractMagicLinkFromEmail(emailHtml: string): string | null {
  const linkMatch = emailHtml.match(
    /href="([^"]*(?:\/auth\/v1\/(?:verify|confirm)|token_hash)[^"]*)"/i
  )

  if (linkMatch?.[1]) {
    return linkMatch[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
  }

  return null
}

/**
 * Query params of an emailed magic link. Not `new URL()`: the link is built on
 * GoTrue's site_url, which CI leaves as the literal `env(EXPO_PUBLIC_URL)`.
 */
export function magicLinkParams(magicLink: string): URLSearchParams {
  const query = magicLink.indexOf('?')
  return new URLSearchParams(query === -1 ? '' : magicLink.slice(query + 1))
}

export async function completeMagicLinkAuth(
  magicLink: string
): Promise<{ token: string; userId: string } | null> {
  try {
    const params = magicLinkParams(magicLink)
    const token = params.get('token_hash') ?? params.get('token')
    const type = params.get('type')

    if (!token || !type) {
      console.error('Missing token or type in magic link')
      return null
    }

    const supabase = createTestClient()

    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as 'signup' | 'magiclink' | 'email',
    })

    if (error) {
      console.error('Error verifying OTP:', error)
      return null
    }

    if (!data.session?.access_token || !data.user?.id) {
      console.error('No access token or user ID in session')
      return null
    }

    return {
      token: data.session.access_token,
      userId: data.user.id,
    }
  } catch (error) {
    console.error('Error completing magic link auth:', error)
    return null
  }
}

export async function registerUserWithMagicLink(
  email: string
): Promise<{ token: string; userId: string } | null> {
  const supabase = createTestClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  })

  if (error) {
    console.error('Error requesting magic link:', error)
    return null
  }

  await delay(1_000)

  const emailData = await getLatestEmail(email)

  if (!emailData?.body?.html) {
    console.error('No email received in Mailpit')
    return null
  }

  const magicLink = extractMagicLinkFromEmail(emailData.body.html)

  if (!magicLink) {
    console.error('Could not extract magic link from email')
    return null
  }

  return await completeMagicLinkAuth(magicLink)
}

export async function loginUserWithMagicLink(
  email: string
): Promise<{ token: string; userId: string } | null> {
  const supabase = createTestClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
    },
  })

  if (error) {
    console.error('Error requesting magic link:', error)
    return null
  }

  await delay(1_000)

  const emailData = await getLatestEmail(email)

  if (!emailData?.body?.html) {
    console.error('No email received in Mailpit')
    return null
  }

  const magicLink = extractMagicLinkFromEmail(emailData.body.html)

  if (!magicLink) {
    console.error('Could not extract magic link from email')
    return null
  }

  return await completeMagicLinkAuth(magicLink)
}

export async function getUserIdFromToken(token: string): Promise<string | null> {
  const supabase = createTestClient()

  const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
    access_token: token,
    refresh_token: '',
  })

  if (sessionError || !sessionData.user) {
    console.error('Error setting session:', sessionError)
    return null
  }

  return sessionData.user.id
}
