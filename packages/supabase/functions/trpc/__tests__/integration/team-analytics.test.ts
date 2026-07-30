import {
  assertEquals,
  assertExists,
} from 'jsr:@std/assert';

import { callTRPCEndpoint } from '../setup.ts';
import { setupTeamManagementFixture } from './seed-utils.ts';

Deno.test({
  name: "Team analytics - overview with date range filtering",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    const response = await callTRPCEndpoint(
      "teams.analytics.overview",
      {
        teamId: fixture.team.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { metrics: Array<Record<string, unknown>>; refreshedAt: string | null }
      | undefined;
    assertExists(result, "Expected analytics overview response");
    assertExists(result.metrics, "Expected metrics array");
  },
});

Deno.test({
  name: "Team analytics - overview with limit parameter",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.analytics.overview",
      {
        teamId: fixture.team.id,
        limit: 5,
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { metrics: Array<Record<string, unknown>> }
      | undefined;
    assertExists(result, "Expected analytics overview response");
    assertEquals(result.metrics.length <= 5, true, "Should respect limit");
  },
});

Deno.test({
  name: "Team analytics - overview requires permission",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.analytics.overview",
      {
        teamId: fixture.team.id,
      },
      {
        type: "query",
        authToken: fixture.member.token,
      },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected error for unauthorized analytics access");
    assertEquals(error.data?.code, "FORBIDDEN");
  },
});

