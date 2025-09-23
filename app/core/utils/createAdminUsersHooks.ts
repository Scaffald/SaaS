import type { RouterInputs } from '@app/api'

type AdminUsersInputs = RouterInputs['admin']['users']

type OptionalOrg<T extends { organizationId?: string | null }> = Omit<T, 'organizationId'> & {
  organizationId?: string | null
}

export const mergeOrganizationId = <T extends { organizationId?: string | null }>(
  organizationId: string | null | undefined,
  input: OptionalOrg<T>
) =>
  ({
    ...input,
    organizationId: organizationId ?? input.organizationId,
  }) as T

type MutationResultLike = {
  mutate: (...args: unknown[]) => unknown
  mutateAsync: (...args: unknown[]) => Promise<unknown>
}

type MutationWithOptionalOrg<
  TMutationResult extends MutationResultLike,
  TInput extends { organizationId?: string | null },
> = Omit<TMutationResult, 'mutate' | 'mutateAsync'> & {
  mutate: (
    input: OptionalOrg<TInput>,
    opts?: Parameters<TMutationResult['mutate']>[1]
  ) => ReturnType<TMutationResult['mutate']>
  mutateAsync: (
    input: OptionalOrg<TInput>,
    opts?: Parameters<TMutationResult['mutateAsync']>[1]
  ) => ReturnType<TMutationResult['mutateAsync']>
}

export const createAdminUsersHooks =
  <
    TApi extends {
      admin: {
        users: {
          search: { useQuery: (...args: unknown[]) => unknown }
          detail: { useQuery: (...args: unknown[]) => unknown }
          update: { useMutation: (...args: unknown[]) => MutationResultLike }
          verify: { useMutation: (...args: unknown[]) => MutationResultLike }
          revoke: { useMutation: (...args: unknown[]) => MutationResultLike }
        }
      }
    },
  >(
    api: TApi
  ) =>
  (organizationId?: string | null) => {
    const applyOrg = <T extends { organizationId?: string | null }>(input: OptionalOrg<T>) =>
      mergeOrganizationId<T>(organizationId ?? undefined, input)

    type AdminUsersApi = TApi['admin']['users']
    type UpdateResult = AdminUsersApi['update']['useMutation'] extends (
      ...args: unknown[]
    ) => infer R
      ? R extends MutationResultLike
        ? R
        : never
      : never
    type VerifyResult = AdminUsersApi['verify']['useMutation'] extends (
      ...args: unknown[]
    ) => infer R
      ? R extends MutationResultLike
        ? R
        : never
      : never
    type RevokeResult = AdminUsersApi['revoke']['useMutation'] extends (
      ...args: unknown[]
    ) => infer R
      ? R extends MutationResultLike
        ? R
        : never
      : never

    return {
      useSearch: (
        input: OptionalOrg<AdminUsersInputs['search']>,
        options?: Parameters<AdminUsersApi['search']['useQuery']>[1]
      ) => api.admin.users.search.useQuery(applyOrg(input), options),
      useDetail: (
        input: OptionalOrg<AdminUsersInputs['detail']>,
        options?: Parameters<AdminUsersApi['detail']['useQuery']>[1]
      ) => api.admin.users.detail.useQuery(applyOrg(input), options),
      useUpdate: (options?: Parameters<AdminUsersApi['update']['useMutation']>[0]) => {
        const mutation = api.admin.users.update.useMutation(options)
        const result: MutationWithOptionalOrg<UpdateResult, AdminUsersInputs['update']> = {
          ...mutation,
          mutate: (
            input: OptionalOrg<AdminUsersInputs['update']>,
            opts?: Parameters<UpdateResult['mutate']>[1]
          ) => mutation.mutate(applyOrg(input), opts),
          mutateAsync: (
            input: OptionalOrg<AdminUsersInputs['update']>,
            opts?: Parameters<UpdateResult['mutateAsync']>[1]
          ) => mutation.mutateAsync(applyOrg(input), opts),
        }
        return result
      },
      useVerify: (options?: Parameters<AdminUsersApi['verify']['useMutation']>[0]) => {
        const mutation = api.admin.users.verify.useMutation(options)
        const result: MutationWithOptionalOrg<VerifyResult, AdminUsersInputs['verify']> = {
          ...mutation,
          mutate: (
            input: OptionalOrg<AdminUsersInputs['verify']>,
            opts?: Parameters<VerifyResult['mutate']>[1]
          ) => mutation.mutate(applyOrg(input), opts),
          mutateAsync: (
            input: OptionalOrg<AdminUsersInputs['verify']>,
            opts?: Parameters<VerifyResult['mutateAsync']>[1]
          ) => mutation.mutateAsync(applyOrg(input), opts),
        }
        return result
      },
      useRevoke: (options?: Parameters<AdminUsersApi['revoke']['useMutation']>[0]) => {
        const mutation = api.admin.users.revoke.useMutation(options)
        const result: MutationWithOptionalOrg<RevokeResult, AdminUsersInputs['revoke']> = {
          ...mutation,
          mutate: (
            input: OptionalOrg<AdminUsersInputs['revoke']>,
            opts?: Parameters<RevokeResult['mutate']>[1]
          ) => mutation.mutate(applyOrg(input), opts),
          mutateAsync: (
            input: OptionalOrg<AdminUsersInputs['revoke']>,
            opts?: Parameters<RevokeResult['mutateAsync']>[1]
          ) => mutation.mutateAsync(applyOrg(input), opts),
        }
        return result
      },
    }
  }
