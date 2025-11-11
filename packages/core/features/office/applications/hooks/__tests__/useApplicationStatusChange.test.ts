import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { ApplicationStatus } from '../../mock-data/ats-mock-data'

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

vi.mock('@app/core/utils/api', () => ({
  api: {
    useUtils: () => ({
      applications: {
        getUserApplications: {
          invalidate: invalidateMock,
        },
      },
    }),
    applications: {
      update: {
        useMutation: (callbacks?: typeof mutationCallbacks) => {
          mutationCallbacks = callbacks ?? {}
          return {
            mutateAsync: mutateAsyncMock,
            isPending: false,
          }
        },
      },
    },
  },
}))

const { useApplicationStatusChange } = await import('../useApplicationStatusChange')

describe('useApplicationStatusChange', () => {
  beforeEach(() => {
    invalidateMock.mockReset()
    mutateAsyncMock.mockClear()
    mutateShouldFail = false
    lastMutationPayload = undefined
    mutationCallbacks = {}
  })

  it('executes valid non-critical transitions immediately', async () => {
    const { result } = renderHook(() => useApplicationStatusChange())

    await act(async () => {
      await result.current.changeStatus({
        applicationId: 'app-1',
        fromStatus: 'new',
        toStatus: 'screen',
      })
    })

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(1)
    })

    expect(lastMutationPayload).toEqual({
      application_id: 'app-1',
      status: 'reviewing',
    })
    expect(invalidateMock).toHaveBeenCalled()
    expect(result.current.pendingChange).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('tracks invalid transitions as errors without invoking mutation', async () => {
    const { result } = renderHook(() => useApplicationStatusChange())

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
    const { result } = renderHook(() => useApplicationStatusChange())

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
    const { result } = renderHook(() => useApplicationStatusChange())

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
      application_id: 'app-3',
      status: 'hired',
    })
    expect(result.current.pendingChange).toBeNull()
  })

  it('allows cancelling a recorded pending change', async () => {
    const { result } = renderHook(() => useApplicationStatusChange())

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


