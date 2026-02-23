import NetInfo from '@react-native-community/netinfo'
import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider as QueryClientProviderOG,
} from '@tanstack/react-query'
import { type ReactNode, useEffect, useState } from 'react'
import type { AppStateStatus } from 'react-native'
import { AppState, Platform } from 'react-native'
import { setGlobalQueryClient } from './queryClient'

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

export const QueryClientProvider = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange)

    return () => subscription.remove()
  }, [])
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
  return (
    <QueryClientProviderOG client={queryClient}>{children}</QueryClientProviderOG>
  )
}
