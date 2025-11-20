import { api } from '@app/core/utils/api'
import type { AppRouter } from '@app/supabase/client-types'
import type { inferRouterOutputs } from '@trpc/server'

type RouterOutputs = inferRouterOutputs<AppRouter>

/**
 * Hook to fetch applications for organization's jobs (office admin context)
 */
export function useApplications(filters?: {
  status?: 'pending' | 'reviewing' | 'interview' | 'offer' | 'hired' | 'rejected' | 'withdrawn'
  limit?: number
  offset?: number
  organization_id?: string
  job_id?: string
  date_from?: string
  date_to?: string
}) {
  const query = api.office.listApplications.useQuery(
    {
      status: filters?.status,
      limit: filters?.limit,
      offset: filters?.offset,
      organization_id: filters?.organization_id,
      job_id: filters?.job_id,
      date_from: filters?.date_from,
      date_to: filters?.date_to,
    },
    {
      enabled: true,
      refetchOnMount: true,
    }
  )

  return {
    applications: query.data?.applications || [],
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
  const query = api.applications.getById.useQuery(
    { id },
    {
      enabled: !!id,
    }
  )

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
  const utils = api.useUtils()

  const mutation = api.applications.update.useMutation({
    onSuccess: () => {
      // Invalidate and refetch applications
      utils.applications.getByUser.invalidate()
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
  const utils = api.useUtils()

  const mutation = api.applications.withdraw.useMutation({
    onSuccess: () => {
      utils.applications.getByUser.invalidate()
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
 */
export function useSubmitApplication() {
  const utils = api.useUtils()

  const mutation = api.applications.submit.useMutation({
    onSuccess: () => {
      utils.applications.getByUser.invalidate()
    },
  })

  return {
    submit: mutation.mutate,
    submitAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

/**
 * Hook to update application step
 */
export function useUpdateApplicationStep() {
  const utils = api.useUtils()

  const mutation = api.applications.updateStep.useMutation({
    onSuccess: (data: { id: string }) => {
      // Invalidate specific application
      utils.applications.getById.invalidate({ id: data.id })
    },
  })

  return {
    updateStep: mutation.mutate,
    updateStepAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

/**
 * Hook to get signed upload URL for application attachments
 */
export function useGetUploadUrl() {
  const mutation = api.applications.getUploadUrl.useMutation()

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
  const utils = api.useUtils()

  const mutation = api.applications.confirmUpload.useMutation({
    onSuccess: (data: { id: string }) => {
      // Invalidate specific application
      utils.applications.getById.invalidate({ id: data.id })
      utils.applications.getByUser.invalidate()
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
 */
export function useCalculateScore() {
  const utils = api.useUtils()

  const mutation = api.applications.calculateScore.useMutation({
    onSuccess: (data: { id?: string } | undefined) => {
      // Invalidate specific application
      if (data?.id) {
        utils.applications.getById.invalidate({ id: data.id })
        utils.applications.getByUser.invalidate()
      }
    },
  })

  return {
    calculateScore: mutation.mutate,
    calculateScoreAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
  }
}

// Type exports for convenience
export type Application = NonNullable<RouterOutputs['applications']['getById']>
export type Applications = NonNullable<RouterOutputs['office']['listApplications']>['applications']
