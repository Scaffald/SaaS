import { renderHook, act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => {
  const createMutationRecord = () => {
    const mutate = vi.fn()
    const mutateAsync = vi.fn()
    const options: { onSuccess?: (data: unknown) => void } = {}
    const useMutation = vi.fn((config?: { onSuccess?: (data: unknown) => void }) => {
      options.onSuccess = config?.onSuccess
      return {
        mutate,
        mutateAsync,
        isPending: false,
        isError: false,
        error: null,
      }
    })
    return { useMutation, mutate, mutateAsync, options }
  }

  return {
    useUserApplications: vi.fn(),
    useApplicationById: vi.fn(),
    updateMutation: createMutationRecord(),
    withdrawMutation: createMutationRecord(),
    submitMutation: createMutationRecord(),
    updateStepMutation: createMutationRecord(),
    getUploadUrlMutation: createMutationRecord(),
    confirmUploadMutation: createMutationRecord(),
    calculateScoreMutation: createMutationRecord(),
    invalidateGetByUser: vi.fn(),
    invalidateGetById: vi.fn(),
    invalidateGetUserApplications: vi.fn(),
  }
})

vi.mock('@app/core/utils/api', () => ({
  api: {
    applications: {
      getUserApplications: { useQuery: mocks.useUserApplications },
      getById: { useQuery: mocks.useApplicationById },
      update: { useMutation: mocks.updateMutation.useMutation },
      withdraw: { useMutation: mocks.withdrawMutation.useMutation },
      submit: { useMutation: mocks.submitMutation.useMutation },
      updateStep: { useMutation: mocks.updateStepMutation.useMutation },
      getUploadUrl: { useMutation: mocks.getUploadUrlMutation.useMutation },
      confirmUpload: { useMutation: mocks.confirmUploadMutation.useMutation },
      calculateScore: { useMutation: mocks.calculateScoreMutation.useMutation },
    },
    useUtils: vi.fn(() => ({
      applications: {
        getByUser: { invalidate: mocks.invalidateGetByUser },
        getById: { invalidate: mocks.invalidateGetById },
        getUserApplications: { invalidate: mocks.invalidateGetUserApplications },
      },
    })),
  },
}))

const {
  useApplications,
  useUpdateApplicationStatus,
  useWithdrawApplication,
  useConfirmUpload,
  useCalculateScore,
  useUpdateApplicationStep,
} = await import('../useApplications')

const { useApplicationStatusChange } = await import('../useApplicationStatusChange')

