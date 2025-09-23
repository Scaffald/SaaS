import { QueryClient, QueryClientProvider as ClientProvider } from '@tanstack/react-query'

const isNotFoundError = (error: unknown) => {
  if (!error) return false

  const asRecord = typeof error === 'object' && error !== null ? (error as Record<string, unknown>) : null
  const message = typeof error === 'string' ? error : (asRecord?.message as string | undefined)
  const details = asRecord?.details as string | undefined
  const status = asRecord?.status as number | undefined
  const code = asRecord?.code as string | undefined

  if (status === 404) return true
  if (code && ['PGRST302', 'PGRST404', '42P01'].includes(code)) return true

  const normalized = `${message ?? ''} ${details ?? ''}`.toLowerCase()
  return normalized.includes('not found') || normalized.includes('does not exist')
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: (failureCount, error) => {
        if (isNotFoundError(error)) return false
        return failureCount < 2
      },
    },
  },
})

export const QueryClientProvider = ({ children }: { children: React.ReactNode }) => {
  return <ClientProvider client={queryClient}>{children}</ClientProvider>
}
