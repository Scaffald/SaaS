import type { Database } from '@scf/supabase/types'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'
import { logger } from '../logger'
import { getSupabaseAnonKey, getSupabaseAuthUrl } from './api-base-url'

// Platform-specific imports
type AsyncStorageType = typeof import('@react-native-async-storage/async-storage').default
let storage: AsyncStorageType | undefined

if (Platform.OS === 'web') {
  // Web: Use localStorage (default browser storage)
  storage = undefined // Supabase will use localStorage by default
} else {
  // Native: Use AsyncStorage
  void import('react-native-url-polyfill/auto') // Required for React Native
  const AsyncStorage = require('@react-native-async-storage/async-storage')
    .default as AsyncStorageType
  storage = AsyncStorage
}

let client: SupabaseClient<Database> | undefined

// Constructing the client is deferred to first use rather than module load.
// expo-router evaluates every route module UNDER NODE at build time to
// generate the server manifest, and this module is reachable from route
// layouts (useProtectedRoute → useUser → here). A module-scope createClient
// therefore runs inside the EAS builder's Node — where supabase-js versions
// past ~2.100 require a native WebSocket global that Node < 22 does not have.
// That exact chain killed the v1.16.0 iOS build at EAGER_BUNDLE (#512).
// Nothing at build time *uses* the client, so deferring construction removes
// the whole class: importing this module must stay side-effect-free.
function getClient(): SupabaseClient<Database> {
  if (client) return client

  // Resolved through the shared module so this client and the Scaffald SDK
  // cannot drift apart silently — see api-base-url.ts and #376.
  const supabaseUrl = getSupabaseAuthUrl()
  const supabaseAnonKey = getSupabaseAnonKey()

  if (!supabaseUrl) {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_URL is not set. Please update the root .env with EXPO_PUBLIC_SUPABASE_URL and restart the server.'
    )
  }

  if (!supabaseAnonKey) {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. Please update the root .env with EXPO_PUBLIC_SUPABASE_ANON_KEY and restart the server.'
    )
  }

  // Debug logging (development only)
  if (__DEV__) {
    logger.debug('Supabase client initialized', {
      platform: Platform.OS,
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseAnonKey,
    })
  }

  // Create unified Supabase client with platform-specific storage
  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: Platform.OS === 'web', // Only detect URL sessions on web
      // NOTE: web is deliberately still on the implicit flow. Switching to
      // `flowType: 'pkce'` is a one-line change, but it is NOT safe to ship
      // in the same deploy as everything else: a pkce client rejects
      // implicit-style #access_token callbacks and calls _removeSession() on
      // the way out, which is exactly what GoTrue's {{ .ConfirmationURL }}
      // email links produce. The prerequisite is that every emailed link is
      // already the token_hash form (see packages/supabase/email-templates/*,
      // which now point at /auth/confirm) AND that any link issued before
      // that change has passed otp_expiry.
      //
      // Sequence for the follow-up: templates live in the hosted project ->
      // wait >= otp_expiry -> flip this to
      // `Platform.OS === 'web' ? 'pkce' : 'implicit'`.
    },
  })
  return client
}

// The export keeps the existing `supabase.auth…` / `supabase.from(…)` call
// sites working unchanged: the proxy builds the real client on first property
// access and forwards everything to it afterwards.
export const supabase: SupabaseClient<Database> = new Proxy(
  {} as SupabaseClient<Database>,
  {
    get(_target, prop) {
      const c = getClient()
      const value = Reflect.get(c as object, prop, c)
      return typeof value === 'function' ? (value as (...a: unknown[]) => unknown).bind(c) : value
    },
    has(_target, prop) {
      return prop in (getClient() as object)
    },
    ownKeys() {
      return Reflect.ownKeys(getClient() as object)
    },
    getOwnPropertyDescriptor(_target, prop) {
      const desc = Object.getOwnPropertyDescriptor(getClient() as object, prop)
      if (desc) desc.configurable = true
      return desc
    },
  }
)
