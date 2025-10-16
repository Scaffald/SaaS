import NetInfo from '@react-native-community/netinfo'
import {
  QueryClient,
  QueryClientProvider as QueryClientProviderOG,
  focusManager,
  onlineManager,
} from '@tanstack/react-query'
import { api, createTrpcClient } from '@app/core/utils/api'
import { useEffect, useState, type ReactNode } from 'react'
import type { AppStateStatus } from 'react-native'
import { AppState, Platform } from 'react-native'

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
      // native query config
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
