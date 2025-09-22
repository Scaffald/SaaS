import type { AppRouter, RouterInputs } from '@app/api'
import { httpBatchLink } from '@trpc/client'
import { createTRPCNext } from '@trpc/next'
import SuperJSON from 'superjson'

import { getBaseUrl } from './getBaseUrl'

export const api = createTRPCNext<AppRouter>({
  /**
   * @link https://trpc.io/docs/ssr
   **/
  ssr: false,
  transformer: SuperJSON,
  config() {
    return {
      queryClientConfig: {
        // web query config
      },
      links: [
        httpBatchLink({
          transformer: SuperJSON,
          /**
           * If you want to use SSR, you need to use the server's full URL
           * @link https://trpc.io/docs/ssr
           **/
          url: `${getBaseUrl()}/api/trpc`,

          // You can pass any HTTP headers you wish here
          async headers() {
            return {}
          },
        }),
      ],
    }
  },
})

type AdminUsersInputs = RouterInputs['admin']['users']

type OptionalOrg<T extends { organizationId?: string | null }> = Omit<T, 'organizationId'> & {
  organizationId?: string | null
}

const mergeOrganizationId = <T extends { organizationId?: string | null }>(
  organizationId: string | null | undefined,
  input: OptionalOrg<T>,
) =>
  ({
    ...input,
    organizationId: organizationId ?? input.organizationId,
  }) as T

export const createAdminUsersHooks = (organizationId?: string | null) => {
  const applyOrg = <T extends { organizationId?: string | null }>(input: OptionalOrg<T>) =>
    mergeOrganizationId<T>(organizationId ?? undefined, input)

  return {
    useSearch: (
      input: OptionalOrg<AdminUsersInputs['search']>,
      options?: Parameters<typeof api.admin.users.search.useQuery>[1],
    ) => api.admin.users.search.useQuery(applyOrg(input), options),
    useDetail: (
      input: OptionalOrg<AdminUsersInputs['detail']>,
      options?: Parameters<typeof api.admin.users.detail.useQuery>[1],
    ) => api.admin.users.detail.useQuery(applyOrg(input), options),
    useUpdate: (
      options?: Parameters<typeof api.admin.users.update.useMutation>[0],
    ) => {
      const mutation = api.admin.users.update.useMutation(options)
      return {
        ...mutation,
        mutate: (
          input: OptionalOrg<AdminUsersInputs['update']>,
          opts?: Parameters<typeof mutation.mutate>[1],
        ) => mutation.mutate(applyOrg(input), opts),
        mutateAsync: (
          input: OptionalOrg<AdminUsersInputs['update']>,
          opts?: Parameters<typeof mutation.mutateAsync>[1],
        ) => mutation.mutateAsync(applyOrg(input), opts),
      }
    },
    useVerify: (
      options?: Parameters<typeof api.admin.users.verify.useMutation>[0],
    ) => {
      const mutation = api.admin.users.verify.useMutation(options)
      return {
        ...mutation,
        mutate: (
          input: OptionalOrg<AdminUsersInputs['verify']>,
          opts?: Parameters<typeof mutation.mutate>[1],
        ) => mutation.mutate(applyOrg(input), opts),
        mutateAsync: (
          input: OptionalOrg<AdminUsersInputs['verify']>,
          opts?: Parameters<typeof mutation.mutateAsync>[1],
        ) => mutation.mutateAsync(applyOrg(input), opts),
      }
    },
    useRevoke: (
      options?: Parameters<typeof api.admin.users.revoke.useMutation>[0],
    ) => {
      const mutation = api.admin.users.revoke.useMutation(options)
      return {
        ...mutation,
        mutate: (
          input: OptionalOrg<AdminUsersInputs['revoke']>,
          opts?: Parameters<typeof mutation.mutate>[1],
        ) => mutation.mutate(applyOrg(input), opts),
        mutateAsync: (
          input: OptionalOrg<AdminUsersInputs['revoke']>,
          opts?: Parameters<typeof mutation.mutateAsync>[1],
        ) => mutation.mutateAsync(applyOrg(input), opts),
      }
    },
  }
}

export { type RouterInputs, type RouterOutputs } from '@app/api'
