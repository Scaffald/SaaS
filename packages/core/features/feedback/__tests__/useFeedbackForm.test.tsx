import { FEEDBACK_MAX_LENGTH, FEEDBACK_MIN_LENGTH } from '@app/schemas/feedback'
import { act, renderHook } from '@testing-library/react'
import { Platform } from 'react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useFeedbackForm } from '../hooks/useFeedbackForm'

describe('useFeedbackForm', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('initializes with empty values', () => {
    const { result } = renderHook(() => useFeedbackForm())

    expect(result.current.form.getValues()).toEqual({
      feedbackType: undefined,
      feedbackText: '',
    })
    expect(result.current.characterCount).toBe(0)
    expect(result.current.minLength).toBe(FEEDBACK_MIN_LENGTH)
    expect(result.current.maxLength).toBe(FEEDBACK_MAX_LENGTH)
    expect(result.current.isBelowMinimum).toBe(true)
    expect(result.current.screenshot).toBeNull()
  })

  it('tracks character count changes', () => {
    const { result } = renderHook(() => useFeedbackForm())

    act(() => {
      result.current.form.setValue('feedbackText', 'hello world')
    })

    expect(result.current.characterCount).toBe(11)
    expect(result.current.isBelowMinimum).toBe(true)
  })

  it('resets state including screenshot', () => {
    const originalOS = Platform.OS
    Object.defineProperty(Platform, 'OS', {
      configurable: true,
      get: () => originalOS,
    })

    const { result } = renderHook(() => useFeedbackForm())

    act(() => {
      result.current.setScreenshot({
        kind: 'web',
        file: new File(['data'], 'example.png', { type: 'image/png' }),
      })
      result.current.form.setValue('feedbackText', 'A'.repeat(FEEDBACK_MIN_LENGTH))
    })

    expect(result.current.screenshot).not.toBeNull()
    expect(result.current.characterCount).toBe(FEEDBACK_MIN_LENGTH)
    expect(result.current.isBelowMinimum).toBe(false)

    act(() => {
      result.current.reset()
    })

    expect(result.current.form.getValues()).toEqual({
      feedbackType: undefined,
      feedbackText: '',
    })
    expect(result.current.characterCount).toBe(0)
    expect(result.current.isBelowMinimum).toBe(true)
    expect(result.current.screenshot).toBeNull()
  })
})
