import type React from 'react'
import { createContext, useContext, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Scaffald } from '../client.js'
import type { ScaffaldConfig } from '../config.js'

export interface ScaffaldProviderProps {
  config: ScaffaldConfig | null
  children: React.ReactNode
  queryClient?: QueryClient
}

const ScaffaldContext = createContext<Scaffald | null>(null)

/**
 * Provider component for the Scaffald SDK
 *
 * @example
 * ```tsx
 * import { ScaffaldProvider } from '@scaffald/sdk/react'
 *
 * function App() {
 *   return (
 *     <ScaffaldProvider config={{ apiKey: process.env.SCAFFALD_API_KEY }}>
 *       <YourApp />
 *     </ScaffaldProvider>
 *   )
 * }
 * ```
 */
export function ScaffaldProvider({ config, children, queryClient }: ScaffaldProviderProps) {
  const client = useMemo(() => (config ? new Scaffald(config) : null), [config])

  const defaultQueryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 1,
          },
        },
      }),
    []
  )

  const qc = queryClient || defaultQueryClient

  return (
    <ScaffaldContext.Provider value={client}>
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    </ScaffaldContext.Provider>
  )
}

/**
 * Hook to access the Scaffald SDK client
 *
 * @throws {Error} If used outside of ScaffaldProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const client = useScaffald()
 *   // Use client.jobs.list(), etc.
 * }
 * ```
 */
export function useScaffald(): Scaffald {
  const context = useContext(ScaffaldContext)
  if (!context) {
    throw new Error('useScaffald must be used within a ScaffaldProvider')
  }
  return context
}

/**
 * Returns the Scaffald client or null if not inside a ScaffaldProvider.
 * Use useScaffald() if you want a hard error on missing provider.
 */
export function useScaffaldOrNull(): Scaffald | null {
  return useContext(ScaffaldContext)
}
