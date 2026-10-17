import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useScaffaldJobsClient } from '@scf/core/utils/jobs-sdk-context'
import { toATSApplication } from '../transform'
import { computeTransparencyStats } from '../transparency-stats'
import { fetchAllPages, transparencyWindowStart } from '../transparency-source'

/**
 * The employer's transparency figures over their whole pipeline — every
 * application to their jobs in the last 12 months, regardless of the board's
 * filters or paging (#1177). A query of its own rather than the board's, so
 * filtering the board cannot move these numbers.
 *
 * Keyed under ['applications', …] so the board's status-change invalidation
 * refreshes it too: moving a candidate is exactly what changes a ghost rate.
 */
export function useTransparencyStats() {
  const client = useScaffaldJobsClient()
  const dateFrom = transparencyWindowStart()

  const query = useQuery({
    queryKey: ['applications', 'employer-transparency', dateFrom],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return fetchAllPages((offset, limit) =>
        client.applications.listForOrganization({ date_from: dateFrom, offset, limit })
      )
    },
    enabled: !!client,
    staleTime: 60 * 1000,
  })

  const stats = useMemo(
    () => (query.data ? computeTransparencyStats(query.data.rows.map(toATSApplication)) : null),
    [query.data]
  )

  return {
    stats,
    /** Applications the figures cover. */
    count: query.data?.rows.length ?? 0,
    truncated: query.data?.truncated ?? false,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}
