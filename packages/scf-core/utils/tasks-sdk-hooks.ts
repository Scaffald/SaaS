/**
 * Tasks + Punchlists SDK hooks
 *
 * React Query bindings for the Tasks and Punchlists API surface. Mirrors
 * the work-logs hook conventions so the UI layer feels consistent.
 *
 * Always spread `options` into the mutation so callers can attach their own
 * onSuccess / onError without being clobbered by the hook defaults.
 */

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type {
  CompleteTaskParams,
  CreatePunchlistParams,
  CreateTaskParams,
  ListPunchlistsParams,
  ListTasksParams,
  Punchlist,
  PunchlistsListResponse,
  Task,
  TasksListResponse,
  UpdatePunchlistParams,
  UpdateTaskParams,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from '@scf/core/provider'

// ===========================
// Tasks
// ===========================

export function useTasks(
  params?: ListTasksParams,
  options?: Omit<UseQueryOptions<TasksListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const client = useScaffaldJobsClient()
  return useQuery<TasksListResponse, Error>({
    queryKey: ['tasks', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.tasks.list(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

export function useTask(
  taskId: string | undefined,
  options?: Omit<UseQueryOptions<Task, Error>, 'queryKey' | 'queryFn'>,
) {
  const client = useScaffaldJobsClient()
  return useQuery<Task, Error>({
    queryKey: ['tasks', 'byId', taskId],
    queryFn: async () => {
      if (!client) throw new Error('Missing Scaffald client')
      if (!taskId) throw new Error('taskId required')
      return client.tasks.getById(taskId)
    },
    enabled: !!client && !!taskId && (options?.enabled ?? true),
    ...options,
  })
}

export function useCreateTaskMutation(
  options?: UseMutationOptions<Task, Error, CreateTaskParams>,
) {
  const client = useScaffaldJobsClient()
  return useMutation<Task, Error, CreateTaskParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.tasks.create(params)
    },
    ...options,
  })
}

export function useUpdateTaskMutation(
  options?: UseMutationOptions<Task, Error, UpdateTaskParams>,
) {
  const client = useScaffaldJobsClient()
  return useMutation<Task, Error, UpdateTaskParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.tasks.update(params)
    },
    ...options,
  })
}

export function useCompleteTaskMutation(
  options?: UseMutationOptions<Task, Error, CompleteTaskParams>,
) {
  const client = useScaffaldJobsClient()
  return useMutation<Task, Error, CompleteTaskParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.tasks.complete(params)
    },
    ...options,
  })
}

export function useDeleteTaskMutation(
  options?: UseMutationOptions<void, Error, string>,
) {
  const client = useScaffaldJobsClient()
  return useMutation<void, Error, string>({
    mutationFn: async (taskId) => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.tasks.delete(taskId)
    },
    ...options,
  })
}

// ===========================
// Punchlists
// ===========================

export function usePunchlists(
  params?: ListPunchlistsParams,
  options?: Omit<UseQueryOptions<PunchlistsListResponse, Error>, 'queryKey' | 'queryFn'>,
) {
  const client = useScaffaldJobsClient()
  return useQuery<PunchlistsListResponse, Error>({
    queryKey: ['punchlists', 'list', params],
    queryFn: async () => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.punchlists.list(params)
    },
    enabled: !!client && (options?.enabled ?? true),
    ...options,
  })
}

export function usePunchlist(
  punchlistId: string | undefined,
  options?: Omit<UseQueryOptions<Punchlist, Error>, 'queryKey' | 'queryFn'>,
) {
  const client = useScaffaldJobsClient()
  return useQuery<Punchlist, Error>({
    queryKey: ['punchlists', 'byId', punchlistId],
    queryFn: async () => {
      if (!client) throw new Error('Missing Scaffald client')
      if (!punchlistId) throw new Error('punchlistId required')
      return client.punchlists.getById(punchlistId)
    },
    enabled: !!client && !!punchlistId && (options?.enabled ?? true),
    ...options,
  })
}

export function useCreatePunchlistMutation(
  options?: UseMutationOptions<Punchlist, Error, CreatePunchlistParams>,
) {
  const client = useScaffaldJobsClient()
  return useMutation<Punchlist, Error, CreatePunchlistParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.punchlists.create(params)
    },
    ...options,
  })
}

export function useUpdatePunchlistMutation(
  options?: UseMutationOptions<Punchlist, Error, UpdatePunchlistParams>,
) {
  const client = useScaffaldJobsClient()
  return useMutation<Punchlist, Error, UpdatePunchlistParams>({
    mutationFn: async (params) => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.punchlists.update(params)
    },
    ...options,
  })
}

export function useDeletePunchlistMutation(
  options?: UseMutationOptions<void, Error, string>,
) {
  const client = useScaffaldJobsClient()
  return useMutation<void, Error, string>({
    mutationFn: async (punchlistId) => {
      if (!client) throw new Error('Missing Scaffald client')
      return client.punchlists.delete(punchlistId)
    },
    ...options,
  })
}
