import { QueryClient, QueryClientProvider as QueryClientProviderOG } from '@tanstack/react-query'
import { api, createTrpcClient } from '@app/core/utils/api'
import { useState, type ReactNode } from 'react'
import { setGlobalQueryClient } from './queryClient'

export const QueryClientProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      // web query config
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
