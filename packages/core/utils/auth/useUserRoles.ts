import { api } from '@app/core/utils/api'
import { useSessionContext } from '@app/core/utils/supabase/useSessionContext'
import type { AppRouter } from '@app/supabase/client-types'
import type { TRPCClientErrorLike } from '@trpc/client'
import { useCallback, useEffect, useMemo } from 'react'

const RETRY_ATTEMPTS = 3
const MAX_RETRY_DELAY_MS = 5_000
const BASE_RETRY_DELAY_MS = 750
const ROLES_STALE_TIME_MS = 5 * 60 * 1000
const ROLES_CACHE_TIME_MS = 15 * 60 * 1000

export function useUserRoles() {
  const { session, isLoading: isSessionLoading } = useSessionContext()
  const userId = session?.user?.id

  const isQueryEnabled = Boolean(userId) && !isSessionLoading

  const queryResult = api.auth.getUserRoles.useQuery(undefined, {
    enabled: isQueryEnabled,
    staleTime: ROLES_STALE_TIME_MS,
    gcTime: ROLES_CACHE_TIME_MS,
    refetchOnWindowFocus: false,
    retry(failureCount: number, error: TRPCClientErrorLike<AppRouter> | null | undefined) {
      if (failureCount >= RETRY_ATTEMPTS) {
        return false
      }

      // Do not retry on unauthorized errors – auth hook will handle redirect.
      if (error?.data?.code === 'UNAUTHORIZED') {
        return false
      }

      return true
    },
    retryDelay(attemptIndex: number) {
      const exponentialDelay = BASE_RETRY_DELAY_MS * 2 ** Math.max(0, attemptIndex - 1)
      return Math.min(exponentialDelay, MAX_RETRY_DELAY_MS)
    },
  })

  useEffect(() => {
    if (queryResult.isError) {
      console.warn('[useUserRoles] Failed to load roles', {
        error: queryResult.error?.message,
      })
    }
  }, [queryResult.isError, queryResult.error])

  const roles = useMemo(() => queryResult.data?.roles ?? [], [queryResult.data?.roles])

  const hasRole = useCallback((roleName: string) => roles.includes(roleName), [roles])

  const isLoading = isSessionLoading || (isQueryEnabled && queryResult.fetchStatus !== 'idle')

  return {
    roles,
    isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    refetch: queryResult.refetch,
    hasRole,
    hasOfficeRole: hasRole('office'),
  } satisfies {
    roles: string[]
    isLoading: boolean
    isError: boolean
    error: typeof queryResult.error
    refetch: typeof queryResult.refetch
    hasRole: (roleName: string) => boolean
    hasOfficeRole: boolean
  }
}
