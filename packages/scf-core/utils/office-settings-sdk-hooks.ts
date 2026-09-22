/**
 * Office Settings SDK Hooks
 * Platform settings held in `core.system_config`. Requires office/platform role.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type { GeographicSettings } from '@scaffald/sdk'

export type { GeographicSettings } from '@scaffald/sdk'

const GEOGRAPHIC_KEY = ['office', 'settings', 'geographic'] as const

/** Read the site-overlap threshold. */
export function useGeographicSettings(options?: { enabled?: boolean; staleTime?: number }) {
  const client = useScaffaldJobsClient()
  return useQuery<GeographicSettings>({
    queryKey: GEOGRAPHIC_KEY,
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.officeSettings.getGeographic()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: options?.staleTime ?? 60_000,
  })
}

/** Save the site-overlap threshold. */
export function useUpdateGeographicSettings(options?: {
  onSuccess?: (data: GeographicSettings) => void
  onError?: (error: Error) => void
}) {
  const client = useScaffaldJobsClient()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (params: Pick<GeographicSettings, 'siteOverlapThresholdPercent'>) => {
      if (!client) throw new Error('Missing client')
      return client.officeSettings.updateGeographic(params)
    },
    onSuccess: (data) => {
      queryClient.setQueryData(GEOGRAPHIC_KEY, data)
      options?.onSuccess?.(data)
    },
    onError: options?.onError,
  })
}
