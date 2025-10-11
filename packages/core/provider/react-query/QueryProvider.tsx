import { QueryClient, QueryClientProvider as QueryClientProviderOG } from '@tanstack/react-query'
import { api, createTrpcClient } from '@app/core/utils/api'
import { useState, type ReactNode } from 'react'

export const QueryClientProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        // web query config
      })
  )
  const [trpcClient] = useState(() => createTrpcClient())

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProviderOG client={queryClient}>{children}</QueryClientProviderOG>
    </api.Provider>
  )
}
