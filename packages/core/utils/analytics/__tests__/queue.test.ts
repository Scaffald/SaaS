import { beforeEach, describe, expect, test, vi } from 'vitest'

vi.mock('@react-native-async-storage/async-storage', () => {
  const store = new Map<string, string>()
  return {
    default: {
      getItem: vi.fn(async (key: string) => store.get(key) ?? null),
      setItem: vi.fn(async (key: string, value: string) => {
        store.set(key, value)
      }),
      removeItem: vi.fn(async (key: string) => {
        store.delete(key)
      }),
      __reset: () => {
        store.clear()
      },
    },
  }
})

const captureEventMock = vi.hoisted(() => vi.fn())

vi.mock('../client', () => ({
  captureEvent: captureEventMock,
}))

import AsyncStorage from '@react-native-async-storage/async-storage'
import { captureEventWithQueue, flushQueue, getQueueStats } from '../queue'

describe('analytics queue', () => {
  beforeEach(async () => {
    captureEventMock.mockReset()
    ;(AsyncStorage as any).__reset()
  })

  test('queues critical events when capture fails', async () => {
    captureEventMock.mockReturnValue(false)

    await captureEventWithQueue('user_signed_out', { reason: 'sign_out' })

    const stats = await getQueueStats()
    expect(stats.size).toBe(1)
  })

  test('flushQueue replays queued events', async () => {
    captureEventMock.mockReturnValue(false)
    await captureEventWithQueue('user_signed_out', { reason: 'sign_out' })

    captureEventMock.mockReturnValue(true)
    await flushQueue()

    const stats = await getQueueStats()
    expect(stats.size).toBe(0)
    expect(captureEventMock).toHaveBeenCalledTimes(2)
  })
})

