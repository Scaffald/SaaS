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
  defaultValue: SupabaseRpcReturn<TDatabase> = { data: null, error: null } as SupabaseRpcReturn<TDatabase>
): SupabaseRpcMock<TDatabase> => {
  if (implementation) {
    return vi.fn(implementation) as SupabaseRpcMock<TDatabase>
  }

  const mock = vi.fn<Parameters<SupabaseRpc<TDatabase>>, ReturnType<SupabaseRpc<TDatabase>>>(async () => {
    return defaultValue
  }) as SupabaseRpcMock<TDatabase>

  return mock
}

export type SupabaseClientStub<TDatabase> = {
  client: SupabaseClient<TDatabase>
  rpc: SupabaseRpcMock<TDatabase>
}

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
