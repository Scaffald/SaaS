import type { SupabaseClient } from '@supabase/supabase-js'
import { vi, type MockInstance } from 'vitest'

type SupabaseRpc<TDatabase> = SupabaseClient<TDatabase>['rpc']

type SupabaseRpcReturn<TDatabase> = Awaited<ReturnType<SupabaseRpc<TDatabase>>>

type SupabaseClientOverrides<TDatabase> = {
  [K in keyof SupabaseClient<TDatabase>]?: SupabaseClient<TDatabase>[K]
}

export type SupabaseRpcMock<TDatabase> = MockInstance<SupabaseRpc<TDatabase>>

export const createSupabaseRpcMock = <TDatabase>(
  implementation?: SupabaseRpc<TDatabase>,
  defaultValue: SupabaseRpcReturn<TDatabase> = {
    data: null,
    error: null,
  } as SupabaseRpcReturn<TDatabase>
): SupabaseRpcMock<TDatabase> => {
  if (implementation) {
    return vi.fn(implementation) as SupabaseRpcMock<TDatabase>
  }

  const fallbackImplementation = (
    ..._args: Parameters<SupabaseRpc<TDatabase>>
  ): ReturnType<SupabaseRpc<TDatabase>> =>
    Promise.resolve(defaultValue) as unknown as ReturnType<SupabaseRpc<TDatabase>>

  return vi.fn(fallbackImplementation as SupabaseRpc<TDatabase>) as SupabaseRpcMock<TDatabase>
}

export type SupabaseClientStub<TDatabase> = {
  client: SupabaseClient<TDatabase>
  rpc: SupabaseRpcMock<TDatabase>
}

/**
 * Creates a Supabase client stub with an overridable surface.
 *
 * Pass overrides for any client method (for example `.from()` or `auth`) to
 * return custom query builders while keeping the RPC spy wired up for
 * `mockResolvedValueOnce` chaining.
 */
export const createSupabaseClientStub = <TDatabase>(
  overrides: SupabaseClientOverrides<TDatabase> & {
    rpc?: SupabaseRpc<TDatabase>
  } = {}
): SupabaseClientStub<TDatabase> => {
  const { rpc, ...rest } = overrides
  const resolvedRpc =
    (rpc as SupabaseRpcMock<TDatabase> | undefined) ?? createSupabaseRpcMock<TDatabase>()

  const client = {
    ...rest,
    rpc: resolvedRpc as unknown as SupabaseRpc<TDatabase>,
  } as SupabaseClient<TDatabase>

  return {
    client,
    rpc: resolvedRpc,
  }
}
