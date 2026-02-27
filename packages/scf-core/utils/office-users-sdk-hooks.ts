/**
 * Office Users SDK hooks. Use these instead of api.office.listUsers/deleteUser/updateUser/etc.
 * Requires ScaffaldJobsSdkProviderFromSession (client from context).
 */

import { useMutation, useQuery, type UseMutationOptions } from '@tanstack/react-query'
import { useScaffaldJobsClient } from './jobs-sdk-context'
import type {
  OfficeUpdateUserParams,
  OfficeUpdateUserGeneralParams,
  OfficeUpdateUserEmploymentParams,
} from '@scaffald/sdk'

/** List all users (office role) */
export function useOfficeListUsers(options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['office', 'users'],
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.officeUsers.list()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

/** Delete a user (office role) */
export function useOfficeDeleteUserMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, string>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ success: boolean }, Error, string>({
    mutationFn: async (id: string) => {
      if (!client) throw new Error('Missing client')
      return client.officeUsers.delete(id)
    },
    ...options,
  })
}

/** Update a user (office role) */
export function useOfficeUpdateUserMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { id: string; params: OfficeUpdateUserParams }>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ success: boolean }, Error, { id: string; params: OfficeUpdateUserParams }>({
    mutationFn: async ({ id, params }) => {
      if (!client) throw new Error('Missing client')
      return client.officeUsers.update(id, params)
    },
    ...options,
  })
}

/** Get user general profile (office role) */
export function useOfficeUserGeneral(userId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['office', 'user', userId, 'general'],
    queryFn: async () => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.officeUsers.getUserGeneral(userId)
    },
    enabled: !!client && !!userId && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

/** Update user general profile (office role) */
export function useOfficeUpdateUserGeneralMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { userId: string; data: OfficeUpdateUserGeneralParams }>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ success: boolean }, Error, { userId: string; data: OfficeUpdateUserGeneralParams }>({
    mutationFn: async ({ userId, data }) => {
      if (!client) throw new Error('Missing client')
      return client.officeUsers.updateUserGeneral(userId, data)
    },
    ...options,
  })
}

/** Get user employment data (office role) */
export function useOfficeUserEmployment(userId: string | undefined, options?: { enabled?: boolean }) {
  const client = useScaffaldJobsClient()
  return useQuery({
    queryKey: ['office', 'user', userId, 'employment'],
    queryFn: async () => {
      if (!client || !userId) throw new Error('Missing client or userId')
      return client.officeUsers.getUserEmployment(userId)
    },
    enabled: !!client && !!userId && options?.enabled !== false,
    staleTime: 60 * 1000,
  })
}

/** Update user employment data (office role) */
export function useOfficeUpdateUserEmploymentMutation(
  options?: UseMutationOptions<{ success: boolean }, Error, { userId: string; data: OfficeUpdateUserEmploymentParams }>
) {
  const client = useScaffaldJobsClient()
  return useMutation<{ success: boolean }, Error, { userId: string; data: OfficeUpdateUserEmploymentParams }>({
    mutationFn: async ({ userId, data }) => {
      if (!client) throw new Error('Missing client')
      return client.officeUsers.updateUserEmployment(userId, data)
    },
    ...options,
  })
}
