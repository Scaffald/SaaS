/**
 * Connections SDK hooks. Use these instead of api.connections.* when migrating to REST/SDK.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  Connection,
  SendConnectionRequestParams,
} from '@scaffald/sdk/resources/connections'

// ============================================================================
// QUERY HOOKS
// ============================================================================

/** Get all accepted connections for the current user */
export function useConnections(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['connections', 'list'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.connections.list()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 2 * 60 * 1000,
  })
}

/** Get pending connection requests (sent and received) */
export function usePendingConnections(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['connections', 'pending'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.connections.getPending()
    },
    enabled: !!client && (options?.enabled !== false),
    staleTime: 1 * 60 * 1000, // 1 minute - more frequent since these are real-time
  })
}

/** Get connection status with a specific user */
export function useConnectionStatus(userId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['connections', 'status', userId],
    queryFn: async () => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.connections.getStatus(userId)
    },
    enabled: !!client && !!userId && (options?.enabled !== false),
    staleTime: 1 * 60 * 1000,
  })
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/** Send a connection request to another user */
export function useSendConnectionMutation(
  options?: UseMutationOptions<Connection, Error, SendConnectionRequestParams>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (params: SendConnectionRequestParams) => {
      if (!client) throw new Error('Missing client')
      return client.connections.send(params)
    },
    ...options,
  })
}

/** Accept a connection request */
export function useAcceptConnectionMutation(
  options?: UseMutationOptions<Connection, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!client) throw new Error('Missing client')
      return client.connections.accept(connectionId)
    },
    ...options,
  })
}

/** Decline a connection request */
export function useDeclineConnectionMutation(options?: UseMutationOptions<void, Error, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!client) throw new Error('Missing client')
      return client.connections.decline(connectionId)
    },
    ...options,
  })
}

/** Remove an existing connection */
export function useRemoveConnectionMutation(options?: UseMutationOptions<void, Error, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!client) throw new Error('Missing client')
      return client.connections.remove(connectionId)
    },
    ...options,
  })
}

/** Cancel a sent connection request */
export function useCancelConnectionMutation(options?: UseMutationOptions<void, Error, string>) {
  const client = useScaffaldJobsClient()
  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!client) throw new Error('Missing client')
      return client.connections.cancel(connectionId)
    },
    ...options,
  })
}
