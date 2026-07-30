import type { Database } from '@scf/supabase/types'
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

// Resolved through the shared module so this client and the Scaffald SDK
// cannot drift apart silently — see api-base-url.ts and #376.
const resolvedSupabaseUrl = getSupabaseAuthUrl()
const resolvedSupabaseAnonKey = getSupabaseAnonKey()

if (!resolvedSupabaseUrl) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL is not set. Please update the root .env with EXPO_PUBLIC_SUPABASE_URL and restart the server.'
  )
}

if (!resolvedSupabaseAnonKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. Please update the root .env with EXPO_PUBLIC_SUPABASE_ANON_KEY and restart the server.'
  )
}

const supabaseUrl = resolvedSupabaseUrl
const supabaseAnonKey = resolvedSupabaseAnonKey

// Debug logging (development only)
if (__DEV__) {
  logger.debug('Supabase client initialized', {
    platform: Platform.OS,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
  })
}

// Create unified Supabase client with platform-specific storage
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // Only detect URL sessions on web
  },
})
