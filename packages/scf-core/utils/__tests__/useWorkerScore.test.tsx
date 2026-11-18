import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getUserProfile = vi.fn()
vi.mock('../jobs-sdk-context', () => ({
  useScaffaldJobsClient: () => ({ userProfiles: { getUserProfile } }),
}))

import { useWorkerScore } from '../user-profiles-sdk-hooks'

const wrapper = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
}

// The profile shows the score Find talent shows (#1355): gamified_score, not
// the community reputation figure that starts everyone at 100.
describe('useWorkerScore', () => {
  beforeEach(() => getUserProfile.mockReset())

  it("is the profile's gamified_score", async () => {
    getUserProfile.mockResolvedValue({ id: 'u1', gamified_score: 70 })
    const { result } = renderHook(() => useWorkerScore('u1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.score).toBe(70))
    expect(getUserProfile).toHaveBeenCalledWith({ userId: 'u1' })
  })

  it('is null, not a stand-in, when there is no score or the read fails', async () => {
    getUserProfile.mockResolvedValue({ id: 'u1', gamified_score: null })
    const none = renderHook(() => useWorkerScore('u1'), { wrapper: wrapper() })
    await waitFor(() => expect(none.result.current.isSuccess).toBe(true))
    expect(none.result.current.score).toBeNull()

    getUserProfile.mockRejectedValue(new Error('404'))
    const failed = renderHook(() => useWorkerScore('u2'), { wrapper: wrapper() })
    await waitFor(() => expect(failed.result.current.isError).toBe(true))
    expect(failed.result.current.score).toBeNull()
  })

  it('stays on the 0–100 scale the talent list uses', async () => {
    getUserProfile.mockResolvedValue({ id: 'u1', gamified_score: 130 })
    const { result } = renderHook(() => useWorkerScore('u1'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.score).toBe(100))
  })

  it('does not fetch without a user', () => {
    const { result } = renderHook(() => useWorkerScore(undefined), { wrapper: wrapper() })
    expect(result.current.score).toBeNull()
    expect(getUserProfile).not.toHaveBeenCalled()
  })
})
