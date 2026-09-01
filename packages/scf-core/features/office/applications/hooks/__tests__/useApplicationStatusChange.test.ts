import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { QueryClient } from '@tanstack/react-query'

import { UNDO_WINDOW_MS } from '../../pending-writes'
import type { ApplicationStatus } from '../../types'
import { TestQueryWrapper } from '@test-helpers/test-utils'

const invalidateMock = vi.fn()
let mutateShouldFail = false
let lastMutationPayload: unknown
let mutationCallbacks: {
  onSuccess?: () => void
  onError?: (error: Error) => void
  onSettled?: () => void
} = {}

const mutateAsyncMock = vi.fn(async (payload: unknown) => {
  lastMutationPayload = payload

  if (mutateShouldFail) {
    const error = new Error('mutation failed')
    mutationCallbacks.onError?.(error)
    mutationCallbacks.onSettled?.()
    throw error
  }

  mutationCallbacks.onSuccess?.()
  mutationCallbacks.onSettled?.()
  return { ok: true }
})

// The hook drives the *employer* mutation. It used to call
// useUpdateApplicationMutation, which targets the applicant endpoint — that
// endpoint no longer accepts `status`, so routing the board through it would
// silently drop every drag.
vi.mock('@scf/core/utils/applications-sdk-hooks', () => ({
  useUpdateEmployerApplicationMutation: (callbacks?: typeof mutationCallbacks) => {
    mutationCallbacks = callbacks ?? {}
    return {
      mutateAsync: mutateAsyncMock,
      isPending: false,
    }
  },
}))

// A real QueryClient, not a hand-written stand-in.
//
// This used to be `{ invalidateQueries }` and nothing else. #648 taught the
// hook to patch the cached list optimistically, so it started calling
// `getQueriesData` — which the stand-in did not have, and the only test that
// reaches that code died on `getQueriesData is not a function`. A stub only
// covers the calls someone remembered to add to it.
//
// With the real client the cache API is real, `invalidateQueries` is spied on
// the real method, and the optimistic patch can be asserted against actual
// cache contents (see 'patches every cached employer list' below).
const clientRef = vi.hoisted(() => ({ current: null as QueryClient | null }))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  clientRef.current = new actual.QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return {
    ...actual,
    useQueryClient: () => clientRef.current,
  }
})

/** The real client the hook is handed. Non-null once the mock factory has run. */
const client = () => clientRef.current as QueryClient

const EMPLOYER_LIST = ['applications', 'employer-list'] as const

const { useApplicationStatusChange } = await import('../useApplicationStatusChange')

