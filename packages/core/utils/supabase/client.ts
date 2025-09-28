import 'react-native-url-polyfill/auto'
import { default as AsyncStorage } from '@react-native-async-storage/async-storage'
import { Database } from '@app/supabase/types'
import { createClient } from '@supabase/supabase-js'

// Get environment variables with fallbacks for different platforms
const getSupabaseUrl = () => {
  // Use EXPO_PUBLIC for all environments
  return process.env.EXPO_PUBLIC_SUPABASE_URL
}

const getSupabaseAnonKey = () => {
  // Use EXPO_PUBLIC for all environments
  return process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
}

const supabaseUrl = getSupabaseUrl()
const supabaseAnonKey = getSupabaseAnonKey()

if (!supabaseUrl) {
  throw new Error(
    `Supabase URL is not set. Please update the root .env with EXPO_PUBLIC_SUPABASE_URL and restart the server.`
  )
}

if (!supabaseAnonKey) {
  throw new Error(
    `Supabase Anon Key is not set. Please update the root .env with EXPO_PUBLIC_SUPABASE_ANON_KEY and restart the server.`
  )
}

// Debug: Log the URL being used
console.log('Supabase URL being used:', supabaseUrl)
console.log('Supabase Anon Key being used:', supabaseAnonKey ? 'Present' : 'Missing')

// Configure Supabase client according to Expo documentation
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
