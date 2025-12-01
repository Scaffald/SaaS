import { afterEach, describe, expect, it, vi } from "vitest";
import { Platform } from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  addPendingFeedback,
  clearPendingFeedback,
  getPendingFeedbackQueue,
  updatePendingFeedback,
} from "../utils/feedbackStorage";

vi.mock("@react-native-async-storage/async-storage", () => ({
  __esModule: true,
  default: {
    getItem: vi.fn(async () => null),
    setItem: vi.fn(async () => undefined),
  },
}));

describe("feedbackStorage", () => {
  const originalPlatform = Platform.OS;
  const asyncStorage = vi.mocked(AsyncStorage);

  afterEach(async () => {
    vi.clearAllMocks();
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      get: () => originalPlatform,
    });
    window.localStorage.clear();
    await clearPendingFeedback();
  });

  it("persists queue in web localStorage", async () => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      get: () => "web",
    });

    await addPendingFeedback({
      id: "queue-1",
      feedbackType: "bug",
      feedbackText: "Sample feedback message that exceeds minimum length.",
      pageUrl: "/dashboard/home",
      userAgent: "Jest/1.0",
    });

    const queue = await getPendingFeedbackQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]?.id).toBe("queue-1");

    await updatePendingFeedback({
      id: "queue-1",
      feedbackType: "bug",
      feedbackText: "Updated",
      pageUrl: "/dashboard/home",
      userAgent: "Jest/1.0",
      attempts: 2,
    });

    const updated = await getPendingFeedbackQueue();
    expect(updated[0]?.attempts).toBe(2);
  });

  it("persists queue using AsyncStorage on native", async () => {
    Object.defineProperty(Platform, "OS", {
      configurable: true,
      get: () => "ios",
    });

    asyncStorage.getItem.mockResolvedValueOnce(null);

    await addPendingFeedback({
      id: "native-1",
      feedbackType: "feature",
      feedbackText: "Feature request feedback content goes here.",
      pageUrl: "/dashboard/native",
      userAgent: "Expo/1.0",
    });

    expect(asyncStorage.setItem).toHaveBeenCalledTimes(1);
    const [key, value] = asyncStorage.setItem.mock.calls[0] ?? [];
    expect(key).toBe("@scf-scaffald/feedback/pending-submissions");
    expect(JSON.parse(value ?? "[]")[0]?.id).toBe("native-1");
  });
});
