/**
 * Compliance SDK hooks.
 *
 * The EEO report is aggregate-only: the API never returns an individual
 * self-identification, so there is no "get one" hook here and there should
 * not be one. See packages/supabase/functions/api/routes/employer-eeo.ts.
 */
import { useQuery } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type { EEOReport, GetEEOReportParams } from '@scaffald/sdk'

/** Aggregate EEO report for the organisations the caller can act for. */
export function useEEOReport(params?: GetEEOReportParams, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery<EEOReport>({
    queryKey: ['compliance', 'eeo-report', params ?? null],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.compliance.getEEOReport(params)
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 5 * 60 * 1000,
  })
}
