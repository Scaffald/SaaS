import {
  useMutation,
  useQuery,
  type UseMutationOptions,
} from '@tanstack/react-query'
import type {
  ListViolationReportsParams,
  ListViolationReportsResponse,
  UpdateViolationReportParams,
  UpdateViolationReportResponse,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from './jobs-sdk-context'

export function useViolationReports(
  params?: ListViolationReportsParams,
  options?: { enabled?: boolean; staleTime?: number }
) {
  const client = useScaffaldJobsClient()
  return useQuery<ListViolationReportsResponse, Error>({
    queryKey: ['legal-agreements', 'violation-reports', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.legalAgreements.listViolationReports(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: options?.staleTime ?? 30 * 1000,
  })
}

export function useUpdateViolationReportMutation(
  options?: UseMutationOptions<UpdateViolationReportResponse, Error, UpdateViolationReportParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: UpdateViolationReportParams) => {
      if (!client) throw new Error('Missing client')
      return client.legalAgreements.updateViolationReport(params)
    },
    ...options,
  })
}
