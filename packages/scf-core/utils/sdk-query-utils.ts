/**
 * Factory utilities for scf-core SDK hooks.
 *
 * These helpers eliminate the repeated null-check + enabled-guard boilerplate
 * that appears in every query and mutation hook across the 56 sdk-hooks files.
 *
 * @example Query hook (new hooks):
 * ```ts
 * export function useConnections(options?: { enabled?: boolean }) {
 *   const client = useScaffaldJobsClient()
 *   return useQuery(makeSdkQueryOptions(client, ['connections', 'list'],
 *     (c) => c.connections.list(), { staleTime: 2 * 60 * 1000, ...options }))
 * }
 * ```
 *
 * @example Mutation hook (new hooks):
 * ```ts
 * export function useAcceptConnectionMutation(options?: UseMutationOptions<Connection, Error, string>) {
 *   const client = useScaffaldJobsClient()
 *   return useMutation({ mutationFn: makeSdkMutationFn(client, (c, id) => c.connections.accept(id)), ...options })
 * }
 * ```
 */

import type { UseQueryOptions } from '@tanstack/react-query'
import type { Scaffald } from '@scaffald/sdk'

/**
 * Builds UseQueryOptions with the standard null-check and enabled guard.
 *
 * The returned options object can be spread directly into useQuery().
 */
export function makeSdkQueryOptions<T>(
  client: Scaffald | null,
  queryKey: unknown[],
  fn: (c: Scaffald) => Promise<T>,
  opts?: { staleTime?: number; enabled?: boolean }
): UseQueryOptions<T> {
  return {
    queryKey,
    queryFn: async () => {
      if (!client) throw new Error('Missing Scaffald client')
      return fn(client)
    },
    enabled: !!client && opts?.enabled !== false,
    ...(opts?.staleTime !== undefined && { staleTime: opts.staleTime }),
  }
}

/**
 * Builds a mutation function that throws if the client is missing.
 *
 * The returned function can be used as the `mutationFn` in useMutation().
 */
export function makeSdkMutationFn<TData, TVariables>(
  client: Scaffald | null,
  fn: (c: Scaffald, vars: TVariables) => Promise<TData>
): (vars: TVariables) => Promise<TData> {
  return async (vars: TVariables) => {
    if (!client) throw new Error('Missing Scaffald client')
    return fn(client, vars)
  }
}
