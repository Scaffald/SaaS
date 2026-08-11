import { useUpdateEmployerApplicationMutation } from '@scf/core/utils/applications-sdk-hooks'
import type { Application } from '@scaffald/sdk/resources/applications'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useState } from 'react'
import type { ApplicationStatus } from '../types'

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
export const STATUS_MAP: Record<ApplicationStatus, ApiApplicationStatus> = {
  new: 'pending',
  screen: 'reviewing',
  inquired: 'inquired',
  interview: 'interview',
  offer: 'offer',
  hired: 'hired',
  rejected: 'rejected',
  withdrawn: 'withdrawn',
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
  // Employer endpoint, not the applicant one. That endpoint no longer accepts
  // `status` — it authorises on row ownership, so while it did an applicant
  // could promote themselves to `hired`. Routing the board through it would
  // now silently drop every drag.
  const updateMutation = useUpdateEmployerApplicationMutation({
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
      // Mirrors ALLOWED_TRANSITIONS in the API's application-transitions.ts.
      // Kept client-side to avoid a round trip for a move the server will
      // refuse anyway — but it is no longer the only guard, so drifting from
      // the server table costs a confusing 400 rather than an invalid write.
      const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
        new: ['screen', 'rejected'],
        screen: ['inquired', 'interview', 'rejected'],
        inquired: ['interview', 'offer', 'rejected'],
        interview: ['offer', 'rejected'],
        offer: ['hired', 'rejected'],
        hired: [], // Terminal state
        rejected: [], // Terminal state
        // Also terminal, and never an employer move — withdrawal is the
        // candidate's, via POST /v1/applications/{id}/withdraw. The server's
        // table says the same.
        withdrawn: [],
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