describe('office applications hooks', () => {
  beforeEach(() => {
    mocks.useUserApplications.mockReset()
    mocks.useApplicationById.mockReset()
    mocks.invalidateGetByUser.mockReset()
    mocks.invalidateGetById.mockReset()
    mocks.invalidateGetUserApplications.mockReset()

    mocks.updateMutation.mutate.mockReset()
    mocks.updateMutation.mutateAsync.mockReset()
    mocks.updateMutation.useMutation.mockClear()
    mocks.updateMutation.options.onSuccess = undefined

    mocks.withdrawMutation.mutate.mockReset()
    mocks.withdrawMutation.useMutation.mockClear()
    mocks.withdrawMutation.options.onSuccess = undefined

    mocks.confirmUploadMutation.mutate.mockReset()
    mocks.confirmUploadMutation.useMutation.mockClear()
    mocks.confirmUploadMutation.options.onSuccess = undefined

    mocks.calculateScoreMutation.mutate.mockReset()
    mocks.calculateScoreMutation.useMutation.mockClear()
    mocks.calculateScoreMutation.options.onSuccess = undefined

    mocks.updateStepMutation.mutate.mockReset()
    mocks.updateStepMutation.useMutation.mockClear()
    mocks.updateStepMutation.options.onSuccess = undefined

    mocks.getUploadUrlMutation.mutate.mockReset()
    mocks.getUploadUrlMutation.useMutation.mockClear()
    mocks.getUploadUrlMutation.options.onSuccess = undefined

    mocks.useUserApplications.mockReturnValue({
      data: [{ id: 'app-1' }],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    })
  })

  it('fetches applications with provided filters', () => {
    const filters = { status: 'pending' as const, limit: 10, offset: 5 }
    const { result } = renderHook(() => useApplications(filters))

    expect(mocks.useUserApplications).toHaveBeenCalledWith(
      {
        status: 'pending',
        limit: 10,
        offset: 5,
      },
      {
        enabled: true,
        refetchOnMount: true,
      }
    )
    expect(result.current.applications).toEqual([{ id: 'app-1' }])
    expect(result.current.isLoading).toBe(false)
  })

  it('invalidates getByUser after status update success', () => {
    renderHook(() => useUpdateApplicationStatus())

    expect(mocks.updateMutation.useMutation).toHaveBeenCalled()
    act(() => {
      mocks.updateMutation.options.onSuccess?.(undefined)
    })

    expect(mocks.invalidateGetByUser).toHaveBeenCalledTimes(1)
  })

  it('invalidates getByUser after withdraw success', () => {
    renderHook(() => useWithdrawApplication())

    act(() => {
      mocks.withdrawMutation.options.onSuccess?.(undefined)
    })

    expect(mocks.invalidateGetByUser).toHaveBeenCalledTimes(1)
  })

  it('invalidates caches after confirm upload success with id', () => {
    renderHook(() => useConfirmUpload())

    act(() => {
      mocks.confirmUploadMutation.options.onSuccess?.({ id: 'app-2' })
    })

    expect(mocks.invalidateGetById).toHaveBeenCalledWith({ id: 'app-2' })
    expect(mocks.invalidateGetByUser).toHaveBeenCalled()
  })

  it('only invalidates when calculate score success returns id', () => {
    renderHook(() => useCalculateScore())

    act(() => {
      mocks.calculateScoreMutation.options.onSuccess?.({ id: 'app-3' })
    })

    expect(mocks.invalidateGetById).toHaveBeenCalledWith({ id: 'app-3' })
    expect(mocks.invalidateGetByUser).toHaveBeenCalled()

    mocks.invalidateGetById.mockClear()
    mocks.invalidateGetByUser.mockClear()

    act(() => {
      mocks.calculateScoreMutation.options.onSuccess?.(undefined)
    })

    expect(mocks.invalidateGetById).not.toHaveBeenCalled()
    expect(mocks.invalidateGetByUser).not.toHaveBeenCalled()
  })

  it('invalidates specific application after step update', () => {
    renderHook(() => useUpdateApplicationStep())

    act(() => {
      mocks.updateStepMutation.options.onSuccess?.({ id: 'step-app' })
    })

    expect(mocks.invalidateGetById).toHaveBeenCalledWith({ id: 'step-app' })
  })

  it('handles application status changes with validation and confirmations', async () => {
    const user = renderHook(() => useApplicationStatusChange())

    mocks.updateMutation.mutateAsync.mockResolvedValue(undefined)

    // invalid transition
    await act(async () => {
      await user.result.current.changeStatus({ applicationId: 'app', fromStatus: 'new', toStatus: 'offer' })
    })
    expect(user.result.current.error).toBeInstanceOf(Error)
    expect(mocks.updateMutation.mutateAsync).not.toHaveBeenCalled()

    // critical change sets pending
    await act(async () => {
      await user.result.current.changeStatus({ applicationId: 'app', fromStatus: 'screen', toStatus: 'rejected' })
    })
    expect(user.result.current.pendingChange).toEqual({ applicationId: 'app', fromStatus: 'screen', toStatus: 'rejected' })

    await act(async () => {
      await user.result.current.confirmChange()
    })

    expect(mocks.updateMutation.mutateAsync).toHaveBeenCalledWith({ application_id: 'app', status: 'rejected' })
    expect(user.result.current.pendingChange).toBeNull()

    await act(async () => {
      await user.result.current.changeStatus({ applicationId: 'app-2', fromStatus: 'new', toStatus: 'screen' })
    })

    expect(mocks.updateMutation.mutateAsync).toHaveBeenCalledWith({ application_id: 'app-2', status: 'reviewing' })

    act(() => {
      mocks.updateMutation.options.onSuccess?.(undefined)
    })

    expect(mocks.invalidateGetUserApplications).toHaveBeenCalled()
  })
})
