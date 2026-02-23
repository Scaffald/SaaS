import { useQueryClient } from '@tanstack/react-query'
import {
  useApplication as useApplicationSDK,
  useUpdateApplicationMutation,
  useWithdrawApplicationMutation,
  useGetUploadUrlMutation,
  useConfirmUploadMutation,
} from '@scf/core/utils/applications-sdk-hooks'
import type {
  Application,
  UpdateApplicationParams,
  WithdrawApplicationParams,
  GetUploadUrlParams,
  GetUploadUrlResponse,
  ConfirmUploadParams,
} from '@scaffald/sdk/resources/applications'

export type { Application }

// Office applications list (admin context) - type for returned data
export interface ApplicationsListItem {
  id: string
  status: string
  created_at: string
  updated_at: string
  user_id: string
  job_id: string
  [key: string]: unknown
}

export interface ApplicationsListFilters {
  status?: 'pending' | 'reviewing' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn'
  limit?: number
  offset?: number
  organization_id?: string
  job_id?: string
  date_from?: string
  date_to?: string
}

/**
 * Hook to fetch applications for organization's jobs (office admin context)
 * NOTE: office.listApplications not yet migrated to REST SDK — returns empty list
 */
export function useApplications(_filters?: ApplicationsListFilters) {
  return {
    applications: [] as ApplicationsListItem[],
    isLoading: false,
    isError: false,
    error: null,
    refetch: async () => {},
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
    submitAsync: async (_params: unknown) => { throw new Error('Not implemented') },
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
    updateStepAsync: async (_params: unknown) => { throw new Error('Not implemented') },
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
    calculateScoreAsync: async (_params: unknown) => { throw new Error('Not implemented') },
    isLoading: false,
    isError: false,
    error: null,
  }
}

// Type re-exports for convenience
export type { UpdateApplicationParams, WithdrawApplicationParams, GetUploadUrlParams, GetUploadUrlResponse, ConfirmUploadParams }
export type Applications = Application[]
