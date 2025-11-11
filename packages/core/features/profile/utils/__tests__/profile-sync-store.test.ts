import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'

const loadStore = async () => {
  vi.resetModules()
  return await import('../profile-sync-store')
}

describe('profile-sync-store', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date'] })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('tracks start and completion of sync operations', async () => {
    const store = await loadStore()
    const { result } = renderHook(() => store.useProfileSyncStatus())

    expect(result.current).toBe('idle')

    act(() => {
      store.startProfileSync()
    })

    expect(result.current).toBe('syncing')

    act(() => {
      store.completeProfileSync()
    })

    expect(result.current).toBe('idle')
  })

  it('surfaces failures and allows resetting error state', async () => {
    const store = await loadStore()
    const { result } = renderHook(() => store.useProfileSyncStatus())

    act(() => {
      store.startProfileSync()
      store.failProfileSync()
    })

    expect(result.current).toBe('error')

    act(() => {
      store.resetProfileSyncError()
    })

    expect(result.current).toBe('idle')
  })

  it('delays visible syncing state until threshold elapses', async () => {
    const store = await loadStore()
    const { result } = renderHook(() => store.useAdaptiveProfileSync(200))

    expect(result.current).toBe('idle')

    act(() => {
      store.startProfileSync()
    })

    expect(result.current).toBe('idle')

    act(() => {
      vi.advanceTimersByTime(200)
    })

    expect(result.current).toBe('syncing')

    act(() => {
      store.completeProfileSync()
    })

    expect(result.current).toBe('idle')
  })
})
