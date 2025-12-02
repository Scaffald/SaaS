import AsyncStorage from '@react-native-async-storage/async-storage'
import { captureEvent } from './client.ts'
import type { AnalyticsEventName, AnalyticsEventProperties } from './events.ts'

const QUEUE_STORAGE_KEY = 'analytics:event_queue'
const MAX_QUEUE_SIZE_BYTES = 100 * 1024 * 1024
const MAX_RETRY_ATTEMPTS = 6
const CRITICAL_EVENTS: Set<AnalyticsEventName> = new Set([
  'auth_magic_link_requested',
  'user_signed_in',
  'user_signed_out',
])

type QueuedEvent<TName extends AnalyticsEventName = AnalyticsEventName> = {
  id: string
  name: TName
  properties: AnalyticsEventProperties<TName>
  attempts: number
}

const createEventId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}` as const

const parseQueue = (raw: string | null): QueuedEvent[] => {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .filter(
          (event) =>
            event &&
            typeof event === 'object' &&
            typeof event.name === 'string' &&
            typeof event.id === 'string'
        )
        .map((event) => ({
          ...event,
          attempts: typeof event.attempts === 'number' ? event.attempts : 0,
        }))
    }
  } catch (error) {
    console.warn('[analytics] Unable to parse offline analytics queue', error)
  }
  return []
}

const loadQueue = async () => {
  const stored = await AsyncStorage.getItem(QUEUE_STORAGE_KEY)
  return parseQueue(stored)
}

const saveQueue = async (queue: QueuedEvent[]) => {
  if (!queue.length) {
    await AsyncStorage.removeItem(QUEUE_STORAGE_KEY)
    return
  }
  await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue))
}

const enforceQueueSizeLimit = async (queue: QueuedEvent[]) => {
  const serialized = JSON.stringify(queue)
  if (serialized.length <= MAX_QUEUE_SIZE_BYTES) return queue

  const trimCount = Math.ceil(queue.length * 0.2)
  const trimmed = queue.slice(trimCount)
  console.warn('[analytics] Offline analytics queue trimmed due to size limit', {
    size: serialized.length,
    trimmed,
  })
  await saveQueue(trimmed)
  return trimmed
}

export const queueEvent = async <TName extends AnalyticsEventName>(
  name: TName,
  properties: AnalyticsEventProperties<TName>
) => {
  const queue = await loadQueue()
  queue.push({
    id: createEventId(),
    name,
    properties,
    attempts: 0,
  })
  const boundedQueue = await enforceQueueSizeLimit(queue)
  await saveQueue(boundedQueue)
}

export const flushQueue = async () => {
  const queue = await loadQueue()
  if (!queue.length) return

  const remaining: QueuedEvent[] = []

  for (const item of queue) {
    const success = captureEvent(item.name, item.properties as AnalyticsEventProperties)
    if (success) continue

    const attempts = item.attempts + 1
    if (attempts >= MAX_RETRY_ATTEMPTS) {
      console.warn('[analytics] Dropping queued analytics event after max retries', {
        event: item.name,
      })
      continue
    }

    remaining.push({
      ...item,
      attempts,
    })

    break
  }

  await saveQueue(remaining)
}

export const getQueueStats = async () => {
  const queue = await loadQueue()
  return {
    size: queue.length,
  }
}

export const captureEventWithQueue = async <TName extends AnalyticsEventName>(
  name: TName,
  properties: AnalyticsEventProperties<TName>
) => {
  const success = captureEvent(name, properties)
  if (success) return true

  if (CRITICAL_EVENTS.has(name)) {
    await queueEvent(name, properties)
  }

  return false
}
