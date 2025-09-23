import type { AppRouter, RouterInputs } from '@app/api'
import { httpBatchLink } from '@trpc/client'
import { createTRPCReact } from '@trpc/react-query'
import SuperJSON from 'superjson'

import { getBaseUrl } from './getBaseUrl'
import { supabase } from './supabase/client.native'

export const api = createTRPCReact<AppRouter>()
export const createTrpcClient = () =>
  api.createClient({
    links: [
      httpBatchLink({
        url: `${getBaseUrl()}/api/trpc`,
        transformer: SuperJSON,
        async headers() {
          const headers = new Map<string, string>()
          headers.set('x-trpc-source', 'expo-react')
          const session = (await supabase.auth.getSession()).data.session

          // Manually add the auth name as the backend uses cookies to authenticate users
          // This allows mobile to authenticate via Supabase
          if (session?.access_token) {
            headers.set('Authorization', `Bearer ${session.access_token}`)
          }
          return Object.fromEntries(headers)
        },
      }),
    ],
  })

type AdminUsersInputs = RouterInputs['admin']['users']

type OptionalOrg<T extends { organizationId?: string | null }> = Omit<T, 'organizationId'> & {
  organizationId?: string | null
}

const mergeOrganizationId = <T extends { organizationId?: string | null }>(
  organizationId: string | null | undefined,
  input: OptionalOrg<T>
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
      options?: Parameters<typeof api.admin.users.search.useQuery>[1]
    ) => api.admin.users.search.useQuery(applyOrg(input), options),
    useDetail: (
      input: OptionalOrg<AdminUsersInputs['detail']>,
      options?: Parameters<typeof api.admin.users.detail.useQuery>[1]
    ) => api.admin.users.detail.useQuery(applyOrg(input), options),
    useUpdate: (options?: Parameters<typeof api.admin.users.update.useMutation>[0]) => {
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
    useVerify: (options?: Parameters<typeof api.admin.users.verify.useMutation>[0]) => {
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
    useRevoke: (options?: Parameters<typeof api.admin.users.revoke.useMutation>[0]) => {
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

export { type RouterInputs, type RouterOutputs } from '@app/api'
