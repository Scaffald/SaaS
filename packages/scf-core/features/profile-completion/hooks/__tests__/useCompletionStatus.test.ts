import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useCompletionStatus } from '../useCompletionStatus'
import { TestQueryWrapper } from '@test-helpers/test-utils'

// SDK hook return shape uses `isPending` (the wrapper destructures
// isPending → isLoading). Tests that toggle the "loading" state must
// set isPending, not isLoading.
const mockGetStatusQuery = {
  data: undefined as unknown,
  isPending: false,
  isError: false,
  refetch: vi.fn().mockResolvedValue({}),
}

const mockUser = {
  user_metadata: {
    type: 'worker',
  },
}

// Hook now delegates to '@scf/core/utils/profile-completion-sdk-hooks'.
vi.mock('@scf/core/utils/profile-completion-sdk-hooks', () => ({
  useCompletionStatus: vi.fn(() => mockGetStatusQuery),
}))

vi.mock('@scf/core/utils/useUser', () => ({
  useUser: () => ({ user: mockUser }),
}))

vi.mock('../constants/sectionMetadata', () => ({
  resolveSectionMetadata: (sectionId: string) => ({
    id: sectionId,
    title: `${sectionId} Title`,
    description: `${sectionId} description`,
    route: `/profile/${sectionId}`,
  }),
}))

