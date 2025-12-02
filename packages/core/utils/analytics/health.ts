import { getAnalyticsClient, isAnalyticsInitialized } from './client.ts'
import { getQueueStats } from './queue.ts'

export const getAnalyticsHealthSnapshot = async () => {
  const queue = await getQueueStats()
  const client = getAnalyticsClient()

  return {
    initialized: isAnalyticsInitialized(),
    queuedEvents: queue.size,
    distinctId: client?.getDistinctId?.() ?? null,
  }
}
