import { useUpdateEmployerApplicationMutation } from '@scf/core/utils/applications-sdk-hooks'
import type { Application } from '@scaffald/sdk/resources/applications'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@scaffald/ui'
import type { ApplicationStatus } from '../types'
import { createWriteQueue, UNDO_WINDOW_MS, type WriteQueue } from '../pending-writes'

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
  /**
   * Who moved, for the toast. Optional because the hook can say something
   * useful without it, and an id in a toast is worse than no name at all.
   */
  candidateName?: string
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

/**
 * Which stage a candidate may move to, from where.
 *
 * Mirrors ALLOWED_TRANSITIONS in the API's application-transitions.ts. Kept
 * client-side to avoid a round trip for a move the server will refuse anyway —
 * but it is no longer the only guard, so drifting from the server table costs
 * a confusing 400 rather than an invalid write.
 *
 * This lives at module scope, exported, because it was previously trapped
 * inside a useCallback inside this hook. Nothing else could ask "what is legal
 * from here?", which is the root cause of two separate bugs (§12 #12 and #13):
 * the board could not close illegal drop targets DURING a drag, and no
 * keyboard or touch path could offer a list of legal moves.
 */
export const ALLOWED_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  new: ['screen', 'rejected'],
  screen: ['inquired', 'interview', 'rejected'],
  inquired: ['interview', 'offer', 'rejected'],
  interview: ['offer', 'rejected'],
  offer: ['hired', 'rejected'],
  hired: [], // Terminal state
  rejected: [], // Terminal state
  // Also terminal, and never an employer move — withdrawal is the candidate's,
  // via POST /v1/applications/{id}/withdraw. The server's table says the same.
  withdrawn: [],
}

export function isValidStatusTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false
}

/** Every stage this candidate can legally be moved to right now. */
export function allowedTargetsFor(from: ApplicationStatus): ApplicationStatus[] {
  return ALLOWED_TRANSITIONS[from] ?? []
}

/** Stage names as a person would say them, for the toast. */
const STAGE_LABELS: Record<ApplicationStatus, string> = {
  new: 'New',
  screen: 'Screening',
  inquired: 'Inquired',
  interview: 'Interview',
  offer: 'Offer',
  hired: 'Hired',
  rejected: 'Closed',
  withdrawn: 'Withdrawn',
}

/** The employer list cache: `{ data: [...], total }` per filter combination. */
interface CachedList {
  data: Array<{ id: string; status?: string }>
  total?: number
}

interface CachedStatusSnapshot {
  applicationId: string
  /** The status each cached list held before the patch, keyed by cache key. */
  before: Array<{ key: unknown[]; status: string | undefined }>
}

/**
 * Move the row in every cached employer list, and remember what it was.
 *
 * Every filter combination is its own cache entry, so this patches them all
 * rather than guessing which one the screen is reading.
 */
function patchCachedStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  applicationId: string,
  nextStatus: string
): CachedStatusSnapshot {
  const before: CachedStatusSnapshot['before'] = []

  // Enumerate then patch per key, rather than a blanket `setQueriesData`
  // updater: this way the cache key is in hand for the rollback, and there is
  // no reliance on whether the updater is handed its own query.
  const entries = queryClient.getQueriesData<CachedList>({
    queryKey: ['applications', 'employer-list'],
  })

  for (const [key, old] of entries) {
    const row = old?.data?.find((r) => r.id === applicationId)
    if (!row) continue
    before.push({ key: key as unknown[], status: row.status })
    queryClient.setQueryData<CachedList>(key, (current) => {
      if (!current?.data) return current
      return {
        ...current,
        data: current.data.map((r) => (r.id === applicationId ? { ...r, status: nextStatus } : r)),
      }
    })
  }

  return { applicationId, before }
}

/** Put the row back exactly where each cache had it. */
function restoreCachedStatus(
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: CachedStatusSnapshot
): void {
  for (const entry of snapshot.before) {
    queryClient.setQueryData<CachedList>(entry.key, (old) => {
      if (!old?.data) return old
      return {
        ...old,
        data: old.data.map((row) =>
          row.id === snapshot.applicationId ? { ...row, status: entry.status } : row
        ),
      }
    })
  }
}

export const useApplicationStatusChange = (): UseApplicationStatusChangeReturn => {
  const [isChanging, setIsChanging] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [pendingChange, setPendingChange] = useState<StatusChangeParams | null>(null)

  const toast = useToast()
  // One queue per mount. A ref, not state — scheduling must never re-render.
  const queueRef = useRef<WriteQueue | null>(null)
  if (!queueRef.current) queueRef.current = createWriteQueue()
  const queue = queueRef.current

  // A held write must not be lost because the user navigated or closed the tab.
  // Both paths flush rather than discard: the move was already confirmed on
  // screen, so dropping it would be the worst outcome available.
  useEffect(() => {
    const flush = () => queue.flushAll()
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', flush)
      // `pagehide` is the one that actually fires on mobile Safari, where
      // `beforeunload` is unreliable.
      window.addEventListener('pagehide', flush)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', flush)
        window.removeEventListener('pagehide', flush)
      }
      flush()
    }
  }, [queue])

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
    (from: ApplicationStatus, to: ApplicationStatus): boolean => isValidStatusTransition(from, to),
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

      // Everything else moves optimistically and is written after a short
      // undo window. See pending-writes.ts for why the write is delayed rather
      // than reversed — there is no legal backward transition to reverse with.
      setError(null)

      const previous = patchCachedStatus(queryClient, applicationId, STATUS_MAP[toStatus])

      const send = async () => {
        setIsChanging(true)
        try {
          await updateMutation.mutateAsync({
            id: applicationId,
            params: { status: STATUS_MAP[toStatus] },
          })
        } catch (err) {
          // The optimistic move was a promise this write would land. It did
          // not, so put the row back rather than leaving the board showing a
          // stage the server never accepted.
          restoreCachedStatus(queryClient, previous)
          setError(err as Error)
        }
      }

      queue.schedule(applicationId, send)

      const stage = STAGE_LABELS[toStatus] ?? toStatus
      const who = params.candidateName?.trim()
      const toastId = toast.show({
        message: who ? `${who} moved to ${stage}` : `Moved to ${stage}`,
        duration: UNDO_WINDOW_MS,
        action: {
          label: 'Undo',
          onPress: () => {
            // Only claim the undo if the write really was still held. Past the
            // window the row has moved for real, and saying otherwise would be
            // the same lie as a button that 400s.
            if (queue.cancel(applicationId)) {
              restoreCachedStatus(queryClient, previous)
            }
            toast.dismiss(toastId)
          },
        },
      })
    },
    [isValidTransition, isCriticalChange, updateMutation, queryClient, queue, toast]
  )

  /**
   * Hire and reject, once the confirmation dialog has been answered.
   *
   * These write IMMEDIATELY — no undo window. They are the two moves that
   * already ask before acting, and holding a write the user has just
   * explicitly confirmed would mean the dialog closes saying it is done while
   * nothing has happened for five seconds. The dialog IS the undo here; it
   * comes before the decision rather than after it.
   */
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
