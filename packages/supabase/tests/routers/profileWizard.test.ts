/**
 * Profile wizard router baseline coverage.
 */

import { assertEquals, assertExists } from '../shared/assert.ts';

import { callTRPCEndpoint, loadCachedTokens } from '../shared/setup.ts';
import { requireAuthSetup } from '../shared/test-context.ts';

Deno.test({
  name: "Profile wizard router - getProgress requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint("profileWizard.getProgress");

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Profile wizard router - getProgress returns default progress for user",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "profileWizard.getProgress",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Expected progress payload");
    assertEquals(typeof data.completionPercentage, "number");
    assertExists(data.currentStep);
  },
});

Deno.test({
  name: "Profile wizard router - saveStep saves step data correctly",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const saveResponse = await callTRPCEndpoint(
      "profileWizard.saveStep",
      {
        step: "general",
        data: {
          firstName: "John",
          lastName: "Doe",
          headline: "Electrician",
          bio: "Test bio",
        },
      },
      { authToken: tokens.regular.token },
    );

    const data = saveResponse[0]?.result?.data;
    assertExists(data, "Expected save response");
    assertEquals(data.currentStep, "general");
    assertEquals(typeof data.completionPercentage, "number");
    assertExists(data.lastSavedAt);
  },
});

Deno.test({
  name: "Profile wizard router - saveStep updates completion percentage",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    // Save general step
    const generalResponse = await callTRPCEndpoint(
      "profileWizard.saveStep",
      {
        step: "general",
        data: {
          firstName: "John",
          lastName: "Doe",
          headline: "Electrician",
          bio: "Test bio",
        },
      },
      { authToken: tokens.regular.token },
    );

    const generalData = generalResponse[0]?.result?.data;
    assertExists(generalData);
    const initialPercentage = generalData.completionPercentage;

    // Save skills step
    const skillsResponse = await callTRPCEndpoint(
      "profileWizard.saveStep",
      {
        step: "skills",
        data: {
          skills: [
            { id: "skill-1", name: "Skill 1", taxonomy: "onet", proficiency: 3 },
            { id: "skill-2", name: "Skill 2", taxonomy: "csi", proficiency: 4 },
            { id: "skill-3", name: "Skill 3", taxonomy: "onet", proficiency: 5 },
          ],
        },
      },
      { authToken: tokens.regular.token },
    );

    const skillsData = skillsResponse[0]?.result?.data;
    assertExists(skillsData);
    assertExists(skillsData.completionPercentage >= initialPercentage);
  },
});

Deno.test({
  name: "Profile wizard router - complete marks wizard as complete",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const completeResponse = await callTRPCEndpoint(
      "profileWizard.complete",
      { celebrate: true },
      { authToken: tokens.regular.token },
    );

    const data = completeResponse[0]?.result?.data;
    assertExists(data, "Expected complete response");
    assertExists(data.completedAt);
    assertEquals(data.currentStep, "education"); // Last step
  },
});
