import { beforeEach, describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'

const mockUseQuery = vi.fn()

vi.mock('@app/core/utils/api', () => ({
  api: {
    profile: {
      getStatus: {
        useQuery: (...args: unknown[]) => mockUseQuery(...args),
      },
    },
  },
}))

const loadHook = async () => {
  vi.resetModules()
  return await import('../useProfileCompletion')
}

describe('useProfileCompletion', () => {
  beforeEach(() => {
    mockUseQuery.mockReset()
  })

  it('maps API response to checklist metadata', async () => {
    mockUseQuery.mockReturnValue({
      data: {
        completionPercentage: 65,
        sectionProgress: [
          { id: 'general', title: 'General', completed: true },
          { id: 'skills', title: 'Skills', completed: false },
        ],
      },
      isLoading: false,
    })

    const { useProfileCompletion } = await loadHook()
    const { result } = renderHook(() => useProfileCompletion())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.completionData).toEqual(
      expect.objectContaining({
        completionPercentage: 65,
        totalComplete: 1,
        totalItems: 2,
        items: [
          expect.objectContaining({
            id: 'general',
            title: 'General',
            description: expect.stringContaining('name'),
            complete: true,
            actionRoute: expect.stringMatching(/profile/),
          }),
          expect.objectContaining({
            id: 'skills',
            complete: false,
          }),
        ],
      }),
    )
  })

  it('returns null completion data while loading', async () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    })

    const { useProfileCompletion } = await loadHook()
    const { result } = renderHook(() => useProfileCompletion())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.completionData).toBeNull()
  })
})