describe('useCompletionStatus', () => {
  beforeEach(() => {
    mockGetStatusQuery.data = undefined
    mockGetStatusQuery.isPending = false
    mockGetStatusQuery.isError = false
    mockGetStatusQuery.refetch.mockClear()
  })

  it('returns null status when data is loading', () => {
    mockGetStatusQuery.isPending = true

    const { result } = renderHook(() => useCompletionStatus(), { wrapper: TestQueryWrapper })

    expect(result.current.status).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('returns null status when data is undefined', () => {
    const { result } = renderHook(() => useCompletionStatus(), { wrapper: TestQueryWrapper })

    expect(result.current.status).toBeNull()
  })

  it('maps raw API response to CompletionStatus', () => {
    const rawStatus: unknown = {
      sectionProgress: [
        {
          id: 'general',
          title: 'General Info',
          completed: true,
          weight: 20,
          missingFields: [],
        },
        {
          id: 'skills',
          title: 'Skills',
          completed: false,
          weight: 20,
          missingFields: ['skill1'],
        },
      ],
      milestoneBadges: [
        {
          id: '25',
          threshold: 25,
          achieved: true,
          reachedAt: '2025-01-01T12:00:00Z',
        },
        {
          id: '50',
          threshold: 50,
          achieved: false,
          reachedAt: null,
        },
      ],
      completionPercentage: 30,
      incompleteSections: ['skills'],
      summary: {
        completedWeight: 20,
        remainingWeight: 80,
        nextMilestone: 50,
      },
      updatedAt: '2025-01-01T12:00:00Z',
      nudgeStatus: {
        shouldPrompt: true,
        lastDismissedAt: null,
        dismissed: {},
      },
    }

    mockGetStatusQuery.data = rawStatus

    const { result } = renderHook(() => useCompletionStatus(), { wrapper: TestQueryWrapper })

    expect(result.current.status).not.toBeNull()
    expect(result.current.status?.completionPercentage).toBe(30)
    expect(result.current.status?.sections).toHaveLength(2)
    expect(result.current.status?.sections[0]?.completed).toBe(true)
    expect(result.current.status?.sections[1]?.completed).toBe(false)
    expect(result.current.status?.incompleteSections).toEqual(['skills'])
  })

  it('calculates section progress correctly', () => {
    const rawStatus: unknown = {
      sectionProgress: [
        {
          id: 'general',
          title: 'General Info',
          completed: true,
          weight: 20,
          missingFields: [],
        },
        {
          id: 'skills',
          title: 'Skills',
          completed: true,
          weight: 20,
          missingFields: [],
        },
      ],
      milestoneBadges: [],
      completionPercentage: 40,
      incompleteSections: [],
      updatedAt: '2025-01-01T12:00:00Z',
      nudgeStatus: {
        shouldPrompt: false,
        lastDismissedAt: null,
        dismissed: {},
      },
    }

    mockGetStatusQuery.data = rawStatus

    const { result } = renderHook(() => useCompletionStatus(), { wrapper: TestQueryWrapper })

    expect(result.current.status?.sections.filter((s) => s.completed)).toHaveLength(2)
  })

  it('identifies incomplete sections', () => {
    const rawStatus: unknown = {
      sectionProgress: [
        {
          id: 'general',
          title: 'General Info',
          completed: true,
          weight: 20,
          missingFields: [],
        },
        {
          id: 'skills',
          title: 'Skills',
          completed: false,
          weight: 20,
          missingFields: ['skill1'],
        },
        {
          id: 'experience',
          title: 'Experience',
          completed: false,
          weight: 20,
          missingFields: ['jobTitle'],
        },
      ],
      milestoneBadges: [],
      completionPercentage: 20,
      incompleteSections: ['skills', 'experience'],
      updatedAt: '2025-01-01T12:00:00Z',
      nudgeStatus: {
        shouldPrompt: true,
        lastDismissedAt: null,
        dismissed: {},
      },
    }

    mockGetStatusQuery.data = rawStatus

    const { result } = renderHook(() => useCompletionStatus(), { wrapper: TestQueryWrapper })

    expect(result.current.status?.incompleteSections).toEqual(['skills', 'experience'])
  })

  it('tracks milestone badges', () => {
    const rawStatus: unknown = {
      sectionProgress: [],
      milestoneBadges: [
        {
          id: '25',
          threshold: 25,
          achieved: true,
          reachedAt: '2025-01-01T12:00:00Z',
        },
        {
          id: '50',
          threshold: 50,
          achieved: true,
          reachedAt: '2025-01-02T12:00:00Z',
        },
        {
          id: '75',
          threshold: 75,
          achieved: false,
          reachedAt: null,
        },
      ],
      completionPercentage: 55,
      incompleteSections: [],
      updatedAt: '2025-01-01T12:00:00Z',
      nudgeStatus: {
        shouldPrompt: false,
        lastDismissedAt: null,
        dismissed: {},
      },
    }

    mockGetStatusQuery.data = rawStatus

    const { result } = renderHook(() => useCompletionStatus(), { wrapper: TestQueryWrapper })

    expect(result.current.status?.milestoneBadges).toHaveLength(3)
    expect(result.current.status?.milestoneBadges[0]?.achieved).toBe(true)
    expect(result.current.status?.milestoneBadges[0]?.label).toBe('25% Complete')
    expect(result.current.status?.milestoneBadges[2]?.achieved).toBe(false)
  })

  it('handles loading state', () => {
    mockGetStatusQuery.isPending = true

    const { result } = renderHook(() => useCompletionStatus(), { wrapper: TestQueryWrapper })

    expect(result.current.isLoading).toBe(true)
  })

  it('handles error state', () => {
    mockGetStatusQuery.isError = true

    const { result } = renderHook(() => useCompletionStatus(), { wrapper: TestQueryWrapper })

    expect(result.current.isError).toBe(true)
  })

  it('sets modal mode to first-login when completion is 0%', () => {
    const rawStatus: unknown = {
      sectionProgress: [],
      milestoneBadges: [],
      completionPercentage: 0,
      incompleteSections: [],
      updatedAt: '2025-01-01T12:00:00Z',
      nudgeStatus: {
        shouldPrompt: true,
        lastDismissedAt: null,
        dismissed: {},
      },
    }

    mockGetStatusQuery.data = rawStatus

    const { result } = renderHook(() => useCompletionStatus(), { wrapper: TestQueryWrapper })

    expect(result.current.status?.modalMode).toBe('first-login')
  })

  it('sets modal mode to progress-reminder when completion > 0%', () => {
    const rawStatus: unknown = {
      sectionProgress: [],
      milestoneBadges: [],
      completionPercentage: 42,
      incompleteSections: [],
      updatedAt: '2025-01-01T12:00:00Z',
      nudgeStatus: {
        shouldPrompt: true,
        lastDismissedAt: null,
        dismissed: {},
      },
    }

    mockGetStatusQuery.data = rawStatus

    const { result } = renderHook(() => useCompletionStatus(), { wrapper: TestQueryWrapper })

    expect(result.current.status?.modalMode).toBe('progress-reminder')
  })

  it('calculates summary correctly', () => {
    const rawStatus: unknown = {
      sectionProgress: [
        {
          id: 'general',
          title: 'General',
          completed: true,
          weight: 20,
          missingFields: [],
        },
        {
          id: 'skills',
          title: 'Skills',
          completed: false,
          weight: 20,
          missingFields: [],
        },
      ],
      milestoneBadges: [],
      completionPercentage: 20,
      incompleteSections: ['skills'],
      summary: {
        completedWeight: 20,
        remainingWeight: 80,
        nextMilestone: 25,
      },
      updatedAt: '2025-01-01T12:00:00Z',
      nudgeStatus: {
        shouldPrompt: true,
        lastDismissedAt: null,
        dismissed: {},
      },
    }

    mockGetStatusQuery.data = rawStatus

    const { result } = renderHook(() => useCompletionStatus(), { wrapper: TestQueryWrapper })

    expect(result.current.status?.summary.completedWeight).toBe(20)
    expect(result.current.status?.summary.remainingWeight).toBe(80)
    expect(result.current.status?.summary.nextMilestone).toBe(25)
  })

  it('handles nudge status correctly', () => {
    const rawStatus: unknown = {
      sectionProgress: [],
      milestoneBadges: [],
      completionPercentage: 30,
      incompleteSections: [],
      updatedAt: '2025-01-01T12:00:00Z',
      nudgeStatus: {
        shouldPrompt: true,
        lastDismissedAt: '2025-01-01T10:00:00Z',
        dismissed: {
          modal: {
            dismissedAt: '2025-01-01T10:00:00Z',
            reason: 'user_action',
          },
        },
      },
    }

    mockGetStatusQuery.data = rawStatus

    const { result } = renderHook(() => useCompletionStatus(), { wrapper: TestQueryWrapper })

    expect(result.current.status?.nudgeStatus.shouldPrompt).toBe(true)
    expect(result.current.status?.nudgeStatus.lastDismissedAt).toBe('2025-01-01T10:00:00Z')
    expect(result.current.status?.nudgeStatus.dismissed).toHaveProperty('modal')
  })

  it('returns user type from user metadata', () => {
    const rawStatus: unknown = {
      sectionProgress: [],
      milestoneBadges: [],
      completionPercentage: 0,
      incompleteSections: [],
      updatedAt: '2025-01-01T12:00:00Z',
      nudgeStatus: {
        shouldPrompt: true,
        lastDismissedAt: null,
        dismissed: {},
      },
    }

    mockGetStatusQuery.data = rawStatus

    const { result } = renderHook(() => useCompletionStatus(), { wrapper: TestQueryWrapper })

    expect(result.current.userType).toBe('worker')
  })

})

