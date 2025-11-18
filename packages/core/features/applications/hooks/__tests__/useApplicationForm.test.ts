import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useApplicationForm } from '../useApplicationForm'
import type { ScreeningAnswers, CustomQuestionAnswer, AttachmentMetadata } from '@app/schemas'
import { ApplicationStep } from '@app/schemas'

const mockSubmitMutation = {
  mutateAsync: vi.fn(),
  isLoading: false,
  error: null,
}

const mockUpdateMutation = {
  mutateAsync: vi.fn(),
  isLoading: false,
  error: null,
}

const mockUpdateStepMutation = {
  mutateAsync: vi.fn(),
  isLoading: false,
  error: null,
}

const mockGetMyApplicationQuery = {
  data: undefined,
  isLoading: false,
  isError: false,
}

vi.mock('@app/core/utils/api', () => ({
  api: {
    applications: {
      submit: {
        useMutation: () => mockSubmitMutation,
      },
      updateStep: {
        useMutation: () => mockUpdateStepMutation,
      },
    },
    jobs: {
      updateApplication: {
        useMutation: () => mockUpdateMutation,
      },
      getMyApplicationForJob: {
        useQuery: () => mockGetMyApplicationQuery,
      },
    },
  },
}))

describe('useApplicationForm', () => {
  const jobId = 'job-123'

  beforeEach(() => {
    vi.clearAllMocks()
    mockSubmitMutation.mutateAsync.mockResolvedValue({ id: 'app-123' })
    mockUpdateStepMutation.mutateAsync.mockResolvedValue({ success: true })
    mockUpdateMutation.mutateAsync.mockResolvedValue({ success: true })
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useApplicationForm(jobId))

    expect(result.current.currentStep).toBe('screening')
    expect(result.current.completedSteps).toEqual([])
    expect(result.current.screeningAnswers).toEqual({})
    expect(result.current.customQuestionAnswers).toEqual([])
    expect(result.current.attachments).toEqual({})
    expect(result.current.isDirty).toBe(false)
  })

  it('updates screening answers', () => {
    const { result } = renderHook(() => useApplicationForm(jobId))

    act(() => {
      result.current.updateScreeningAnswers({
        current_location: 'New York',
        willing_to_relocate: true,
      })
    })

    expect(result.current.screeningAnswers.current_location).toBe('New York')
    expect(result.current.screeningAnswers.willing_to_relocate).toBe(true)
    expect(result.current.isDirty).toBe(true)
  })

  it('updates custom question answers', () => {
    const { result } = renderHook(() => useApplicationForm(jobId))

    const answers: CustomQuestionAnswer[] = [
      {
        question_id: 'q1',
        question: 'Test question',
        type: 'long_text',
        answer: 'Test answer',
      },
    ]

    act(() => {
      result.current.updateCustomQuestionAnswers(answers)
    })

    expect(result.current.customQuestionAnswers).toEqual(answers)
    expect(result.current.isDirty).toBe(true)
  })

  it('updates attachments', () => {
    const { result } = renderHook(() => useApplicationForm(jobId))

    const metadata: AttachmentMetadata = {
      path: 'applications/resume.pdf',
      filename: 'resume.pdf',
      size: 1024000,
      mime_type: 'application/pdf',
      uploaded_at: '2024-01-01T00:00:00Z',
    }

    act(() => {
      result.current.updateAttachments('resume', metadata)
    })

    expect(result.current.attachments.resume).toEqual(metadata)
    expect(result.current.isDirty).toBe(true)
  })

  it('navigates to next step', async () => {
    const { result } = renderHook(() => useApplicationForm(jobId))

    await act(async () => {
      await result.current.nextStep('custom_questions')
    })

    expect(result.current.currentStep).toBe('custom_questions')
    expect(result.current.completedSteps).toContain('screening')
  })

  it('navigates to previous step', async () => {
    const { result } = renderHook(() => useApplicationForm(jobId))

    // First go to next step
    await act(async () => {
      await result.current.nextStep('attachments')
    })

    // Then go back
    await act(async () => {
      await result.current.previousStep('screening')
    })

    expect(result.current.currentStep).toBe('screening')
  })

  it('creates draft application when saving progress without applicationId', async () => {
    const { result } = renderHook(() => useApplicationForm(jobId))

    act(() => {
      result.current.updateScreeningAnswers({
        current_location: 'New York',
      })
    })

    await act(async () => {
      await result.current.saveProgress()
    })

    expect(mockSubmitMutation.mutateAsync).toHaveBeenCalled()
    expect(result.current.applicationId).toBe('app-123')
  })

  it('submits application successfully', async () => {
    const { result } = renderHook(() => useApplicationForm(jobId))

    act(() => {
      result.current.updateScreeningAnswers({
        current_location: 'New York',
        willing_to_relocate: true,
        years_experience: 5,
        is_authorized_to_work: true,
        earliest_start_date: 'Immediately',
      })
    })

    await act(async () => {
      const submitResult = await result.current.submitApplication()
      expect(submitResult.success).toBe(true)
      expect(submitResult.applicationId).toBe('app-123')
    })

    expect(mockSubmitMutation.mutateAsync).toHaveBeenCalled()
  })

  it('handles edit mode with existing applicationId', () => {
    const existingAppId = 'existing-app-123'
    const { result } = renderHook(() => useApplicationForm(jobId, existingAppId))

    expect(result.current.applicationId).toBe(existingAppId)
    expect(result.current.isEditMode).toBe(true)
  })

  it('resets form state', () => {
    const { result } = renderHook(() => useApplicationForm(jobId))

    act(() => {
      result.current.updateScreeningAnswers({
        current_location: 'New York',
      })
      result.current.nextStep('attachments')
    })

    act(() => {
      result.current.reset()
    })

    expect(result.current.currentStep).toBe('screening')
    expect(result.current.screeningAnswers).toEqual({})
    expect(result.current.isDirty).toBe(false)
  })
})

