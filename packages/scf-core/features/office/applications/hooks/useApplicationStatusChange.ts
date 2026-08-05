import { useUpdateApplicationMutation } from '@scf/core/utils/applications-sdk-hooks'
import type { Application } from '@scaffald/sdk/resources/applications'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import type { ApplicationStatus } from '../../mock-data/ats-mock-data'

type ApiApplicationStatus = Application['status']

/**
 * Map kanban stage to the API-surface status name.
 *
 * Typed against the SDK's own union rather than `string`, so the call sites
 * below need no casts. The previous `Record<ApplicationStatus, string>` forced
 * an inline cast at each mutation, and the two casts had drifted apart —
 * `confirmChange` omitted `inquired`, so the one path that handles the
 * critical hire/reject confirmations disagreed with the one that does not.
 */
const STATUS_MAP: Record<ApplicationStatus, ApiApplicationStatus> = {
  new: 'pending',
  screen: 'reviewing',
  inquired: 'inquired',
  interview: 'interview',
  offer: 'offer',
  hired: 'hired',
  rejected: 'rejected',
}

interface StatusChangeParams {
  applicationId: string
  fromStatus: ApplicationStatus
  toStatus: ApplicationStatus
  reason?: string
}

interface UseApplicationStatusChangeReturn {
  changeStatus: (params: StatusChangeParams) => Promise<void>
  isChanging: boolean
  error: Error | null
  pendingChange: StatusChangeParams | null
  setPendingChange: (params: StatusChangeParams | null) => void
  confirmChange: (reason?: string) => Promise<void>
  cancelChange: () => void
}

export const useApplicationStatusChange = (): UseApplicationStatusChangeReturn => {
  const [isChanging, setIsChanging] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [pendingChange, setPendingChange] = useState<StatusChangeParams | null>(null)

  const queryClient = useQueryClient()
  const updateMutation = useUpdateApplicationMutation({
    onSuccess: () => {
      // Invalidate applications query to refetch
      queryClient.invalidateQueries({ queryKey: ['applications'] })
    },
    onError: (err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
    },
    onSettled: () => {
      setIsChanging(false)
    },
  })

  const isCriticalChange = useCallback((toStatus: ApplicationStatus): boolean => {
    return toStatus === 'rejected' || toStatus === 'hired'
  }, [])

  const isValidTransition = useCallback(
    (from: ApplicationStatus, to: ApplicationStatus): boolean => {
      // Define valid transitions
      const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
        new: ['screen', 'rejected'],
        screen: ['inquired', 'interview', 'rejected'],
        inquired: ['interview', 'offer', 'rejected'],
        interview: ['offer', 'rejected'],
        offer: ['hired', 'rejected'],
        hired: [], // Terminal state
        rejected: [], // Terminal state
      }

      return validTransitions[from]?.includes(to) || false
    },
    []
  )

  const changeStatus = useCallback(
    async (params: StatusChangeParams) => {
      const { applicationId, fromStatus, toStatus } = params

      // Validate transition
      if (!isValidTransition(fromStatus, toStatus)) {
        setError(new Error(`Invalid transition from ${fromStatus} to ${toStatus}`))
        return
      }

      // If critical change, show confirmation modal
      if (isCriticalChange(toStatus)) {
        setPendingChange(params)
        return
      }

      // Otherwise, proceed immediately
      setIsChanging(true)
      setError(null)

      try {
        await updateMutation.mutateAsync({
          id: applicationId,
          params: { status: STATUS_MAP[toStatus] },
        })
      } catch (err) {
        setError(err as Error)
      }
    },
    [isValidTransition, isCriticalChange, updateMutation]
  )

  const confirmChange = useCallback(
    async (_reason?: string) => {
      if (!pendingChange) return

      setIsChanging(true)
      setError(null)

      try {
        await updateMutation.mutateAsync({
          id: pendingChange.applicationId,
          params: { status: STATUS_MAP[pendingChange.toStatus] },
        })

        setPendingChange(null)
      } catch (err) {
        setError(err as Error)
      }
    },
    [pendingChange, updateMutation]
  )

  const cancelChange = useCallback(() => {
    setPendingChange(null)
  }, [])

  return {
    changeStatus,
    isChanging,
    error,
    pendingChange,
    setPendingChange,
    confirmChange,
    cancelChange,
  }
}
