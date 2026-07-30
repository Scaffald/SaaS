/**
 * Feedback router baseline coverage.
 */

import { assertEquals, assertExists } from '../shared/assert.ts';

import {
  callTRPCEndpoint,
  loadCachedTokens,
} from '../shared/setup.ts';
import { requireAuthSetup } from '../shared/test-context.ts';

Deno.test({
  name: "Feedback router - submit requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "feedback.submit",
      {
        feedbackType: "bug",
        feedbackText: "Sample issue description",
        pageUrl: "https://example.com",
        userAgent: "test",
      },
      { type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Feedback router - rejects screenshot path outside user scope",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "feedback.submit",
      {
        feedbackType: "bug",
        feedbackText: "A".repeat(120),
        pageUrl: "/dashboard/home",
        userAgent: "DenoTest/1.0",
        screenshotPath: "another-user-id/path.png",
      },
      {
        authToken: tokens.regular.token,
        type: "mutation",
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected FORBIDDEN error");
    assertEquals(error?.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Feedback router - submits feedback and returns in history",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const uniqueMessage = `Automated feedback ${crypto.randomUUID()}`;

    const submitResponse = await callTRPCEndpoint(
      "feedback.submit",
      {
        feedbackType: "comment",
        feedbackText: uniqueMessage.padEnd(120, "."),
        pageUrl: "/dashboard/analytics",
        userAgent: "DenoTest/1.0",
        browserName: "Deno",
        operatingSystem: "TestOS",
      },
      {
        authToken: tokens.regular.token,
        type: "mutation",
      },
    );

    const submitData = submitResponse[0]?.result?.data;
    assertExists(submitData, "Submission should succeed");
    assertExists(submitData.id, "Submission should return an id");

    const historyResponse = await callTRPCEndpoint(
      "feedback.getUserFeedback",
      {
        limit: 5,
      },
      {
        authToken: tokens.regular.token,
      },
    );

    const historyData = historyResponse[0]?.result?.data;
    assertExists(historyData, "History response should include data");
    const items = historyData.items as Array<{ feedback_text: string }>;
    const matched = items.find((item) => item.feedback_text === uniqueMessage.padEnd(120, "."));
    assertExists(matched, "Created feedback should appear in history");
  },
});