describe('useApplicationStatusChange', () => {
  beforeEach(() => {
    invalidateMock.mockReset()
    mutateAsyncMock.mockClear()
    mutateShouldFail = false
    lastMutationPayload = undefined
    mutationCallbacks = {}

    vi.useRealTimers()
    client().clear()
    // Spy rather than replace: the rest of the client stays real, so the
    // optimistic patch and its rollback run for real.
    client().invalidateQueries = invalidateMock
  })

  it('holds a valid non-critical transition for the undo window, then sends it', async () => {
    // This test used to be called "executes ... immediately", and asserted the
    // mutation had fired by the time changeStatus resolved. #648 deliberately
    // stopped that: a non-critical move is held for UNDO_WINDOW_MS so Undo has
    // something to cancel. The test was not updated with it — it kept passing
    // in CI only because it died earlier, on the stubbed query client.
    //
    // So the contract is now two-part, and both halves are worth pinning: the
    // write must NOT have gone out during the window, and it must go out after.
    vi.useFakeTimers()
    const { result } = renderHook(() => useApplicationStatusChange(), { wrapper: TestQueryWrapper })

    await act(async () => {
      await result.current.changeStatus({
        applicationId: 'app-1',
        fromStatus: 'new',
        toStatus: 'screen',
      })
    })

    // Still inside the window: nothing sent yet.
    expect(mutateAsyncMock).not.toHaveBeenCalled()
    expect(result.current.error).toBeNull()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(UNDO_WINDOW_MS + 10)
    })

    expect(mutateAsyncMock).toHaveBeenCalledTimes(1)
    // Implementation nests the mutation params: { id, params: { status } }.
    expect(lastMutationPayload).toEqual({
      id: 'app-1',
      params: { status: 'reviewing' },
    })
    expect(invalidateMock).toHaveBeenCalled()
    expect(result.current.pendingChange).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('tracks invalid transitions as errors without invoking mutation', async () => {
    const { result } = renderHook(() => useApplicationStatusChange(), { wrapper: TestQueryWrapper })

    await act(async () => {
      await result.current.changeStatus({
        applicationId: 'app-1',
        fromStatus: 'new',
        toStatus: 'offer',
      })
    })

    expect(mutateAsyncMock).not.toHaveBeenCalled()
    expect(result.current.error?.message).toBe('Invalid transition from new to offer')
  })

  it('captures critical transitions for confirmation', async () => {
    const { result } = renderHook(() => useApplicationStatusChange(), { wrapper: TestQueryWrapper })

    const payload = {
      applicationId: 'app-2',
      fromStatus: 'offer' as ApplicationStatus,
      toStatus: 'hired' as ApplicationStatus,
      reason: 'accepted offer',
    }

    await act(async () => {
      await result.current.changeStatus(payload)
    })

    expect(mutateAsyncMock).not.toHaveBeenCalled()
    expect(result.current.pendingChange).toEqual(payload)
    expect(result.current.isChanging).toBe(false)
  })

  it('confirms pending transitions and resets state', async () => {
    const { result } = renderHook(() => useApplicationStatusChange(), { wrapper: TestQueryWrapper })

    const payload = {
      applicationId: 'app-3',
      fromStatus: 'offer' as ApplicationStatus,
      toStatus: 'hired' as ApplicationStatus,
    }

    await act(async () => {
      await result.current.changeStatus(payload)
    })

    await act(async () => {
      await result.current.confirmChange('welcome aboard')
    })

    expect(mutateAsyncMock).toHaveBeenCalledWith({
      id: 'app-3',
      params: { status: 'hired' },
    })
    expect(result.current.pendingChange).toBeNull()
  })

  it('patches every cached employer list, not just the one on screen', async () => {
    // The behaviour #648 added, and the reason the hook needs a real cache.
    // Each filter combination is its own cache entry; a move has to land in
    // all of them or the row snaps back when the user changes a filter.
    const unfiltered = [...EMPLOYER_LIST, { status: undefined }]
    const filtered = [...EMPLOYER_LIST, { status: 'new' }]
    const row = { id: 'app-9', status: 'new' }

    client().setQueryData(unfiltered, { data: [row, { id: 'other', status: 'new' }] })
    client().setQueryData(filtered, { data: [{ ...row }] })

    const { result } = renderHook(() => useApplicationStatusChange(), { wrapper: TestQueryWrapper })

    await act(async () => {
      await result.current.changeStatus({
        applicationId: 'app-9',
        fromStatus: 'new',
        toStatus: 'screen',
      })
    })

    const statusIn = (key: unknown[], id: string) =>
      (client().getQueryData(key) as { data: Array<{ id: string; status: string }> }).data.find(
        (r) => r.id === id
      )?.status

    expect(statusIn(unfiltered, 'app-9')).toBe('reviewing')
    expect(statusIn(filtered, 'app-9')).toBe('reviewing')
    // Untouched rows stay untouched.
    expect(statusIn(unfiltered, 'other')).toBe('new')
  })

  it('rolls the cached row back when the move fails', async () => {
    const key = [...EMPLOYER_LIST, { status: undefined }]
    client().setQueryData(key, { data: [{ id: 'app-10', status: 'new' }] })
    mutateShouldFail = true

    vi.useFakeTimers()
    const { result } = renderHook(() => useApplicationStatusChange(), { wrapper: TestQueryWrapper })

    await act(async () => {
      await result.current.changeStatus({
        applicationId: 'app-10',
        fromStatus: 'new',
        toStatus: 'screen',
      })
    })

    // Optimistically moved while the write is still held.
    const statusNow = () =>
      (client().getQueryData(key) as { data: Array<{ id: string; status: string }> }).data[0].status
    expect(statusNow()).toBe('reviewing')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(UNDO_WINDOW_MS + 10)
    })

    // The write went out and failed, so the board must not keep showing a
    // stage the server never accepted.
    expect(mutateAsyncMock).toHaveBeenCalledTimes(1)
    expect(statusNow()).toBe('new')
  })

  it('allows cancelling a recorded pending change', async () => {
    const { result } = renderHook(() => useApplicationStatusChange(), { wrapper: TestQueryWrapper })

    await act(async () => {
      await result.current.changeStatus({
        applicationId: 'app-4',
        fromStatus: 'offer',
        toStatus: 'hired',
      })
    })

    await act(async () => {
      result.current.cancelChange()
    })

    expect(result.current.pendingChange).toBeNull()
  })
})


