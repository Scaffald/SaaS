import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createWriteQueue, UNDO_WINDOW_MS } from '../pending-writes'

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('createWriteQueue', () => {
  it('does not write during the window', () => {
    const run = vi.fn()
    const q = createWriteQueue(1000)
    q.schedule('a', run)

    vi.advanceTimersByTime(999)
    expect(run).not.toHaveBeenCalled()
    expect(q.has('a')).toBe(true)
  })

  it('writes once the window closes', () => {
    const run = vi.fn()
    const q = createWriteQueue(1000)
    q.schedule('a', run)

    vi.advanceTimersByTime(1000)
    expect(run).toHaveBeenCalledTimes(1)
    expect(q.has('a')).toBe(false)
  })

  it('cancels before anything is sent — the whole point of the delay', () => {
    const run = vi.fn()
    const q = createWriteQueue(1000)
    q.schedule('a', run)

    expect(q.cancel('a')).toBe(true)
    vi.advanceTimersByTime(10_000)
    expect(run).not.toHaveBeenCalled()
    expect(q.size()).toBe(0)
  })

  it('reports nothing to cancel once the write has gone out', () => {
    const q = createWriteQueue(1000)
    q.schedule('a', vi.fn())
    vi.advanceTimersByTime(1000)

    // Undo after the window must not claim success — the row really did move.
    expect(q.cancel('a')).toBe(false)
  })

  it('flush sends immediately and cancels the timer', () => {
    const run = vi.fn()
    const q = createWriteQueue(1000)
    q.schedule('a', run)

    q.flush('a')
    expect(run).toHaveBeenCalledTimes(1)

    // The timer must not fire a second write behind it.
    vi.advanceTimersByTime(10_000)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('a second move on the same row flushes the first, never drops it', () => {
    // Two moves are two decisions. Discarding the first would lose a write the
    // user already made and saw confirmed.
    const first = vi.fn()
    const second = vi.fn()
    const q = createWriteQueue(1000)

    q.schedule('a', first)
    q.schedule('a', second)

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1000)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('keeps separate rows separate', () => {
    const a = vi.fn()
    const b = vi.fn()
    const q = createWriteQueue(1000)

    q.schedule('a', a)
    q.schedule('b', b)
    q.cancel('a')

    vi.advanceTimersByTime(1000)
    expect(a).not.toHaveBeenCalled()
    expect(b).toHaveBeenCalledTimes(1)
  })

  it('flushAll sends everything held', () => {
    const a = vi.fn()
    const b = vi.fn()
    const q = createWriteQueue(1000)

    q.schedule('a', a)
    q.schedule('b', b)
    q.flushAll()

    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
    expect(q.size()).toBe(0)
  })

  it('flushAll does not double-send, and survives mutation while iterating', () => {
    const a = vi.fn()
    const q = createWriteQueue(1000)
    q.schedule('a', a)

    q.flushAll()
    q.flushAll()
    vi.advanceTimersByTime(10_000)
    expect(a).toHaveBeenCalledTimes(1)
  })

  it('flush and cancel on an unknown key are no-ops', () => {
    const q = createWriteQueue(1000)
    expect(() => q.flush('nope')).not.toThrow()
    expect(q.cancel('nope')).toBe(false)
  })

  it('defaults to the documented window', () => {
    const run = vi.fn()
    const q = createWriteQueue()
    q.schedule('a', run)

    vi.advanceTimersByTime(UNDO_WINDOW_MS - 1)
    expect(run).not.toHaveBeenCalled()
    vi.advanceTimersByTime(1)
    expect(run).toHaveBeenCalledTimes(1)
  })

  it('a rejected write does not take the queue down with it', () => {
    // The runner owns its own error handling; the queue must not leave an
    // unhandled rejection behind or refuse to keep working.
    const boom = vi.fn(() => Promise.reject(new Error('network')))
    const after = vi.fn()
    const q = createWriteQueue(1000)

    q.schedule('a', boom)
    expect(() => vi.advanceTimersByTime(1000)).not.toThrow()

    q.schedule('b', after)
    vi.advanceTimersByTime(1000)
    expect(after).toHaveBeenCalledTimes(1)
  })
})
