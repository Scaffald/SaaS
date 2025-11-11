import { describe, expect, it } from "vitest";

import {
  FEEDBACK_ALLOWED_MIME_TYPES,
  FEEDBACK_MIN_LENGTH,
  feedbackPendingSubmissionSchema,
  feedbackSubmitSchema,
  feedbackUploadRequestSchema,
  type FeedbackSubmitInput,
} from "../feedback/feedback.schema";

const baseFeedback = (): FeedbackSubmitInput => ({
  feedbackType: "bug",
  feedbackText: "A".repeat(FEEDBACK_MIN_LENGTH + 10),
  pageUrl: "/dashboard/home",
  userAgent: "Vitest/1.0",
  browserName: "Vitest",
  browserVersion: "1.0.0",
  operatingSystem: "Test OS",
  screenResolution: "1440x900",
  viewportSize: "1280x720",
});

describe("feedbackSubmitSchema", () => {
  it("accepts valid submissions without a screenshot", () => {
    expect(() => feedbackSubmitSchema.parse(baseFeedback())).not.toThrow();
  });

  it("enforces minimum feedback length", () => {
    expect(() =>
      feedbackSubmitSchema.parse({
        ...baseFeedback(),
        feedbackText: "Too short",
      }),
    ).toThrowError(new RegExp(`at least ${FEEDBACK_MIN_LENGTH} characters`));
  });

  it("accepts optional screenshot path", () => {
    expect(() =>
      feedbackSubmitSchema.parse({
        ...baseFeedback(),
        screenshotPath: "12345/example.png",
      }),
    ).not.toThrow();
  });
});

describe("feedbackUploadRequestSchema", () => {
  it("validates supported mime types and file size", () => {
    const mimeType = FEEDBACK_ALLOWED_MIME_TYPES[0];
    expect(() =>
      feedbackUploadRequestSchema.parse({
        fileName: "example.png",
        fileType: mimeType,
        fileSize: 1024 * 1024,
      }),
    ).not.toThrow();
  });

  it("rejects files that exceed size limit", () => {
    const mimeType = FEEDBACK_ALLOWED_MIME_TYPES[0];
    expect(() =>
      feedbackUploadRequestSchema.parse({
        fileName: "example.png",
        fileType: mimeType,
        fileSize: 6 * 1024 * 1024,
      }),
    ).toThrowError(/File size must be under 5MB/);
  });
});

describe("feedbackPendingSubmissionSchema", () => {
  it("stores screenshot metadata when queueing", () => {
    const payload = feedbackPendingSubmissionSchema.parse({
      ...baseFeedback(),
      screenshot: {
        name: "feedback.png",
        mimeType: "image/png",
        base64: "ZmFrZS1iYXNlNjQ=",
        size: 2048,
      },
      id: "11111111-2222-3333-4444-555555555555",
      createdAt: new Date().toISOString(),
      attempts: 1,
    });

    expect(payload.screenshot?.mimeType).toBe("image/png");
    expect(payload.screenshot?.base64).toBe("ZmFrZS1iYXNlNjQ=");
    expect(payload.attempts).toBe(1);
  });
});


