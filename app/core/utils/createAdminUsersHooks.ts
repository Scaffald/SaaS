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

export const createAdminUsersHooks = (api: any) => (organizationId?: string | null) => {
  const applyOrg = <T extends { organizationId?: string | null }>(input: OptionalOrg<T>) =>
    mergeOrganizationId<T>(organizationId ?? undefined, input)

  return {
    useSearch: (
      input: OptionalOrg<AdminUsersInputs['search']>,
      options?: Parameters<(typeof api)['admin']['users']['search']['useQuery']>[1]
    ) => api.admin.users.search.useQuery(applyOrg(input), options),
    useDetail: (
      input: OptionalOrg<AdminUsersInputs['detail']>,
      options?: Parameters<(typeof api)['admin']['users']['detail']['useQuery']>[1]
    ) => api.admin.users.detail.useQuery(applyOrg(input), options),
    useUpdate: (options?: Parameters<(typeof api)['admin']['users']['update']['useMutation']>[0]) => {
      const mutation = api.admin.users.update.useMutation(options)
      return {
        ...mutation,
        mutate: (
          input: OptionalOrg<AdminUsersInputs['update']>,
          opts?: Parameters<typeof mutation.mutate>[1]
        ) => mutation.mutate(applyOrg(input), opts),
        mutateAsync: (
          input: OptionalOrg<AdminUsersInputs['update']>,
          opts?: Parameters<typeof mutation.mutateAsync>[1]
        ) => mutation.mutateAsync(applyOrg(input), opts),
      }
    },
    useVerify: (options?: Parameters<(typeof api)['admin']['users']['verify']['useMutation']>[0]) => {
      const mutation = api.admin.users.verify.useMutation(options)
      return {
        ...mutation,
        mutate: (
          input: OptionalOrg<AdminUsersInputs['verify']>,
          opts?: Parameters<typeof mutation.mutate>[1]
        ) => mutation.mutate(applyOrg(input), opts),
        mutateAsync: (
          input: OptionalOrg<AdminUsersInputs['verify']>,
          opts?: Parameters<typeof mutation.mutateAsync>[1]
        ) => mutation.mutateAsync(applyOrg(input), opts),
      }
    },
    useRevoke: (options?: Parameters<(typeof api)['admin']['users']['revoke']['useMutation']>[0]) => {
      const mutation = api.admin.users.revoke.useMutation(options)
      return {
        ...mutation,
        mutate: (
          input: OptionalOrg<AdminUsersInputs['revoke']>,
          opts?: Parameters<typeof mutation.mutate>[1]
        ) => mutation.mutate(applyOrg(input), opts),
        mutateAsync: (
          input: OptionalOrg<AdminUsersInputs['revoke']>,
          opts?: Parameters<typeof mutation.mutateAsync>[1]
        ) => mutation.mutateAsync(applyOrg(input), opts),
      }
    },
  }
}
