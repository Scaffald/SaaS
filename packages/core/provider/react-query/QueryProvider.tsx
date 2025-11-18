import { QueryClient, QueryClientProvider as QueryClientProviderOG } from '@tanstack/react-query'
import { api, createTrpcClient } from '@app/core/utils/api'
import { useState, type ReactNode } from 'react'
import { setGlobalQueryClient } from './queryClient'

export const QueryClientProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 30 * 60 * 1000, // 30 minutes
          retry: 2,
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
          refetchOnMount: true,
          throwOnError: false,
        },
        mutations: {
          retry: 1,
        },
      },
    })
    setGlobalQueryClient(client)
    return client
  })
  const [trpcClient] = useState(() => createTrpcClient())

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProviderOG client={queryClient}>{children}</QueryClientProviderOG>
    </api.Provider>
  )
}
