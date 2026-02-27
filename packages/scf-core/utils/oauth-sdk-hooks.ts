/**
 * OAuth Management SDK Hooks
 * Hooks for OAuth app registration, consent management, and admin operations.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  OAuthAppDetails,
  RegisterAppParams,
  RegisterAppResponse,
  GrantConsentParams,
  GrantConsentResponse,
  ListUserConsentsResponse,
  OAuthAppAdmin,
  ListAppsParams,
  ListAppsResponse,
  ListScopesResponse,
} from '@scaffald/sdk'

// =====================================================
// User-facing Query Hooks
// =====================================================

export function useOAuthAppDetails(clientId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery<OAuthAppDetails>({
    queryKey: ['oauth', 'app', clientId],
    queryFn: async () => {
      if (!client || !clientId) throw new Error('Missing client or clientId')
      return client.oauthManagement.getAppDetails(clientId)
    },
    enabled: !!client && !!clientId && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useUserConsents(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery<ListUserConsentsResponse>({
    queryKey: ['oauth', 'consents'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.oauthManagement.listUserConsents()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

// =====================================================
// User-facing Mutation Hooks
// =====================================================

export function useRegisterAppMutation(
  options?: UseMutationOptions<RegisterAppResponse, Error, RegisterAppParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation<RegisterAppResponse, Error, RegisterAppParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing client')
      return client.oauthManagement.registerApp(params)
    },
    ...options,
  })
}

export function useGrantConsentMutation(
  options?: UseMutationOptions<GrantConsentResponse, Error, GrantConsentParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation<GrantConsentResponse, Error, GrantConsentParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing client')
      return client.oauthManagement.grantConsent(params)
    },
    ...options,
  })
}

export function useRevokeConsentMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (consentId) => {
      if (!client) throw new Error('Missing client')
      return client.oauthManagement.revokeConsent(consentId)
    },
    ...options,
  })
}

// =====================================================
// Admin Query Hooks
// =====================================================

export function useAdminOAuthApps(params?: ListAppsParams, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery<ListAppsResponse>({
    queryKey: ['oauth', 'admin', 'apps', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.oauthManagement.adminListApps(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

export function useAdminOAuthAppDetail(appId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery<{ app: OAuthAppAdmin }>({
    queryKey: ['oauth', 'admin', 'app', appId],
    queryFn: async () => {
      if (!client || !appId) throw new Error('Missing client or appId')
      return client.oauthManagement.adminGetAppDetail(appId)
    },
    enabled: !!client && !!appId && options?.enabled !== false,
    staleTime: 30 * 1000,
  })
}

export function useAdminOAuthScopes(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery<ListScopesResponse>({
    queryKey: ['oauth', 'admin', 'scopes'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.oauthManagement.adminListScopes()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}

// =====================================================
// Admin Mutation Hooks
// =====================================================

export function useAdminApproveAppMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { app_id: string; allowed_scopes: string[]; trust_level?: 'active' | 'trusted' }>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ success: boolean }, Error, { app_id: string; allowed_scopes: string[]; trust_level?: 'active' | 'trusted' }>({
    mutationFn: async ({ app_id, allowed_scopes, trust_level }) => {
      if (!client) throw new Error('Missing client')
      return client.oauthManagement.adminApproveApp(app_id, { allowed_scopes, trust_level })
    },
    ...options,
  })
}

export function useAdminRejectAppMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { app_id: string; reason?: string }>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ success: boolean }, Error, { app_id: string; reason?: string }>({
    mutationFn: async ({ app_id, reason }) => {
      if (!client) throw new Error('Missing client')
      return client.oauthManagement.adminRejectApp(app_id, reason)
    },
    ...options,
  })
}

export function useAdminSuspendAppMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { app_id: string }>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ success: boolean }, Error, { app_id: string }>({
    mutationFn: async ({ app_id }) => {
      if (!client) throw new Error('Missing client')
      return client.oauthManagement.adminSuspendApp(app_id)
    },
    ...options,
  })
}
