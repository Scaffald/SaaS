import { useMutation, useQuery, type UseMutationOptions, type UseQueryOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  CCPADataSummaryResponse,
  CCPAMyRequestsResponse,
  CCPAOptOutsResponse,
  CCPASubmitRequestParams,
  CCPASubmitRequestResponse,
  CCPASetOptOutParams,
  CCPASetOptOutResponse,
  CCPAComplianceMetrics,
  CCPAAdminRequestsParams,
  CCPAAdminRequestsResponse,
  CCPAProcessRequestResponse,
} from '@scaffald/sdk'

// ===== User Hooks =====

export function useCCPADataSummary(options?: UseQueryOptions<CCPADataSummaryResponse, Error>) {
  const client = useScaffaldJobsClient()
  return useQuery<CCPADataSummaryResponse, Error>({
    queryKey: ['ccpa', 'data-summary'],
    queryFn: async () => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.ccpa.getDataSummary()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

export function useCCPAMyRequests(
  params?: { limit?: number; offset?: number; status?: string },
  options?: UseQueryOptions<CCPAMyRequestsResponse, Error>
) {
  const client = useScaffaldJobsClient()
  return useQuery<CCPAMyRequestsResponse, Error>({
    queryKey: ['ccpa', 'my-requests', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.ccpa.getMyRequests(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000,
    ...options,
  })
}

export function useCCPAConnectedApps(options?: UseQueryOptions<unknown[], Error>) {
  const client = useScaffaldJobsClient()
  return useQuery<unknown[], Error>({
    queryKey: ['ccpa', 'connected-apps'],
    queryFn: async () => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.ccpa.getConnectedApps()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

export function useCCPAMyOptOuts(options?: UseQueryOptions<CCPAOptOutsResponse, Error>) {
  const client = useScaffaldJobsClient()
  return useQuery<CCPAOptOutsResponse, Error>({
    queryKey: ['ccpa', 'my-opt-outs'],
    queryFn: async () => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.ccpa.getMyOptOuts()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000,
    ...options,
  })
}

export function useCCPASetOptOutMutation(
  options?: UseMutationOptions<CCPASetOptOutResponse, Error, CCPASetOptOutParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation<CCPASetOptOutResponse, Error, CCPASetOptOutParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.ccpa.setOptOut(params)
    },
    ...options,
  })
}

export function useCCPASubmitRequestMutation(
  options?: UseMutationOptions<CCPASubmitRequestResponse, Error, CCPASubmitRequestParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation<CCPASubmitRequestResponse, Error, CCPASubmitRequestParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.ccpa.submitRequest(params)
    },
    ...options,
  })
}

// ===== Admin Hooks =====

export function useCCPAComplianceMetrics(options?: UseQueryOptions<CCPAComplianceMetrics, Error>) {
  const client = useScaffaldJobsClient()
  return useQuery<CCPAComplianceMetrics, Error>({
    queryKey: ['ccpa', 'compliance-metrics'],
    queryFn: async () => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.ccpa.getComplianceMetrics()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 60 * 1000,
    ...options,
  })
}

export function useCCPAAdminRequests(
  params?: CCPAAdminRequestsParams,
  options?: UseQueryOptions<CCPAAdminRequestsResponse, Error>
) {
  const client = useScaffaldJobsClient()
  return useQuery<CCPAAdminRequestsResponse, Error>({
    queryKey: ['ccpa', 'admin-requests', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.ccpa.getAdminRequests(params)
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 60 * 1000,
    ...options,
  })
}

export function useCCPAProcessRequestMutation(
  options?: UseMutationOptions<CCPAProcessRequestResponse, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation<CCPAProcessRequestResponse, Error, string>({
    mutationFn: async (requestId) => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.ccpa.processRequest(requestId)
    },
    ...options,
  })
}
