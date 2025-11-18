import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useProfileWizard } from '../useProfileWizard'

const mockGetProgressQuery = {
  data: undefined as unknown,
  isLoading: false,
  isError: false,
  refetch: vi.fn().mockResolvedValue({}),
}

const mockSaveStepMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
}

const mockCompleteMutation = {
  mutateAsync: vi.fn(),
  isPending: false,
}

const mockUtils = {
  getProgress: {
    invalidate: vi.fn().mockResolvedValue(undefined),
  },
}

vi.mock('@app/core/utils/api', () => ({
  api: {
    profileWizard: {
      getProgress: {
        useQuery: vi.fn(() => mockGetProgressQuery),
      },
      saveStep: {
        useMutation: vi.fn(() => mockSaveStepMutation),
      },
      complete: {
        useMutation: vi.fn(() => mockCompleteMutation),
      },
    },
    useUtils: vi.fn(() => ({
      profileWizard: mockUtils,
    })),
  },
}))

describe('useProfileWizard', () => {
  beforeEach(() => {
    mockGetProgressQuery.data = undefined
    mockGetProgressQuery.isLoading = false
    mockGetProgressQuery.isError = false
    mockGetProgressQuery.refetch.mockClear()
    mockSaveStepMutation.mutateAsync.mockClear()
    mockCompleteMutation.mutateAsync.mockClear()
    mockUtils.getProgress.invalidate.mockClear()
  })

  it('initializes with default progress', () => {
    const { result } = renderHook(() => useProfileWizard())

    expect(result.current.state.currentStep).toBe('general')
    expect(result.current.state.progress.completionPercentage).toBe(0)
    expect(result.current.state.progress.completedSteps).toEqual([])
    expect(result.current.state.stepData).toEqual({})
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it('initializes with custom initial step', () => {
    const { result } = renderHook(() => useProfileWizard('skills'))

    expect(result.current.state.currentStep).toBe('skills')
  })

  it('loads saved progress from API', async () => {
    const savedProgress: unknown = {
      currentStep: 'experience' as const,
      completedSteps: ['general', 'skills'],
      completionPercentage: 35,
      lastSavedAt: '2025-01-01T12:00:00Z',
      requiredSteps: ['general', 'skills', 'experience'],
      stepData: {
        general: {
          firstName: 'John',
          lastName: 'Doe',
          headline: 'Electrician',
          bio: 'Test bio',
        },
      },
    }

    mockGetProgressQuery.data = savedProgress

    const { result } = renderHook(() => useProfileWizard())

    await waitFor(() => {
      expect(result.current.state.currentStep).toBe('experience')
      expect(result.current.state.progress.completedSteps).toEqual(['general', 'skills'])
      expect(result.current.state.progress.completionPercentage).toBe(35)
      expect(result.current.state.stepData.general).toEqual(savedProgress.stepData.general)
    })
  })

  it('handles step navigation with goNext', () => {
    const { result } = renderHook(() => useProfileWizard())

    act(() => {
      result.current.goNext()
    })

    expect(result.current.state.currentStep).toBe('skills')
  })

  it('handles step navigation with goBack', () => {
    const { result } = renderHook(() => useProfileWizard('skills'))

    act(() => {
      result.current.goBack()
    })

    expect(result.current.state.currentStep).toBe('general')
  })

  it('does not go before first step', () => {
    const { result } = renderHook(() => useProfileWizard('general'))

    act(() => {
      result.current.goBack()
    })

    expect(result.current.state.currentStep).toBe('general')
  })

  it('does not go after last step', () => {
    const { result } = renderHook(() => useProfileWizard('education'))

    act(() => {
      result.current.goNext()
    })

    expect(result.current.state.currentStep).toBe('education')
  })

  it('handles goToStep', () => {
    const { result } = renderHook(() => useProfileWizard())

    act(() => {
      result.current.goToStep('certifications')
    })

    expect(result.current.state.currentStep).toBe('certifications')
  })

  it('saves step data correctly', async () => {
    const saveResponse = {
      currentStep: 'skills' as const,
      completedSteps: ['general'],
      completionPercentage: 20,
      lastSavedAt: '2025-01-01T12:00:00Z',
      requiredSteps: ['general', 'skills', 'experience'],
      stepData: {
        general: {
          firstName: 'John',
          lastName: 'Doe',
          headline: 'Electrician',
          bio: 'Test bio',
        },
      },
    }

    mockSaveStepMutation.mutateAsync.mockResolvedValue(saveResponse)

    const { result } = renderHook(() => useProfileWizard())

    await act(async () => {
      await result.current.saveStep({
        step: 'general',
        data: {
          firstName: 'John',
          lastName: 'Doe',
          headline: 'Electrician',
          bio: 'Test bio',
        },
      })
    })

    expect(mockSaveStepMutation.mutateAsync).toHaveBeenCalledWith({
      step: 'general',
      data: {
        firstName: 'John',
        lastName: 'Doe',
        headline: 'Electrician',
        bio: 'Test bio',
      },
    })

    await waitFor(() => {
      expect(result.current.state.progress.completedSteps).toEqual(['general'])
      expect(result.current.state.progress.completionPercentage).toBe(20)
      expect(result.current.state.stepData.general).toEqual(saveResponse.stepData.general)
      expect(mockUtils.getProgress.invalidate).toHaveBeenCalled()
    })
  })

  it('sets isSaving during save operation', async () => {
    let resolveSave: (value: unknown) => void
    const savePromise = new Promise((resolve) => {
      resolveSave = resolve
    })

    mockSaveStepMutation.mutateAsync.mockReturnValue(savePromise)

    const { result } = renderHook(() => useProfileWizard())

    act(() => {
      result.current
        .saveStep({
          step: 'general',
          data: {
            firstName: 'John',
            lastName: 'Doe',
            headline: 'Electrician',
            bio: 'Test bio',
          },
        })
        .catch(() => {})
    })

    expect(result.current.state.isSaving).toBe(true)

    await act(async () => {
      resolveSave!({
        currentStep: 'general' as const,
        completedSteps: [],
        completionPercentage: 0,
        lastSavedAt: null,
        requiredSteps: ['general', 'skills', 'experience'],
        stepData: {},
      })
      await savePromise
    })

    await waitFor(() => {
      expect(result.current.state.isSaving).toBe(false)
    })
  })

  it('handles wizard completion', async () => {
    const completeResponse = {
      currentStep: 'education' as const,
      completedSteps: ['general', 'skills', 'experience', 'certifications', 'preferences', 'education'],
      completionPercentage: 100,
      lastSavedAt: '2025-01-01T12:00:00Z',
      requiredSteps: ['general', 'skills', 'experience'],
      stepData: {},
    }

    mockCompleteMutation.mutateAsync.mockResolvedValue(completeResponse)

    const { result } = renderHook(() => useProfileWizard())

    await act(async () => {
      await result.current.completeWizard({ celebrate: true })
    })

    expect(mockCompleteMutation.mutateAsync).toHaveBeenCalledWith({
      celebrate: true,
    })

    await waitFor(() => {
      expect(result.current.state.progress.completionPercentage).toBe(100)
      expect(result.current.state.progress.completedSteps).toHaveLength(6)
      expect(result.current.state.isCompleting).toBe(false)
      expect(mockUtils.getProgress.invalidate).toHaveBeenCalled()
    })
  })

  it('sets isCompleting during completion', async () => {
    let resolveComplete: (value: unknown) => void
    const completePromise = new Promise((resolve) => {
      resolveComplete = resolve
    })

    mockCompleteMutation.mutateAsync.mockReturnValue(completePromise)

    const { result } = renderHook(() => useProfileWizard())

    act(() => {
      result.current.completeWizard().catch(() => {})
    })

    expect(result.current.state.isCompleting).toBe(true)

    await act(async () => {
      resolveComplete!({
        currentStep: 'education' as const,
        completedSteps: [],
        completionPercentage: 100,
        lastSavedAt: null,
        requiredSteps: ['general', 'skills', 'experience'],
        stepData: {},
      })
      await completePromise
    })

    await waitFor(() => {
      expect(result.current.state.isCompleting).toBe(false)
    })
  })

  it('handles markStepSkipped', () => {
    const { result } = renderHook(() => useProfileWizard())

    // First, set up some completed steps
    act(() => {
      result.current.state.progress.completedSteps = ['general', 'skills']
    })

    act(() => {
      result.current.markStepSkipped('skills')
    })

    expect(result.current.state.progress.completedSteps).not.toContain('skills')
    expect(result.current.state.progress.completedSteps).toContain('general')
  })

  it('handles refresh', async () => {
    const { result } = renderHook(() => useProfileWizard())

    await act(async () => {
      await result.current.refresh()
    })

    expect(mockGetProgressQuery.refetch).toHaveBeenCalled()
  })

  it('handles loading state', () => {
    mockGetProgressQuery.isLoading = true

    const { result } = renderHook(() => useProfileWizard())

    expect(result.current.isLoading).toBe(true)
  })

  it('handles error state', () => {
    mockGetProgressQuery.isError = true

    const { result } = renderHook(() => useProfileWizard())

    expect(result.current.isError).toBe(true)
  })

  it('preserves initial step when data loads if step is valid', async () => {
    const savedProgress: unknown = {
      currentStep: 'experience' as const,
      completedSteps: [],
      completionPercentage: 0,
      lastSavedAt: null,
      requiredSteps: ['general', 'skills', 'experience'],
      stepData: {},
    }

    mockGetProgressQuery.data = savedProgress

    const { result } = renderHook(() => useProfileWizard('skills'))

    await waitFor(() => {
      expect(result.current.state.currentStep).toBe('skills')
    })
  })

  it('uses saved currentStep when initial step is invalid', async () => {
    const savedProgress: unknown = {
      currentStep: 'experience' as const,
      completedSteps: [],
      completionPercentage: 0,
      lastSavedAt: null,
      requiredSteps: ['general', 'skills', 'experience'],
      stepData: {},
    }

    mockGetProgressQuery.data = savedProgress

    const { result } = renderHook(() => useProfileWizard('invalid-step' as any))

    await waitFor(() => {
      expect(result.current.state.currentStep).toBe('experience')
    })
  })

  it('returns ordered steps', () => {
    const { result } = renderHook(() => useProfileWizard())

    expect(result.current.orderedSteps).toEqual([
      'general',
      'skills',
      'experience',
      'certifications',
      'preferences',
      'education',
    ])
  })

  it('updates lastSavedAt when progress is saved', async () => {
    const saveResponse = {
      currentStep: 'general' as const,
      completedSteps: [],
      completionPercentage: 0,
      lastSavedAt: '2025-01-01T12:00:00Z',
      requiredSteps: ['general', 'skills', 'experience'],
      stepData: {},
    }

    mockSaveStepMutation.mutateAsync.mockResolvedValue(saveResponse)

    const { result } = renderHook(() => useProfileWizard())

    await act(async () => {
      await result.current.saveStep({
        step: 'general',
        data: {
          firstName: 'John',
          lastName: 'Doe',
          headline: 'Electrician',
          bio: 'Test bio',
        },
      })
    })

    await waitFor(() => {
      expect(result.current.state.lastSavedAt).toBeInstanceOf(Date)
      expect(result.current.state.lastSavedAt?.toISOString()).toBe('2025-01-01T12:00:00.000Z')
    })
  })
})

