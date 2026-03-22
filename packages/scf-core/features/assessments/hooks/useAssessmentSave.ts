import { ROUTES } from '@scf/core/constants/routes'
import { useToast } from '@scaffald/ui'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import type { UseMutationResult } from '@tanstack/react-query'

interface UseAssessmentSaveOptions<TData, TVariables> {
  /** Query keys to invalidate on success */
  queryKeys: string[][]
  /** Toast title on success */
  successTitle: string
  /** Toast message on success */
  successMessage: string
  /** The mutation hook to wrap — called with merged onSuccess/onError */
  useMutation: (options: {
    onSuccess: () => void
    onError: (error: { message?: string }) => void
  }) => UseMutationResult<TData, { message?: string }, TVariables>
  /** Additional callback on success (runs after toast + navigate) */
  onSuccess?: () => void
  /** Override the default error message */
  errorFallback?: string
  /** Skip navigation to dashboard on success */
  skipNavigation?: boolean
}

/**
 * Wraps an assessment mutation hook with standardized success/error handling:
 * - Invalidates specified query keys
 * - Shows success/error toasts
 * - Navigates to dashboard on success
 */
export function useAssessmentSave<TData, TVariables>({
  queryKeys,
  successTitle,
  successMessage,
  useMutation,
  onSuccess: onSuccessExtra,
  errorFallback = 'Failed to save assessment. Please try again.',
  skipNavigation = false,
}: UseAssessmentSaveOptions<TData, TVariables>) {
  const toast = useToast()
  const router = useRouter()
  const queryClient = useQueryClient()

  return useMutation({
    onSuccess: () => {
      for (const key of queryKeys) {
        queryClient.invalidateQueries({ queryKey: key })
      }
      toast.show({
        title: successTitle,
        message: successMessage,
        variant: 'success',
      })
      if (!skipNavigation) {
        router.push(ROUTES.DASHBOARD.path)
      }
      onSuccessExtra?.()
    },
    onError: (error: { message?: string }) => {
      toast.show({
        title: 'Error',
        message: error.message || errorFallback,
        variant: 'error',
      })
    },
  })
}
