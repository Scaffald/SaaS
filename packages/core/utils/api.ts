import type { AppRouter } from '@app/api'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import SuperJSON from 'superjson'
import { Platform } from 'react-native'

import { getBaseUrl } from './getBaseUrl'
import { supabase } from './supabase/client'

export const api = createTRPCReact<AppRouter>()

export const createTrpcClient = () =>
  api.createClient({
    links: [
      httpBatchLink({
        url: `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/trpc`,
        transformer: SuperJSON,
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

export { type RouterInputs, type RouterOutputs } from '@app/api'
