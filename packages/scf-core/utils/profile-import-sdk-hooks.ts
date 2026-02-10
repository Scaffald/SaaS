/**
 * Profile Import SDK Hooks
 * React Query hooks for profile data import from various sources
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldClient } from '../hooks/use-scaffald-client'
import type {
  ClearImportDataResponse,
  SaveImportDataParams,
  SaveImportDataResponse,
} from '@scaffald/sdk'

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Get saved import data (TTL: 24 hours)
 */
export function useImportData() {
  const client = useScaffaldClient()

  return useQuery({
    queryKey: ['scaffald', 'profiles', 'import', 'data'],
    queryFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.profileImport.getImportData()
    },
    enabled: !!client,
  })
}

// ============================================================================
// Mutation Hooks
// ============================================================================

/**
 * Save import data for review (expires after 24 hours)
 */
export function useSaveImportDataMutation(
  options?: UseMutationOptions<SaveImportDataResponse, Error, SaveImportDataParams>
) {
  const client = useScaffaldClient()

  return useMutation({
    mutationFn: async (params: SaveImportDataParams) => {
      if (!client) throw new Error('Scaffald client not available')
      return client.profileImport.saveImportData(params)
    },
    ...options,
  })
}

/**
 * Clear saved import data
 */
export function useClearImportDataMutation(
  options?: UseMutationOptions<ClearImportDataResponse, Error, void>
) {
  const client = useScaffaldClient()

  return useMutation({
    mutationFn: async () => {
      if (!client) throw new Error('Scaffald client not available')
      return client.profileImport.clearImportData()
    },
    ...options,
  })
}
