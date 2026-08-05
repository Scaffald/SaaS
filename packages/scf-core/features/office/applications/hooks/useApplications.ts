import { useQueryClient } from '@tanstack/react-query'
import {
  useApplication as useApplicationSDK,
  useEmployerApplications,
  useUpdateApplicationMutation,
  useWithdrawApplicationMutation,
  useGetUploadUrlMutation,
  useConfirmUploadMutation,
} from '@scf/core/utils/applications-sdk-hooks'
import type {
  Application,
  EmployerApplication,
  UpdateApplicationParams,
  WithdrawApplicationParams,
  GetUploadUrlParams,
  GetUploadUrlResponse,
  ConfirmUploadParams,
} from '@scaffald/sdk/resources/applications'

export type { Application }

/**
 * An application as the office pipeline sees it.
 *
 * This is the SDK's `EmployerApplication` verbatim. It is deliberately not a
 * hand-maintained restatement: the previous local interface drifted from the
 * database (it declared `applied_at` and `application_score`, neither of which
 * is a column) and nothing caught it, because the hook it typed returned a
 * hardcoded empty array.
 */
export type ApplicationsListItem = EmployerApplication

export interface ApplicationsListFilters {
  status?: Application['status']
  limit?: number
  offset?: number
  organization_id?: string
  job_id?: string
  assigned_to?: string
  min_score?: number
  date_from?: string
  date_to?: string
}

/**
 * Applications to jobs posted by organizations the caller can act for.
 *
 * Was a stub returning `[]` with the filter argument discarded — a leftover
 * from the tRPC→SDK migration that left every office ATS screen rendering zero
 * rows. Now backed by `GET /v1/employer/applications`.
 */
export function useApplications(filters?: ApplicationsListFilters) {
  const query = useEmployerApplications(filters)

  return {
    applications: query.data?.data ?? [],
    total: query.data?.total ?? 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Hook to fetch a single application by ID
 */
export function useApplication(id: string) {
  const query = useApplicationSDK(id, { enabled: !!id })

  return {
    application: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}

/**
 * Hook to update application status
 */
export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient()

  const mutation = useUpdateApplicationMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })

  return {
    updateStatus: mutation.mutate,
    updateStatusAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

/**
 * Hook to withdraw an application
 */
export function useWithdrawApplication() {
  const queryClient = useQueryClient()

  const mutation = useWithdrawApplicationMutation({
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })

  return {
    withdraw: mutation.mutate,
    withdrawAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

/**
 * Hook to submit a new application
 * NOTE: applications.submit not yet migrated to REST SDK
 */
export function useSubmitApplication() {
  return {
    submit: (_params: unknown) => {},
    submitAsync: async (_params: unknown) => {
      throw new Error('Not implemented')
    },
    isLoading: false,
    isError: false,
    error: null,
  }
}

/**
 * Hook to update application step
 * NOTE: applications.updateStep not yet migrated to REST SDK
 */
export function useUpdateApplicationStep() {
  return {
    updateStep: (_params: unknown) => {},
    updateStepAsync: async (_params: unknown) => {
      throw new Error('Not implemented')
    },
    isLoading: false,
    isError: false,
    error: null,
  }
}

/**
 * Hook to get signed upload URL for application attachments
 */
export function useGetUploadUrl() {
  const mutation = useGetUploadUrlMutation()

  return {
    getUploadUrl: mutation.mutate,
    getUploadUrlAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

/**
 * Hook to confirm file upload
 */
export function useConfirmUpload() {
  const queryClient = useQueryClient()

  const mutation = useConfirmUploadMutation({
    onSuccess: (data: Application) => {
      queryClient.invalidateQueries({ queryKey: ['applications', 'detail', data.id] })
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
  })

  return {
    confirmUpload: mutation.mutate,
    confirmUploadAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

/**
 * Hook to calculate application score
 * NOTE: applications.calculateScore not yet migrated to REST SDK
 */
export function useCalculateScore() {
  return {
    calculateScore: (_params: unknown) => {},
    calculateScoreAsync: async (_params: unknown) => {
      throw new Error('Not implemented')
    },
    isLoading: false,
    isError: false,
    error: null,
  }
}

// Type re-exports for convenience
export type {
  UpdateApplicationParams,
  WithdrawApplicationParams,
  GetUploadUrlParams,
  GetUploadUrlResponse,
  ConfirmUploadParams,
}
export type Applications = Application[]
