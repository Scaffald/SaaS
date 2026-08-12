import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider as QueryClientProviderOG,
} from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'
import { requestSessionRefresh } from '@scf/core/utils/auth/requestSessionRefresh'
import { setGlobalQueryClient } from './queryClient'
import { isAuthError, shouldRetry } from './retry'

/**
 * A 401 anywhere means the credential the client is holding is stale. Ask for
 * one refresh (single-flight, see requestSessionRefresh) and let the resulting
 * access-token change invalidate the cache — ScaffaldJobsSdkProviderFromSession
 * does the refetch. The queries themselves do not retry 401s; see ./retry.
 */
const onAuthFailure = (error: unknown) => {
  if (isAuthError(error)) void requestSessionRefresh()
}

export const QueryClientProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      queryCache: new QueryCache({ onError: onAuthFailure }),
      mutationCache: new MutationCache({ onError: onAuthFailure }),
      defaultOptions: {
        queries: {
          staleTime: 5 * 60 * 1000, // 5 minutes
          gcTime: 30 * 60 * 1000, // 30 minutes
          retry: (failureCount, error) => shouldRetry(failureCount, error, 2),
          retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
          refetchOnMount: true,
          throwOnError: false,
        },
        mutations: {
          retry: (failureCount, error) => shouldRetry(failureCount, error, 1),
        },
      },
    })
    setGlobalQueryClient(client)
    return client
  })

  return <QueryClientProviderOG client={queryClient}>{children as ReactNode}</QueryClientProviderOG>
}
