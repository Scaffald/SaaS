import { getAnalyticsClient, isAnalyticsInitialized } from "./client";
import { getQueueStats } from "./queue";

export const getAnalyticsHealthSnapshot = async () => {
  const queue = await getQueueStats();
  const client = getAnalyticsClient();

  return {
    initialized: isAnalyticsInitialized(),
    queuedEvents: queue.size,
    distinctId: client?.getDistinctId?.() ?? null,
  };
};
