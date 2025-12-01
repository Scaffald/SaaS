import { randomUUID } from 'node:crypto'
import type { SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js'

export interface SupabaseTestClientOptions {
  readonly supabaseUrl?: string
  readonly anonKey?: string
  readonly serviceRoleKey?: string
  readonly schema?: 'public'
  readonly clientOptions?: SupabaseClientOptions<'public'>
}

export interface DatabaseLifecycleOptions extends SupabaseTestClientOptions {
  readonly resetFunction?: string
  readonly seedFunction?: string
  readonly cleanupFunction?: string
  readonly shouldReset?: boolean
  readonly shouldSeed?: boolean
  readonly shouldCleanup?: boolean
  readonly rpcPayload?: Record<string, unknown>
}

const DEFAULT_RESET_FUNCTION = 'reset_test_data'
const DEFAULT_SEED_FUNCTION = 'seed_test_data'
const DEFAULT_CLEANUP_FUNCTION = 'cleanup_test_data'

const DEFAULT_SUPABASE_URL =
  process.env.SUPABASE_TEST_URL ??
  process.env.SUPABASE_URL ??
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  'http://127.0.0.1:54321'

const DEFAULT_ANON_KEY =
  process.env.SUPABASE_TEST_ANON_KEY ??
  process.env.SUPABASE_ANON_KEY ??
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  'test-anon-key'

const DEFAULT_SERVICE_ROLE_KEY =
  process.env.SUPABASE_TEST_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY

let cachedServiceClient: SupabaseClient | undefined
let cachedAnonClient: SupabaseClient | undefined

async function importSupabase() {
  try {
    return await import('@supabase/supabase-js')
  } catch (error) {
    throw new Error(
      'The @supabase/supabase-js package is required to use the test database helpers. Ensure it is installed in the workspace.',
      { cause: error }
    )
  }
}

function resolveUrl(url?: string) {
  return url ?? DEFAULT_SUPABASE_URL
}

function resolveAnonKey(anonKey?: string) {
  return anonKey ?? DEFAULT_ANON_KEY
}

function resolveServiceRoleKey(serviceRoleKey?: string) {
  return serviceRoleKey ?? DEFAULT_SERVICE_ROLE_KEY
}

function withHeaders(headers: Record<string, string>) {
  return Object.entries(headers).reduce(
    (accumulator, [key, value]) => {
      if (value.length > 0) {
        accumulator[key] = value
      }
      return accumulator
    },
    {} as Record<string, string>
  )
}

function hasServiceRoleKey(options: SupabaseTestClientOptions) {
  return resolveServiceRoleKey(options.serviceRoleKey) !== undefined
}

async function createClient(
  options: SupabaseTestClientOptions,
  serviceRole: boolean
): Promise<SupabaseClient> {
  const supabaseModule = await importSupabase()
  const { createClient: createSupabaseClient } = supabaseModule
  const supabaseUrl = resolveUrl(options.supabaseUrl)
  const supabaseKey = serviceRole
    ? resolveServiceRoleKey(options.serviceRoleKey)
    : resolveAnonKey(options.anonKey)

  if (!supabaseKey) {
    throw new Error(
      `Missing ${
        serviceRole ? 'service role' : 'anon'
      } key for Supabase test helpers. Set SUPABASE_TEST_${serviceRole ? 'SERVICE_ROLE' : 'ANON'}_KEY or SUPABASE_${serviceRole ? 'SERVICE_ROLE' : 'ANON'}_KEY in your environment.`
    )
  }

  const cache = serviceRole ? cachedServiceClient : cachedAnonClient
  if (cache) {
    return cache
  }

  const client = createSupabaseClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      detectSessionInUrl: false,
      autoRefreshToken: false,
      storageKey: `vitest-${randomUUID()}`,
    },
    db: {
      schema: options.schema ?? 'public',
    },
    global: {
      headers: withHeaders({
        'X-Client-Info': 'vitest/test-helpers',
      }),
    },
    ...options.clientOptions,
  })

  if (serviceRole) {
    cachedServiceClient = client
  } else {
    cachedAnonClient = client
  }

  return client
}

export async function createTestClient(
  options: SupabaseTestClientOptions = {}
): Promise<SupabaseClient> {
  return createClient(options, false)
}

export async function createServiceRoleClient(
  options: SupabaseTestClientOptions = {}
): Promise<SupabaseClient> {
  return createClient(options, true)
}

async function invokeRpc(
  client: SupabaseClient,
  functionName: string,
  payload: Record<string, unknown> | undefined
) {
  const { error } = await client.rpc(functionName, payload ?? {})
  if (error) {
    const message = `Supabase RPC "${functionName}" failed: ${error.message}`
    if (error.code === 'PGRST116') {
      console.warn(`${message} (function missing). Skipping step.`)
      return
    }
    throw new Error(message, { cause: error })
  }
}

export async function resetDatabase(options: DatabaseLifecycleOptions = {}): Promise<void> {
  if (options.shouldReset === false) {
    return
  }
  if (!hasServiceRoleKey(options)) {
    console.warn(
      'Skipping Supabase reset step for tests because no service role key is configured.'
    )
    return
  }
  const client = await createServiceRoleClient(options)
  await invokeRpc(client, options.resetFunction ?? DEFAULT_RESET_FUNCTION, options.rpcPayload)
}

export async function seedTestData(options: DatabaseLifecycleOptions = {}): Promise<void> {
  if (options.shouldSeed === false) {
    return
  }
  if (!hasServiceRoleKey(options)) {
    console.warn('Skipping Supabase seed step for tests because no service role key is configured.')
    return
  }
  const client = await createServiceRoleClient(options)
  await invokeRpc(client, options.seedFunction ?? DEFAULT_SEED_FUNCTION, options.rpcPayload)
}

export async function cleanupTestData(options: DatabaseLifecycleOptions = {}): Promise<void> {
  if (options.shouldCleanup === false) {
    return
  }
  if (!hasServiceRoleKey(options)) {
    console.warn(
      'Skipping Supabase cleanup step for tests because no service role key is configured.'
    )
    return
  }
  const client = await createServiceRoleClient(options)
  await invokeRpc(client, options.cleanupFunction ?? DEFAULT_CLEANUP_FUNCTION, options.rpcPayload)
}

export async function setupTestDatabase(options: DatabaseLifecycleOptions = {}): Promise<void> {
  await resetDatabase(options)
  await seedTestData(options)
}

export async function teardownTestDatabase(options: DatabaseLifecycleOptions = {}): Promise<void> {
  await cleanupTestData(options)
}
