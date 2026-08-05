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
      // Web uses PKCE: OAuth returns ?code= (one-time, exchanged with a local
      // verifier) instead of tokens in the URL fragment. Native keeps implicit
      // — it signs in via signInWithIdToken and never parses callback URLs.
      //
      // DEPLOY ORDER CONSTRAINT: a pkce-configured client REJECTS implicit
      //-style #access_token callbacks (and _removeSession()s on the way out),
      // which is what GoTrue's {{ .ConfirmationURL }} email links produce.
      // The email templates must link to /auth/confirm?token_hash= (flow
      // -agnostic verifyOtp) — update the HOSTED project's templates and let
      // old links expire (otp_expiry) BEFORE shipping a web build with this
      // flag. See packages/supabase/email-templates/*.html.
      flowType: Platform.OS === 'web' ? 'pkce' : 'implicit',
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
