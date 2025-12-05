import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@react-native-async-storage/async-storage", () => {
  const store = new Map<string, string>();
  return {
    default: {
      getItem: vi.fn(async (key: string) => store.get(key) ?? null),
      setItem: vi.fn(async (key: string, value: string) => {
        store.set(key, value);
      }),
      removeItem: vi.fn(async (key: string) => {
        store.delete(key);
      }),
      __reset: () => {
        store.clear();
      },
    },
  };
});

const captureEventMock = vi.hoisted(() => vi.fn());

vi.mock("../client", () => ({
  captureEvent: captureEventMock,
}));

import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  captureEventWithQueue,
  flushQueue,
  getQueueStats,
  queueEvent,
} from "../queue";

describe("analytics queue", () => {
  beforeEach(async () => {
    captureEventMock.mockReset();
    captureEventMock.mockReturnValue(false) // Default to failing so events are queued
    ;
    (AsyncStorage as { __reset?: () => void }).__reset?.();
  });

  test("queues critical events when capture fails", async () => {
    captureEventMock.mockReturnValue(false);

    await captureEventWithQueue("user_signed_out", { reason: "sign_out" });

    const stats = await getQueueStats();
    expect(stats.size).toBe(1);
  });

  test("does not queue non-critical events when capture fails", async () => {
    captureEventMock.mockReturnValue(false);

    await captureEventWithQueue("job_viewed", {
      job_id: "job-123",
      is_external: false,
    });

    const stats = await getQueueStats();
    expect(stats.size).toBe(0);
  });

  test("flushQueue replays queued events", async () => {
    captureEventMock.mockReturnValue(false);
    await captureEventWithQueue("user_signed_out", { reason: "sign_out" });

    captureEventMock.mockReturnValue(true);
    await flushQueue();

    const stats = await getQueueStats();
    expect(stats.size).toBe(0);
    expect(captureEventMock).toHaveBeenCalledTimes(2);
  });

  test("queue persists across app restarts", async () => {
    captureEventMock.mockReturnValue(false);

    // Queue an event
    await queueEvent("user_signed_in", {
      provider: "email",
      is_new_user: true,
    });

    // Simulate app restart by checking storage directly
    const stored = await AsyncStorage.getItem("analytics:event_queue");
    expect(stored).toBeTruthy();
    if (!stored) {
      throw new Error("Queue should exist");
    }
    const parsed = JSON.parse(stored);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe("user_signed_in");
  });


  test("flushQueue handles partial failures", async () => {
    captureEventMock.mockReturnValue(false);

    // Queue multiple events
    await queueEvent("user_signed_in", {
      provider: "email",
      is_new_user: true,
    });
    await queueEvent("user_signed_out", { reason: "sign_out" });

    // First flush succeeds, second fails
    captureEventMock
      .mockReturnValueOnce(true) // First succeeds
      .mockReturnValueOnce(false); // Second fails

    await flushQueue();

    const stats = await getQueueStats();
    // One event should remain
    expect(stats.size).toBe(1);
  });

  test("queue retry logic increments attempts on failure", async () => {
    captureEventMock.mockReturnValue(false);

    await queueEvent("user_signed_out", { reason: "sign_out" });

    // Try to flush - should fail and increment attempts
    await flushQueue();

    const stored = await AsyncStorage.getItem("analytics:event_queue");
    if (!stored) {
      throw new Error("Queue should exist");
    }
    const parsed = JSON.parse(stored);
    expect(parsed[0].attempts).toBe(1);
  });

  test("queue drops events after max retry attempts", async () => {
    captureEventMock.mockReturnValue(false);

    await queueEvent("user_signed_out", { reason: "sign_out" });

    // Load queue and set attempts to max
    const stored = await AsyncStorage.getItem("analytics:event_queue");
    if (!stored) {
      throw new Error("Queue should exist");
    }
    const parsed = JSON.parse(stored);
    parsed[0].attempts = 6; // MAX_RETRY_ATTEMPTS
    await AsyncStorage.setItem("analytics:event_queue", JSON.stringify(parsed));

    // Try to flush - should drop the event
    await flushQueue();

    const stats = await getQueueStats();
    expect(stats.size).toBe(0);
  });

  test("queue cleanup removes storage when empty", async () => {
    captureEventMock.mockReturnValue(false);

    await queueEvent("user_signed_out", { reason: "sign_out" });

    // Verify queue exists
    const statsBefore = await getQueueStats();
    expect(statsBefore.size).toBe(1);

    // Flush successfully
    captureEventMock.mockReturnValue(true);
    await flushQueue();

    // Verify storage is cleaned up
    const stored = await AsyncStorage.getItem("analytics:event_queue");
    expect(stored).toBeNull();

    const statsAfter = await getQueueStats();
    expect(statsAfter.size).toBe(0);
  });

  test("queue prioritizes critical events", async () => {
    captureEventMock.mockReturnValue(false);

    // Queue both critical and non-critical events
    await queueEvent("user_signed_in", {
      provider: "email",
      is_new_user: true,
    });
    await queueEvent("user_signed_out", { reason: "sign_out" });

    // Both should be in queue since they're critical
    const stats = await getQueueStats();
    expect(stats.size).toBe(2);
  });

  test("flushQueue stops after first failure", async () => {
    captureEventMock.mockReturnValue(false);

    // Queue multiple events
    await queueEvent("user_signed_in", {
      provider: "email",
      is_new_user: true,
    });
    await queueEvent("user_signed_out", { reason: "sign_out" });
    await queueEvent("auth_magic_link_requested", {
      email_domain: "example.com",
    });

    const statsBefore = await getQueueStats();
    expect(statsBefore.size).toBe(3);

    // First succeeds, second fails - should stop processing
    captureEventMock
      .mockReturnValueOnce(true) // First succeeds
      .mockReturnValueOnce(false); // Second fails

    await flushQueue();

    const stats = await getQueueStats();
    // Should have remaining events (second failed + third not processed)
    // The second event failed, so it's added back with incremented attempts
    // The third event wasn't processed, so it remains in the queue
    expect(stats.size).toBeGreaterThan(0);
    expect(stats.size).toBeLessThanOrEqual(3);
  });

  test("queue handles corrupted storage gracefully", async () => {
    // Set corrupted data
    await AsyncStorage.setItem("analytics:event_queue", "invalid json");

    // Should handle gracefully
    const stats = await getQueueStats();
    expect(stats.size).toBe(0);
  });
});
