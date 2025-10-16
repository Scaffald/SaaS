import { QueryClient, QueryClientProvider as QueryClientProviderOG } from '@tanstack/react-query'
import { api, createTrpcClient } from '@app/core/utils/api'
import { useState, type ReactNode } from 'react'

// Global query client instance accessible throughout the app
let globalQueryClient: QueryClient | null = null

/**
 * Get the global query client instance
 * This allows accessing the query client outside of React components
 * Useful for clearing cache during auth cleanup
 */
export function getGlobalQueryClient(): QueryClient | null {
  return globalQueryClient
}

export const QueryClientProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      // web query config
    })
    globalQueryClient = client
    return client
  })
  const [trpcClient] = useState(() => createTrpcClient())

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProviderOG client={queryClient}>{children}</QueryClientProviderOG>
    </api.Provider>
  )
}
