/**
 * Auth SDK hooks for magic link and user roles.
 * Use these instead of api.auth.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo } from 'react'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import { useSessionContext } from './supabase/useSessionContext'
import type {
  RequestMagicLinkParams,
  RequestMagicLinkResponse,
} from '@scaffald/sdk'

const ROLES_STALE_TIME_MS = 5 * 60 * 1000
const ROLES_CACHE_TIME_MS = 15 * 60 * 1000
const RETRY_ATTEMPTS = 3
const MAX_RETRY_DELAY_MS = 5_000
const BASE_RETRY_DELAY_MS = 750

/** Request a magic link for login/signup */
export function useRequestMagicLinkMutation(
  options?: UseMutationOptions<RequestMagicLinkResponse, Error, RequestMagicLinkParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: RequestMagicLinkParams) => {
      if (!client) throw new Error('Missing SDK client')
      return client.auth.requestMagicLink(params)
    },
    ...options,
  })
}

/** Get roles for the authenticated user (SDK implementation) */
export function useUserRolesSdk() {
  const { session, isLoading: isSessionLoading } = useSessionContext()
  const userId = session?.user?.id
  const client = useScaffaldJobsClient()
  const isQueryEnabled = Boolean(userId) && !isSessionLoading && !!client

  const queryResult = useQuery({
    queryKey: ['auth', 'userRoles'],
    queryFn: async () => {
      if (!client) throw new Error('Missing SDK client')
      return client.auth.getUserRoles()
    },
    enabled: isQueryEnabled,
    staleTime: ROLES_STALE_TIME_MS,
    gcTime: ROLES_CACHE_TIME_MS,
    refetchOnWindowFocus: false,
    retry(failureCount, error) {
      if (failureCount >= RETRY_ATTEMPTS) return false
      const err = error as { status?: number }
      if (err?.status === 401) return false
      return true
    },
    retryDelay(attemptIndex) {
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
  }
}
