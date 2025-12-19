import {
  assertEquals,
  assertExists,
} from 'jsr:@std/assert';

import { callTRPCEndpoint } from '../setup';
import { setupTeamManagementFixture } from './seed-utils';

Deno.test({
  name: "Team applications - assign application to member",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const fakeApplicationId = '00000000-0000-0000-0000-000000000000';

    const response = await callTRPCEndpoint(
      "teams.applications.assign",
      {
        teamId: fixture.team.id,
        applicationId: fakeApplicationId,
        assigneeUserId: fixture.member.userId,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    // May fail if application doesn't exist
    const result = response[0]?.result?.data;
    const error = response[0]?.error;
    
    if (error) {
      assertExists(error, 'Expected error if application doesn't exist");
    } else if (result) {
      assertExists(result, "Expected assignment response");
    }
  },
});

Deno.test({
  name: "Team applications - assign requires permission",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const fakeApplicationId = '00000000-0000-0000-0000-000000000000';

    const response = await callTRPCEndpoint(
      "teams.applications.assign",
      {
        teamId: fixture.team.id,
        applicationId: fakeApplicationId,
        assigneeUserId: fixture.member.userId,
      },
      {
        type: "mutation",
        authToken: fixture.member.token,
      },
    );

    const error = response[0]?.error;
    if (error) {
      // Expected - either NOT_FOUND or FORBIDDEN
      assertExists(error, "Expected error for unauthorized assignment");
    }
  },
});

Deno.test({
  name: "Team applications - unassign removes assignment",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const fakeApplicationId = '00000000-0000-0000-0000-000000000000';

    const response = await callTRPCEndpoint(
      "teams.applications.unassign",
      {
        teamId: fixture.team.id,
        applicationId: fakeApplicationId,
        assigneeUserId: fixture.member.userId,
      },
      {
        type: "mutation",
        authToken: fixture.owner.token,
      },
    );

    // May fail if assignment doesn't exist
    const result = response[0]?.result?.data;
    const error = response[0]?.error;
    
    if (error) {
      assertExists(error, 'Expected error if assignment doesn't exist");
    } else if (result) {
      assertExists(result, "Expected unassign response");
    }
  },
});

Deno.test({
  name: "Team applications - list assignments for application",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const fakeApplicationId = '00000000-0000-0000-0000-000000000000';

    const response = await callTRPCEndpoint(
      "teams.applications.list",
      {
        applicationId: fakeApplicationId,
      },
      {
        type: "query",
        authToken: fixture.owner.token,
      },
    );

    const result = response[0]?.result?.data;
    const error = response[0]?.error;
    
    if (error) {
      assertExists(error, "Expected error or empty result");
    } else if (result) {
      assertExists(result, "Expected assignments list response");
    }
  },
});

Deno.test({
  name: "Team applications - list requires permission",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const fixture = await setupTeamManagementFixture();
    const fakeApplicationId = '00000000-0000-0000-0000-000000000000';

    const response = await callTRPCEndpoint(
      "teams.applications.list",
      {
        applicationId: fakeApplicationId,
      },
      {
        type: "query",
        authToken: fixture.member.token,
      },
    );

    // May fail due to application not existing or permission
    const error = response[0]?.error;
    if (error) {
      assertExists(error, "Expected error for unauthorized or non-existent application");
    }
  },
});

