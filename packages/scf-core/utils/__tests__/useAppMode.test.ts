import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = new Map<string, string>()
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(async (k: string) => store.get(k) ?? null),
    setItem: vi.fn(async (k: string, v: string) => {
      store.set(k, v)
    }),
    removeItem: vi.fn(async (k: string) => {
      store.delete(k)
    }),
    multiRemove: vi.fn(async (keys: string[]) => {
      for (const k of keys) store.delete(k)
    }),
  },
}))

type AuthCallback = (event: string, session: { user: { id: string } } | null) => void
let authCallback: AuthCallback | null = null
vi.mock('@scf/core/utils/supabase/client', () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: AuthCallback) => {
        authCallback = cb
        return { data: { subscription: { unsubscribe: () => {} } } }
      },
    },
  },
}))

import { __resetAppModeForTests, useAppMode } from '../useAppMode'

const MODE_KEY = '@scaffald:app_mode'
const ORG_SLUG_KEY = '@scaffald:app_mode_org_slug'
const OWNER_KEY = '@scaffald:app_mode_owner'

const auth = (event: string, userId: string | null) =>
  act(() => {
    authCallback?.(event, userId ? { user: { id: userId } } : null)
  })

describe('useAppMode (#1354)', () => {
  beforeEach(() => {
    store.clear()
    authCallback = null
    __resetAppModeForTests()
  })

  it('restores a stored employer mode for the user who stored it', async () => {
    store.set(MODE_KEY, 'employer')
    store.set(ORG_SLUG_KEY, 'acme')
    store.set(OWNER_KEY, 'employer-1')
    const { result } = renderHook(() => useAppMode())
    await auth('INITIAL_SESSION', 'employer-1')
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.mode).toBe('employer')
    expect(result.current.orgSlug).toBe('acme')
  })

  it("ignores and removes another user's stored mode", async () => {
    store.set(MODE_KEY, 'employer')
    store.set(ORG_SLUG_KEY, 'acme')
    store.set(OWNER_KEY, 'employer-1')
    const { result } = renderHook(() => useAppMode())
    await auth('INITIAL_SESSION', 'worker-1')
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.mode).toBe('worker')
    expect(result.current.orgSlug).toBeNull()
    await waitFor(() => expect(store.has(MODE_KEY)).toBe(false))
    expect(store.has(ORG_SLUG_KEY)).toBe(false)
  })

  it('ignores a stored mode with no owner (written before owners were recorded)', async () => {
    store.set(MODE_KEY, 'employer')
    const { result } = renderHook(() => useAppMode())
    await auth('INITIAL_SESSION', 'worker-1')
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.mode).toBe('worker')
  })

  it('resets to worker and removes the keys on sign-out', async () => {
    const { result } = renderHook(() => useAppMode())
    await auth('INITIAL_SESSION', 'employer-1')
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(() => result.current.setAppMode('employer', 'acme'))
    expect(result.current.mode).toBe('employer')
    expect(store.get(OWNER_KEY)).toBe('employer-1')

    await auth('SIGNED_OUT', null)
    expect(result.current.mode).toBe('worker')
    expect(result.current.orgSlug).toBeNull()
    await waitFor(() => expect(store.size).toBe(0))
  })

  it('resets to worker when a different user signs in without a sign-out', async () => {
    const { result } = renderHook(() => useAppMode())
    await auth('INITIAL_SESSION', 'employer-1')
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(() => result.current.setAppMode('employer', 'acme'))

    await auth('SIGNED_IN', 'worker-1')
    expect(result.current.mode).toBe('worker')
    await waitFor(() => expect(store.has(MODE_KEY)).toBe(false))
  })

  it('keeps the mode across token refreshes for the same user', async () => {
    const { result } = renderHook(() => useAppMode())
    await auth('INITIAL_SESSION', 'employer-1')
    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await act(() => result.current.setAppMode('employer', 'acme'))

    await auth('TOKEN_REFRESHED', 'employer-1')
    expect(result.current.mode).toBe('employer')
    expect(store.get(MODE_KEY)).toBe('employer')
  })
})
