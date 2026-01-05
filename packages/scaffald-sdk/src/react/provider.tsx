import type React from 'react'
import { createContext, useContext, useMemo } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Scaffald } from '../client.js'
import type { ScaffaldConfig } from '../config.js'

/**
 * Scaffald React context
 */
const ScaffaldContext = createContext<Scaffald | null>(null)

/**
 * Scaffald Provider props
 */
export interface ScaffaldProviderProps {
  config: ScaffaldConfig
  queryClient?: QueryClient
  children: React.ReactNode
}

/**
 * Default Query Client configuration
 * Matches the existing patterns in the codebase
 */
const createDefaultQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
        retry: 2,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: false,
      },
    },
  })

/**
 * Scaffald Provider component
 *
 * Wraps your app to provide Scaffald SDK and React Query context
 *
 * @example
 * ```tsx
 * import { ScaffaldProvider } from '@scaffald/sdk/react'
 *
 * function App() {
 *   return (
 *     <ScaffaldProvider
 *       config={{
 *         apiKey: process.env.SCAFFALD_API_KEY
 *       }}
 *     >
 *       <YourApp />
 *     </ScaffaldProvider>
 *   )
 * }
 * ```
 */
export const ScaffaldProvider: React.FC<ScaffaldProviderProps> = ({
  config,
  queryClient,
  children,
}) => {
  const client = useMemo(() => new Scaffald(config), [config])
  const internalQueryClient = useMemo(
    () => queryClient || createDefaultQueryClient(),
    [queryClient]
  )

  return (
    <ScaffaldContext.Provider value={client}>
      <QueryClientProvider client={internalQueryClient}>{children}</QueryClientProvider>
    </ScaffaldContext.Provider>
  )
}

/**
 * Hook to access Scaffald SDK instance
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const scaffald = useScaffald()
 *
 *   // Access SDK directly
 *   const rateLimitInfo = scaffald.getRateLimitInfo()
 * }
 * ```
 */
export function useScaffald(): Scaffald {
  const context = useContext(ScaffaldContext)
  if (!context) {
    throw new Error('useScaffald must be used within ScaffaldProvider')
  }
  return context
}
