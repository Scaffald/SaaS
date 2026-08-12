import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/react-query'
import type {
  EmploymentPreferences,
  UpdateEmploymentParams,
  UpdateEmploymentResponse,
} from '@scaffald/sdk'
import { useScaffaldJobsClient } from '@scf/core/provider'
import { useToast } from '@scaffald/ui'
import { invalidateProfileQueries } from '@scf/core/features/profile/utils/profile-sync'
import {
  completeProfileSync,
  failProfileSync,
  resetProfileSyncError,
  startProfileSync,
} from '@scf/core/features/profile/utils/profile-sync-store'
import type { EmploymentProfileFormData } from '@scf/supabase/client-types'
import { profileEmploymentDefaults } from '@scf/supabase/client-types'
import { profileQueryKeys } from '@scf/core/utils/profile-query-keys'
import { composeMutationOptions } from '@scf/core/utils/compose-mutation-options'

/**
 * Get employment preferences
 */
export function useEmployment(
  options?: Omit<UseQueryOptions<EmploymentPreferences, Error>, 'queryKey' | 'queryFn'>
) {
  const client = useScaffaldJobsClient()

  return useQuery({
    queryKey: profileQueryKeys.employment(),
    queryFn: async () => {
      if (!client) throw new Error('Missing client')
      return client.employment.getEmployment()
    },
    enabled: !!client && options?.enabled !== false,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  })
}

/**
 * Update employment preferences
 */
export function useUpdateEmploymentMutation(
  options?: UseMutationOptions<UpdateEmploymentResponse, Error, UpdateEmploymentParams>
) {
  const client = useScaffaldJobsClient()

  return useMutation({
    mutationFn: async (params: UpdateEmploymentParams) => {
      if (!client) throw new Error('Missing client')
      return client.employment.updateEmployment(params)
    },
    ...options,
  })
}

interface EmploymentMutationContext {
  previousEmployment?: EmploymentProfileFormData | undefined
}

/**
 * Update employment mutation with optimistic updates and profile sync.
 * Use at page level and pass mutate to atomic cards.
 */
export function useEmploymentUpdateMutationWithSync(
  overrides?: UseMutationOptions<
    UpdateEmploymentResponse,
    Error,
    UpdateEmploymentParams
  >
) {
  const queryClient = useQueryClient()
  const toast = useToast()

  // composeMutationOptions, not object spread: a caller passing its own
  // onSuccess used to *replace* the handler below rather than add to it (#586).
  return useUpdateEmploymentMutation(
    composeMutationOptions(
      {
        async onMutate(
          input: UpdateEmploymentParams
        ): Promise<EmploymentMutationContext> {
          resetProfileSyncError()
          startProfileSync()
          await queryClient.cancelQueries({ queryKey: profileQueryKeys.employment() })
          const previousEmployment = queryClient.getQueryData<
            EmploymentProfileFormData
          >(profileQueryKeys.employment())
          queryClient.setQueryData(
            profileQueryKeys.employment(),
            (
              current: EmploymentProfileFormData | undefined
            ): EmploymentProfileFormData =>
              ({
                ...(current ?? profileEmploymentDefaults),
                ...input,
              }) as EmploymentProfileFormData
          )
          return { previousEmployment }
        },
        onError(
          error: Error,
          _variables: UpdateEmploymentParams,
          _context: unknown
        ) {
          const ctx = _context as EmploymentMutationContext | undefined
          if (ctx?.previousEmployment) {
            queryClient.setQueryData(
              profileQueryKeys.employment(),
              ctx.previousEmployment
            )
          }
          failProfileSync()
          toast.show({
            title: 'Error',
            message:
              error.message ||
              'Failed to save employment preferences. Please try again.',
            variant: 'error',
          })
        },
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: profileQueryKeys.employment(),
          })
        },
        onSettled: async (
          _data: UpdateEmploymentResponse | undefined,
          error: unknown
        ) => {
          if (!error) {
            completeProfileSync()
          }
          await invalidateProfileQueries(queryClient)
        },
      },
      overrides
    )
  )
}
