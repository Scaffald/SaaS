import NetInfo from '@react-native-community/netinfo'
import {
  focusManager,
  MutationCache,
  onlineManager,
  QueryCache,
  QueryClient,
  QueryClientProvider as QueryClientProviderOG,
} from '@tanstack/react-query'
import { type ReactNode, useEffect, useState } from 'react'
import type { AppStateStatus } from 'react-native'
import { AppState, Platform } from 'react-native'
import { requestSessionRefresh } from '@scf/core/utils/auth/requestSessionRefresh'
import { setGlobalQueryClient } from './queryClient'
import { isAuthError, shouldRetry } from './retry'

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    setOnline(!!state.isConnected)
  })
})

function onAppStateChange(status: AppStateStatus) {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active')
  }
}

/** See the web QueryProvider — same policy, kept in sync deliberately. */
const onAuthFailure = (error: unknown) => {
  if (isAuthError(error)) void requestSessionRefresh()
}

export const QueryClientProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange)

    return () => subscription.remove()
  }, [])
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
