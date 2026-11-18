import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const createDraft = vi.fn()
const updateApp = vi.fn()

vi.mock('@scf/core/utils/jobs-sdk-hooks', () => ({
  useCreateJobApplicationMutation: () => ({
    mutateAsync: createDraft,
    isPending: false,
    error: null,
  }),
  useUpdateJobApplicationMutation: () => ({
    mutateAsync: updateApp,
    isPending: false,
    error: null,
  }),
  useMyApplicationForJob: () => ({ data: undefined }),
}))

import { useApplicationForm } from '../useApplicationForm'

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
)

// Let the rejected promise and the state updates after it settle.
const flush = () => act(async () => {})

describe('useApplicationForm autosave (#1353)', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    createDraft.mockReset()
    updateApp.mockReset()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('does not retry a failed autosave until the next edit', async () => {
    createDraft.mockRejectedValue(new TypeError('Failed to fetch'))
    const { result } = renderHook(() => useApplicationForm('job-1'), { wrapper })

    act(() => result.current.updateScreeningAnswers({ current_location: 'A' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })
    await flush()
    expect(createDraft).toHaveBeenCalledTimes(1)
    expect(result.current.saveError).toBe('Failed to fetch')

    // It used to re-arm the 500 ms debounce and try again about once a second.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(35_000)
    })
    expect(createDraft).toHaveBeenCalledTimes(1)

    // The next edit turns autosave back on.
    createDraft.mockResolvedValue({ id: 'app-1' })
    act(() => result.current.updateScreeningAnswers({ current_location: 'AB' }))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(600)
    })
    await flush()
    expect(createDraft).toHaveBeenCalledTimes(2)
    expect(result.current.applicationId).toBe('app-1')
    expect(result.current.saveError).toBeNull()
  })
})
