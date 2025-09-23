import type { SupabaseClient } from '@supabase/supabase-js'
import { vi, type MockInstance } from 'vitest'

type SupabaseRpc<TDatabase> = SupabaseClient<TDatabase>['rpc']

type SupabaseRpcParameters<TDatabase> = Parameters<SupabaseRpc<TDatabase>>

type SupabaseRpcReturn<TDatabase> = Awaited<ReturnType<SupabaseRpc<TDatabase>>>

type SupabaseRpcImplementation<TDatabase> = (
  ...args: SupabaseRpcParameters<TDatabase>
) =>
  | ReturnType<SupabaseRpc<TDatabase>>
  | SupabaseRpcReturn<TDatabase>
  | Promise<SupabaseRpcReturn<TDatabase>>

type SupabaseClientOverrides<TDatabase> = {
  [K in keyof SupabaseClient<TDatabase>]?: SupabaseClient<TDatabase>[K]
}

export type SupabaseRpcMock<TDatabase> = MockInstance<SupabaseRpcImplementation<TDatabase>>

export const createSupabaseRpcMock = <TDatabase>(
  implementation?: SupabaseRpcImplementation<TDatabase>,
  defaultValue: SupabaseRpcReturn<TDatabase> = {
    data: null,
    error: null,
  } as SupabaseRpcReturn<TDatabase>
): SupabaseRpcMock<TDatabase> => {
  if (implementation) {
    return vi.fn(implementation) as SupabaseRpcMock<TDatabase>
  }

  return vi.fn<SupabaseRpcImplementation<TDatabase>>(async () => defaultValue)
}

export type SupabaseClientStub<TDatabase> = {
  client: SupabaseClient<TDatabase>
  rpc: SupabaseRpcMock<TDatabase>
}

export const createSupabaseClientStub = <TDatabase>(
  overrides: SupabaseClientOverrides<TDatabase> & {
    rpc?: SupabaseRpcImplementation<TDatabase>
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
