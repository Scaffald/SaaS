import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const refreshSession = vi.fn()

vi.mock('@scf/core/utils/supabase/client', () => ({
  supabase: { auth: { get refreshSession() { return refreshSession } } },
}))

import {
  requestSessionRefresh,
  resetSessionRefreshStateForTests,
} from '../requestSessionRefresh'

describe('requestSessionRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    refreshSession.mockReset()
    refreshSession.mockResolvedValue({ data: { session: {} }, error: null })
    resetSessionRefreshStateForTests()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // The regression: one page load fanned out ~20 queries, seven 401'd, and the
  // browser issued nine POST /auth/v1/token in response (#579).
  it('collapses a burst of concurrent 401s into one refresh', async () => {
    let resolveRefresh: (value: unknown) => void = () => {}
    refreshSession.mockReturnValue(
      new Promise((resolve) => {
        resolveRefresh = resolve
      })
    )

    const calls = Array.from({ length: 20 }, () => requestSessionRefresh())
    resolveRefresh({ data: { session: {} }, error: null })
    await Promise.all(calls)

    expect(refreshSession).toHaveBeenCalledTimes(1)
  })

  it('does not attempt again inside the cooldown', async () => {
    await requestSessionRefresh()
    await requestSessionRefresh()
    await requestSessionRefresh()

    expect(refreshSession).toHaveBeenCalledTimes(1)
  })

  it('allows another attempt once the cooldown lapses', async () => {
    await requestSessionRefresh()
    vi.advanceTimersByTime(10_001)
    await requestSessionRefresh()

    expect(refreshSession).toHaveBeenCalledTimes(2)
  })

  // A dead refresh token must not turn a screenful of failing queries into a
  // request loop, and must not reject into a react-query error handler.
  it('swallows a failing refresh and still holds the cooldown', async () => {
    refreshSession.mockRejectedValue(new Error('refresh token revoked'))

    await expect(requestSessionRefresh()).resolves.toBeUndefined()
    await requestSessionRefresh()

    expect(refreshSession).toHaveBeenCalledTimes(1)
  })

  it('releases the lock so a later failure can retry', async () => {
    refreshSession.mockRejectedValueOnce(new Error('transient'))
    await requestSessionRefresh()

    vi.advanceTimersByTime(10_001)
    refreshSession.mockResolvedValue({ data: { session: {} }, error: null })
    await requestSessionRefresh()

    expect(refreshSession).toHaveBeenCalledTimes(2)
  })
})
