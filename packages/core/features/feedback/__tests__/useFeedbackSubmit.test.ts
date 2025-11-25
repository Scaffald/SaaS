import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useFeedbackSubmit } from '../hooks/useFeedbackSubmit'
import type { FeedbackPendingSubmission } from '@app/schemas/feedback/feedback.schema'

const submitMutation = { mutateAsync: vi.fn() }
const uploadMutation = { mutateAsync: vi.fn() }
const toastShow = vi.fn()

const getPendingFeedbackQueueMock = vi.fn(async () => [])

const storageMocks = vi.hoisted(() => ({
  addPendingFeedback: vi.fn(),
  getPendingFeedbackQueue: getPendingFeedbackQueueMock as unknown as () => Promise<FeedbackPendingSubmission[]>,
  removePendingFeedback: vi.fn(),
  updatePendingFeedback: vi.fn(),
}))

vi.mock('@tamagui/toast', () => ({
  useToastController: () => ({
    show: toastShow,
  }),
}))

vi.mock('@app/core/utils/api', () => ({
  api: {
    feedback: {
      submit: {
        useMutation: () => submitMutation,
      },
      getUploadUrl: {
        useMutation: () => uploadMutation,
      },
    },
  },
}))

vi.mock('../utils/feedbackStorage', () => storageMocks)

describe('useFeedbackSubmit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    submitMutation.mutateAsync.mockReset()
    uploadMutation.mutateAsync.mockReset()
    storageMocks.addPendingFeedback.mockReset()
    getPendingFeedbackQueueMock.mockResolvedValue([])
    storageMocks.removePendingFeedback.mockReset()
    toastShow.mockReset()
  })

  const flushEffects = async () => {
    await act(async () => {
      await Promise.resolve()
    })
  }

  it.skip('exposes default submission state (tracking issue #7421)', async () => {
    const { result } = renderHook(() => useFeedbackSubmit())

    await flushEffects()

    expect(result.current.isSubmitting).toBe(false)
    expect(result.current.isProcessingQueue).toBe(false)
    expect(result.current.pendingCount).toBe(0)
    expect(typeof result.current.submitFeedback).toBe('function')
    expect(typeof result.current.processQueue).toBe('function')
  })

  it.skip('calls queue helpers when processing pending submissions (see #7421)', async () => {
    const { result } = renderHook(() => useFeedbackSubmit())

    await flushEffects()

    getPendingFeedbackQueueMock.mockResolvedValueOnce([
      {
        id: 'pending-1',
        feedbackType: 'comment',
        feedbackText: 'A'.repeat(150),
        pageUrl: '/dashboard/reports',
        userAgent: 'Vitest',
        attempts: 1,
      } as FeedbackPendingSubmission,
    ])

    submitMutation.mutateAsync.mockResolvedValue({ id: 'feedback-id' })

    await act(async () => {
      await result.current.processQueue()
    })

    expect(storageMocks.getPendingFeedbackQueue).toHaveBeenCalled()
    expect(result.current.isProcessingQueue).toBe(false)
  })
})