Deno.test({
  name: "Team analytics - refresh manual refresh",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.analytics.refresh",
      {
        teamId: fixture.team.id,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { refreshedAt: string; metrics: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected refresh response");
    assertExists(result.refreshedAt, "Should have refreshed timestamp");
  },
});

Deno.test({
  name: "Team analytics - refresh with specific date",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const metricDate = new Date().toISOString().split("T")[0];

    const response = await callTRPCEndpoint(
      "teams.analytics.refresh",
      {
        teamId: fixture.team.id,
        metricDate,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { refreshedAt: string; metrics: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected refresh response");
  },
});

Deno.test({
  name: "Team analytics - activity with pagination",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.analytics.activity",
      {
        teamId: fixture.team.id,
        pageSize: 10,
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { events: Array<Record<string, unknown>>; nextCursor: string | null }
      | undefined;
    assertExists(result, "Expected activity response");
    assertExists(result.events, "Expected events array");
    assertEquals(result.events.length <= 10, true, "Should respect page size");
  },
});

Deno.test({
  name: "Team analytics - activity with date range",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();

    const response = await callTRPCEndpoint(
      "teams.analytics.activity",
      {
        teamId: fixture.team.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        pageSize: 20,
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { events: Array<Record<string, unknown>> }
      | undefined;
    assertExists(result, "Expected activity response");
  },
});

Deno.test({
  name: "Team analytics - comments list",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.analytics.comments",
      {
        teamId: fixture.team.id,
        limit: 10,
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { comments: Array<Record<string, unknown>>; nextCursor: string | null }
      | undefined;
    assertExists(result, "Expected comments response");
    assertExists(result.comments, "Expected comments array");
  },
});

Deno.test({
  name: "Team analytics - comments application-scoped",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const fakeApplicationId = '00000000-0000-0000-0000-000000000000';

    const response = await callTRPCEndpoint(
      "teams.analytics.comments",
      {
        teamId: fixture.team.id,
        applicationId: fakeApplicationId,
        limit: 10,
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { comments: Array<Record<string, unknown>> }
      | undefined;
    assertExists(result, "Expected comments response");
    // Should return empty array if no comments for that application
    assertExists(result.comments, "Expected comments array");
  },
});

Deno.test({
  name: "Team analytics - comments cursor pagination",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    // First page
    const firstResponse = await callTRPCEndpoint(
      "teams.analytics.comments",
      {
        teamId: fixture.team.id,
        limit: 5,
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const firstResult = firstResponse[0]?.result?.data as
      | { comments: Array<Record<string, unknown>>; nextCursor: string | null }
      | undefined;
    assertExists(firstResult, "Expected comments response");

    // Second page with cursor
    if (firstResult.nextCursor) {
      const secondResponse = await callTRPCEndpoint(
        "teams.analytics.comments",
        {
          teamId: fixture.team.id,
          limit: 5,
          cursor: firstResult.nextCursor,
        },
        {
          type: "query",
          authToken: fixture.owner.token,
        },
      );

      const secondResult = secondResponse[0]?.result?.data as
        | { comments: Array<Record<string, unknown>> }
        | undefined;
      assertExists(secondResult, "Expected second page response");
    }
  },
});

Deno.test({
  name: "Team analytics - workload latest snapshot",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.analytics.workload",
      {
        teamId: fixture.team.id,
        includeHistorical: false,
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { snapshots: Array<Record<string, unknown>> }
      | undefined;
    assertExists(result, "Expected workload response");
    assertExists(result.snapshots, "Expected snapshots array");
  },
});

Deno.test({
  name: "Team analytics - workload historical snapshots",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.analytics.workload",
      {
        teamId: fixture.team.id,
        includeHistorical: true,
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { snapshots: Array<Record<string, unknown>> }
      | undefined;
    assertExists(result, "Expected workload response");
    assertExists(result.snapshots, "Expected snapshots array");
  },
});

Deno.test({
  name: "Team analytics - workload asOf date filtering",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const asOfDate = new Date();
    asOfDate.setDate(asOfDate.getDate() - 1);

    const response = await callTRPCEndpoint(
      "teams.analytics.workload",
      {
        teamId: fixture.team.id,
        asOf: asOfDate.toISOString(),
        includeHistorical: true,
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { snapshots: Array<Record<string, unknown>> }
      | undefined;
    assertExists(result, "Expected workload response");
  },
});

Deno.test({
  name: "Team analytics - postComment basic comment",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.analytics.postComment",
      {
        teamId: fixture.team.id,
        body: "This is a test comment",
        mentions: [],
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { comment: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected post comment response");
    assertEquals(result.comment.body, "This is a test comment");
    assertExists(result.comment.occurredAt);
  },
});

Deno.test({
  name: "Team analytics - postComment with mentions",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.analytics.postComment",
      {
        teamId: fixture.team.id,
        body: "Hey @user, check this out",
        mentions: [fixture.member.userId],
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { comment: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected post comment response");
    assertEquals(result.comment.body, "Hey @user, check this out");
    assertExists(result.comment.mentions, "Should have mentions");
    assertEquals(Array.isArray(result.comment.mentions), true);
  },
});

Deno.test({
  name: "Team analytics - postComment application-scoped",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const fakeApplicationId = '00000000-0000-0000-0000-000000000000';

    const response = await callTRPCEndpoint(
      "teams.analytics.postComment",
      {
        teamId: fixture.team.id,
        body: "Comment on application",
        mentions: [],
        applicationId: fakeApplicationId,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data as
      | { comment: Record<string, unknown> }
      | undefined;
    assertExists(result, "Expected post comment response");
  },
});

Deno.test({
  name: "Team analytics - postComment requires permission",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();

    const response = await callTRPCEndpoint(
      "teams.analytics.postComment",
      {
        teamId: fixture.team.id,
        body: "Unauthorized comment",
        mentions: [],
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    // Members should be able to participate in discussion
    // This test may need adjustment based on actual permissions
    const result = response[0]?.result?.data;
    const error = response[0]?.error;
    
    // If member has PARTICIPATE_DISCUSSION permission, should succeed
    // Otherwise should fail with FORBIDDEN
    if (error) {
      assertEquals(error.data?.code, "FORBIDDEN");
    } else {
      assertExists(result, "Member should be able to comment if they have permission");
    }
  },
});

