import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import SuperJSON from 'superjson'
import { Platform } from 'react-native'
import type { AppRouter } from '@app/supabase/functions/_shared/client-types'

import { getBaseUrl } from './getBaseUrl'
import { supabase } from './supabase/client'

// Create tRPC React client with proper typing from shared supabase package
export const api = createTRPCReact<AppRouter>()

export const createTrpcClient = () =>
  api.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/trpc`,
        // Remove SuperJSON transformer since server doesn't use it
        async headers() {
          const headers = new Map<string, string>()

          // Set platform-specific source header
          headers.set('x-trpc-source', Platform.OS === 'web' ? 'expo-web' : 'expo-react')

          const session = (await supabase.auth.getSession()).data.session

          // Add auth header for Supabase authentication
          if (session?.access_token) {
            headers.set('Authorization', `Bearer ${session.access_token}`)
          }

          return Object.fromEntries(headers)
        },
      }),
    ],
  })

// Type definitions for inputs and outputs (can be improved later with proper type generation)
export type RouterInputs = {
  'profile.getGeneral': void
  'profile.updateGeneral': {
    first_name: string
    last_name: string
    avatar_url?: string
    email: string
    phone?: string
    about?: string
  }
}

export type RouterOutputs = {
  'profile.getGeneral': {
    first_name: string
    last_name: string
    avatar_url: string
    email: string
    phone: string
    about: string
  }
  'profile.updateGeneral': { success: boolean }
}
