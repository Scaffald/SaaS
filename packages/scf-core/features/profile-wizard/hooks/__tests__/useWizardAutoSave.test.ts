import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useWizardAutoSave } from '../useWizardAutoSave'

const generalPayload = {
  firstName: 'Jane',
  lastName: 'Doe',
  headline: 'Licensed Electrician',
  bio: 'I keep the lights on.',
}

describe('useWizardAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it('debounces saves when enabled and dirty', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)
    const onSavingStateChange = vi.fn()

    const { rerender } = renderHook(
      (props) => useWizardAutoSave(props),
      {
        initialProps: {
          step: 'general' as const,
          payload: generalPayload,
          enabled: true,
          isDirty: true,
          debounceMs: 100,
          onSave,
          onSavingStateChange,
        },
      },
    )

    await act(async () => {
      vi.advanceTimersByTime(99)
    })

    expect(onSave).not.toHaveBeenCalled()

    await act(async () => {
      vi.advanceTimersByTime(1)
    })

    expect(onSavingStateChange).toHaveBeenNthCalledWith(1, true)
    expect(onSave).toHaveBeenCalledTimes(1)
    expect(onSave).toHaveBeenCalledWith({
      step: 'general',
      data: generalPayload,
    })
    expect(onSavingStateChange).toHaveBeenLastCalledWith(false)

    rerender({
      step: 'general',
      payload: { ...generalPayload, headline: 'Updated Headline' },
      enabled: true,
      isDirty: true,
      debounceMs: 100,
      onSave,
      onSavingStateChange,
    })

    await act(async () => {
      vi.advanceTimersByTime(100)
    })

    expect(onSave).toHaveBeenCalledTimes(2)
  })

  it('does not trigger saves when disabled or not dirty', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)

    const { rerender } = renderHook(
      (props) => useWizardAutoSave(props),
      {
        initialProps: {
          step: 'general' as const,
          payload: generalPayload,
          enabled: true,
          isDirty: true,
          debounceMs: 100,
          onSave,
        },
      },
    )

    rerender({
      step: 'general' as const,
      payload: generalPayload,
      enabled: false,
      isDirty: true,
      debounceMs: 100,
      onSave,
    })

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(onSave).not.toHaveBeenCalled()

    rerender({
      step: 'general' as const,
      payload: generalPayload,
      enabled: true,
      isDirty: false,
      debounceMs: 100,
      onSave,
    })

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(onSave).not.toHaveBeenCalled()
  })

  it('clears pending saves on unmount', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined)

    const { unmount } = renderHook(
      (props) => useWizardAutoSave(props),
      {
        initialProps: {
          step: 'general' as const,
          payload: generalPayload,
          enabled: true,
          isDirty: true,
          debounceMs: 100,
          onSave,
        },
      },
    )

    unmount()

    await act(async () => {
      vi.advanceTimersByTime(200)
    })

    expect(onSave).not.toHaveBeenCalled()
  })
})


