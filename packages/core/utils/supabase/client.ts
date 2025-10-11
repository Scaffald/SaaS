import type { Database } from '@app/supabase/types'
import { createClient } from '@supabase/supabase-js'
import { Platform } from 'react-native'

// Platform-specific imports
let storage: typeof import('@react-native-async-storage/async-storage').default | undefined

if (Platform.OS === 'web') {
  // Web: Use localStorage (default browser storage)
  storage = undefined // Supabase will use localStorage by default
} else {
  // Native: Use AsyncStorage
  import('react-native-url-polyfill/auto') // Required for React Native
  const AsyncStorage = require('@react-native-async-storage/async-storage').default
  storage = AsyncStorage
}

// Environment variables validation
if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  throw new Error(
    `EXPO_PUBLIC_SUPABASE_URL is not set. Please update the root .env with EXPO_PUBLIC_SUPABASE_URL and restart the server.`
  )
}

if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    `EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. Please update the root .env with EXPO_PUBLIC_SUPABASE_ANON_KEY and restart the server.`
  )
}

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

// Debug logging
console.log(`[${Platform.OS}] Supabase URL:`, supabaseUrl)
console.log(`[${Platform.OS}] Supabase Key:`, supabaseAnonKey ? 'Present' : 'Missing')

// Create unified Supabase client with platform-specific storage
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // Only detect URL sessions on web
  },
})
