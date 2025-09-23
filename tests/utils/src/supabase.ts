import type { PostgrestError, PostgrestSingleResponse, SupabaseClient } from '@supabase/supabase-js'
import { vi, type Mock } from 'vitest'

type SupabaseRpcMethod<TDatabase> = SupabaseClient<TDatabase>['rpc']
type SupabaseRpcArgs<TDatabase> = Parameters<SupabaseRpcMethod<TDatabase>>
type SupabaseRpcResult<TDatabase> = Awaited<ReturnType<SupabaseRpcMethod<TDatabase>>>
type SupabaseRpc<TDatabase> = (...args: SupabaseRpcArgs<TDatabase>) => Promise<SupabaseRpcResult<TDatabase>>

type SupabaseRpcImplementation<TDatabase> = (
  ...args: SupabaseRpcArgs<TDatabase>
) => Promise<SupabaseRpcResult<TDatabase>>

type SupabaseClientOverrides<TDatabase> = {
  [K in keyof SupabaseClient<TDatabase>]?: SupabaseClient<TDatabase>[K]
}

export type SupabaseRpcMock<TDatabase> = Mock<SupabaseRpc<TDatabase>>

export const createSupabaseRpcMock = <TDatabase>(
  implementation?: SupabaseRpc<TDatabase>,
  defaultValue: SupabaseRpcResult<TDatabase> = {
    data: null,
    error: null,
  } as SupabaseRpcResult<TDatabase>
): SupabaseRpcMock<TDatabase> => {
  if (implementation) {
    return vi.fn(implementation)
  }

  return vi.fn<SupabaseRpc<TDatabase>>(async (..._args: SupabaseRpcArgs<TDatabase>) => {
    return defaultValue
  })
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
    rpc: resolvedRpc as unknown as SupabaseRpcMethod<TDatabase>,
  } as unknown as SupabaseClient<TDatabase>

  return {
    client,
    rpc: resolvedRpc,
  }
}

export const createPostgrestError = (
  overrides: Partial<PostgrestError> & Pick<PostgrestError, 'message'>
): PostgrestError => ({
  details: '',
  hint: '',
  code: 'PGRST_ERROR',
  name: 'PostgrestError',
  ...overrides,
})

export const createPostgrestSingleResponse = <T>(
  overrides: Partial<PostgrestSingleResponse<T>> = {}
): PostgrestSingleResponse<T> => ({
  data: null,
  error: null,
  count: null,
  status: 200,
  statusText: 'OK',
  ...overrides,
} as PostgrestSingleResponse<T>)
