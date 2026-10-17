import { describe, expect, it, vi } from 'vitest'
import { holdFocusMode, isFocusMode, subscribeFocusMode } from '../focus-mode'

describe('focus mode (#1194)', () => {
  it('is off until something holds it', () => {
    expect(isFocusMode()).toBe(false)
    const release = holdFocusMode()
    expect(isFocusMode()).toBe(true)
    release()
    expect(isFocusMode()).toBe(false)
  })

  it('stays on until every holder lets go', () => {
    const a = holdFocusMode()
    const b = holdFocusMode()
    a()
    expect(isFocusMode()).toBe(true)
    b()
    expect(isFocusMode()).toBe(false)
  })

  it('ignores a second release from the same holder', () => {
    const a = holdFocusMode()
    const b = holdFocusMode()
    a()
    a()
    expect(isFocusMode()).toBe(true)
    b()
    expect(isFocusMode()).toBe(false)
  })

  it('tells subscribers when it changes, until they unsubscribe', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeFocusMode(listener)
    const release = holdFocusMode()
    release()
    expect(listener).toHaveBeenCalledTimes(2)
    unsubscribe()
    holdFocusMode()()
    expect(listener).toHaveBeenCalledTimes(2)
  })
})
