import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCompletionNudges } from '../useCompletionNudges'

const mockGetPersonalizedBenefitsQuery = {
  data: undefined,
  isLoading: false,
  refetch: vi.fn().mockResolvedValue({}),
}

vi.mock('@app/core/utils/api', () => ({
  api: {
    profile: {
      getPersonalizedBenefits: {
        useQuery: vi.fn(() => mockGetPersonalizedBenefitsQuery),
      },
    },
  },
}))

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

describe('useCompletionNudges', () => {
  beforeEach(() => {
    mockGetPersonalizedBenefitsQuery.data = undefined
    mockGetPersonalizedBenefitsQuery.isLoading = false
    mockGetPersonalizedBenefitsQuery.refetch.mockClear()
    sessionStorageMock.clear()
  })

  it('returns null currentBenefit when no benefits available', () => {
    mockGetPersonalizedBenefitsQuery.data = { benefits: [] }

    const { result } = renderHook(() => useCompletionNudges())

    expect(result.current.currentBenefit).toBeNull()
    expect(result.current.totalCount).toBe(0)
    expect(result.current.hasMultiple).toBe(false)
  })

  it('returns first benefit when benefits are available', () => {
    const benefits = [
      {
        id: 'benefit-1',
        title: 'Add Skills',
        description: 'Users with more skills receive more matches.',
        relatedSection: 'skills',
        userType: 'worker' as const,
        opportunityCount: 3,
      },
    ]

    mockGetPersonalizedBenefitsQuery.data = { benefits }

    const { result } = renderHook(() => useCompletionNudges())

    expect(result.current.currentBenefit).toEqual(benefits[0])
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.totalCount).toBe(1)
    expect(result.current.hasMultiple).toBe(false)
  })

  it('rotates through multiple benefits with advanceMessage', () => {
    const benefits = [
      {
        id: 'benefit-1',
        title: 'Add Skills',
        description: 'Description 1',
        relatedSection: 'skills',
        userType: 'worker' as const,
        opportunityCount: 3,
      },
      {
        id: 'benefit-2',
        title: 'Add Experience',
        description: 'Description 2',
        relatedSection: 'experience',
        userType: 'worker' as const,
        opportunityCount: 5,
      },
      {
        id: 'benefit-3',
        title: 'Add Certifications',
        description: 'Description 3',
        relatedSection: 'certifications',
        userType: 'worker' as const,
        opportunityCount: 2,
      },
    ]

    mockGetPersonalizedBenefitsQuery.data = { benefits }

    const { result } = renderHook(() => useCompletionNudges())

    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentBenefit?.id).toBe('benefit-1')

    act(() => {
      result.current.advanceMessage()
    })

    expect(result.current.currentIndex).toBe(1)
    expect(result.current.currentBenefit?.id).toBe('benefit-2')

    act(() => {
      result.current.advanceMessage()
    })

    expect(result.current.currentIndex).toBe(2)
    expect(result.current.currentBenefit?.id).toBe('benefit-3')

    act(() => {
      result.current.advanceMessage()
    })

    // Should wrap around to first
    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentBenefit?.id).toBe('benefit-1')
  })

  it('rotates backwards through benefits with retreatMessage', () => {
    const benefits = [
      {
        id: 'benefit-1',
        title: 'Add Skills',
        description: 'Description 1',
        relatedSection: 'skills',
        userType: 'worker' as const,
        opportunityCount: 3,
      },
      {
        id: 'benefit-2',
        title: 'Add Experience',
        description: 'Description 2',
        relatedSection: 'experience',
        userType: 'worker' as const,
        opportunityCount: 5,
      },
    ]

    mockGetPersonalizedBenefitsQuery.data = { benefits }

    const { result } = renderHook(() => useCompletionNudges())

    expect(result.current.currentIndex).toBe(0)

    act(() => {
      result.current.retreatMessage()
    })

    // Should wrap around to last
    expect(result.current.currentIndex).toBe(1)
    expect(result.current.currentBenefit?.id).toBe('benefit-2')
  })

  it('handles goToMessage', () => {
    const benefits = [
      {
        id: 'benefit-1',
        title: 'Add Skills',
        description: 'Description 1',
        relatedSection: 'skills',
        userType: 'worker' as const,
        opportunityCount: 3,
      },
      {
        id: 'benefit-2',
        title: 'Add Experience',
        description: 'Description 2',
        relatedSection: 'experience',
        userType: 'worker' as const,
        opportunityCount: 5,
      },
      {
        id: 'benefit-3',
        title: 'Add Certifications',
        description: 'Description 3',
        relatedSection: 'certifications',
        userType: 'worker' as const,
        opportunityCount: 2,
      },
    ]

    mockGetPersonalizedBenefitsQuery.data = { benefits }

    const { result } = renderHook(() => useCompletionNudges())

    act(() => {
      result.current.goToMessage(2)
    })

    expect(result.current.currentIndex).toBe(2)
    expect(result.current.currentBenefit?.id).toBe('benefit-3')

    act(() => {
      result.current.goToMessage(0)
    })

    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentBenefit?.id).toBe('benefit-1')
  })

  it('clamps goToMessage index to valid range', () => {
    const benefits = [
      {
        id: 'benefit-1',
        title: 'Add Skills',
        description: 'Description 1',
        relatedSection: 'skills',
        userType: 'worker' as const,
        opportunityCount: 3,
      },
    ]

    mockGetPersonalizedBenefitsQuery.data = { benefits }

    const { result } = renderHook(() => useCompletionNudges())

    act(() => {
      result.current.goToMessage(-1)
    })

    expect(result.current.currentIndex).toBe(0)

    act(() => {
      result.current.goToMessage(10)
    })

    expect(result.current.currentIndex).toBe(0)
  })

  it('stores current benefit ID in sessionStorage', async () => {
    const benefits = [
      {
        id: 'benefit-1',
        title: 'Add Skills',
        description: 'Description 1',
        relatedSection: 'skills',
        userType: 'worker' as const,
        opportunityCount: 3,
      },
      {
        id: 'benefit-2',
        title: 'Add Experience',
        description: 'Description 2',
        relatedSection: 'experience',
        userType: 'worker' as const,
        opportunityCount: 5,
      },
    ]

    mockGetPersonalizedBenefitsQuery.data = { benefits }

    const { result } = renderHook(() => useCompletionNudges())

    await waitFor(() => {
      expect(sessionStorageMock.getItem('profile_completion_last_benefit_id')).toBe('benefit-1')
    })

    act(() => {
      result.current.advanceMessage()
    })

    await waitFor(() => {
      expect(sessionStorageMock.getItem('profile_completion_last_benefit_id')).toBe('benefit-2')
    })
  })

  it('restores benefit from sessionStorage on mount', () => {
    sessionStorageMock.setItem('profile_completion_last_benefit_id', 'benefit-2')

    const benefits = [
      {
        id: 'benefit-1',
        title: 'Add Skills',
        description: 'Description 1',
        relatedSection: 'skills',
        userType: 'worker' as const,
        opportunityCount: 3,
      },
      {
        id: 'benefit-2',
        title: 'Add Experience',
        description: 'Description 2',
        relatedSection: 'experience',
        userType: 'worker' as const,
        opportunityCount: 5,
      },
    ]

    mockGetPersonalizedBenefitsQuery.data = { benefits }

    const { result } = renderHook(() => useCompletionNudges())

    expect(result.current.currentIndex).toBe(1)
    expect(result.current.currentBenefit?.id).toBe('benefit-2')
  })

  it('handles loading state', () => {
    mockGetPersonalizedBenefitsQuery.isLoading = true

    const { result } = renderHook(() => useCompletionNudges())

    expect(result.current.isLoading).toBe(true)
  })

  it('does not advance when no benefits available', () => {
    mockGetPersonalizedBenefitsQuery.data = { benefits: [] }

    const { result } = renderHook(() => useCompletionNudges())

    act(() => {
      result.current.advanceMessage()
    })

    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentBenefit).toBeNull()
  })

  it('does not retreat when no benefits available', () => {
    mockGetPersonalizedBenefitsQuery.data = { benefits: [] }

    const { result } = renderHook(() => useCompletionNudges())

    act(() => {
      result.current.retreatMessage()
    })

    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentBenefit).toBeNull()
  })

  it('does not goToMessage when no benefits available', () => {
    mockGetPersonalizedBenefitsQuery.data = { benefits: [] }

    const { result } = renderHook(() => useCompletionNudges())

    act(() => {
      result.current.goToMessage(1)
    })

    expect(result.current.currentIndex).toBe(0)
    expect(result.current.currentBenefit).toBeNull()
  })
})

