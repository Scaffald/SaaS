/**
 * Personality assessment router baseline coverage.
 */

import { assert, assertEquals, assertExists } from '../shared/assert';

import {
  callTRPCEndpoint,
  createAdminClient,
  loadCachedTokens,
} from '../shared/setup';
import { requireAuthSetup } from '../shared/test-context';

Deno.test({
  name: "Personality assessment - getAssessmentStatus requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "personalityAssessment.getAssessmentStatus",
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Personality assessment - getAssessmentStatus initializes record",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();

    const tokens = await loadCachedTokens();
    assertExists(tokens, "Auth tokens should be cached");

    const response = await callTRPCEndpoint(
      "personalityAssessment.getAssessmentStatus",
      undefined,
      { authToken: tokens.regular.token },
    );

    const data = response[0]?.result?.data;
    assertExists(data, "Assessment status should be returned");
    assertEquals(data.user_id ?? data.userId, tokens.regular.userId);
    assertEquals(typeof (data.current_step ?? data.currentStep), "string");
  },
});

type IPIPDomain = "A" | "E" | "N" | "C" | "O";

interface TestAnswer {
  id: string;
  domain: IPIPDomain;
  facet: number;
  score: number;
}

const IPIP_DOMAINS: IPIPDomain[] = ["A", "E", "N", "C", "O"];

function buildDomainAnswers(
  domain: IPIPDomain,
  score: number,
  count = 24,
): TestAnswer[] {
  return Array.from({ length: count }).map((_, index) => ({
    id: `${domain}-${index + 1}`,
    domain,
    facet: (index % 6) + 1,
    score,
  }));
}

function buildCompleteAssessmentAnswers(): TestAnswer[] {
  return IPIP_DOMAINS.flatMap((domain, domainIndex) =>
    buildDomainAnswers(domain, Math.min(5, 2 + domainIndex))
  );
}

async function resetAssessmentData(userId: string) {
  const admin = createAdminClient();

  await admin.schema("core").from("ipip_share_tokens").delete().eq("user_id", userId);
  await admin.schema("core").from("user_assessment_xp").delete().eq("user_id", userId)
    .eq("assessment_type", "ipip");
  await admin.schema("core").from("user_archetypes").delete().eq("user_id", userId);
  await admin.schema("core").from("personality_assessments").delete().eq(
    "user_id",
    userId,
  );
}

async function ensureAssessmentRecord(authToken: string) {
  await callTRPCEndpoint(
    "personalityAssessment.getAssessmentStatus",
    undefined,
    { authToken },
  );
}

Deno.test({
  name: "Personality assessment - saveIPIPProgress requires authentication",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    const response = await callTRPCEndpoint(
      "personalityAssessment.saveIPIPProgress",
      {
        answers: [],
        current_index: 0,
        language: "en",
      },
      { type: "mutation" },
    );

    const error = response[0]?.error;
    assertExists(error, "Expected UNAUTHORIZED error");
    assertEquals(error?.data?.code, "UNAUTHORIZED");
  },
});

Deno.test({
  name: "Personality assessment - partial IPIP domain progress persists and reports status",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens?.regular, "Cached auth tokens are required");

    const authToken = tokens.regular.token;
    const userId = tokens.regular.userId;

    await resetAssessmentData(userId);
    await ensureAssessmentRecord(authToken);

    const partialAnswers = buildDomainAnswers("A", 4);

    const response = await callTRPCEndpoint(
      "personalityAssessment.saveIPIPProgress",
      {
        answers: partialAnswers,
        current_index: partialAnswers.length,
        language: "en",
      },
      { type: "mutation", authToken },
    );

    const payload = response[0]?.result?.data as
      | { success: boolean; isComplete: boolean }
      | undefined;
    assertExists(payload, "saveIPIPProgress should return a payload");
    assertEquals(payload.success, true);
    assertEquals(payload.isComplete, false);

    const statusResponse = await callTRPCEndpoint(
      "personalityAssessment.getIPIPStatus",
      undefined,
      { authToken },
    );
    const status = statusResponse[0]?.result?.data as
      | { progress: number; isCompleted: boolean }
      | undefined;
    assertExists(status, "Status query should return progress data");
    assertEquals(status.progress, partialAnswers.length);
    assertEquals(status.isCompleted, false);
  },
});

Deno.test({
  name: "Personality assessment - completing IPIP stores archetype & XP bonus",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens?.regular, "Cached auth tokens are required");

    const authToken = tokens.regular.token;
    const userId = tokens.regular.userId;
    const admin = createAdminClient();

    await resetAssessmentData(userId);
    await ensureAssessmentRecord(authToken);

    const fullAnswers = buildCompleteAssessmentAnswers();

    const response = await callTRPCEndpoint(
      "personalityAssessment.saveIPIPProgress",
      {
        answers: fullAnswers,
        current_index: fullAnswers.length,
        language: "en",
      },
      { type: "mutation", authToken },
    );

    const payload = response[0]?.result?.data as
      | { success: boolean; isComplete: boolean }
      | undefined;
    assertExists(payload, "Expected saveIPIPProgress payload");
    assertEquals(payload.success, true);
    assertEquals(payload.isComplete, true);

    const { data: xpEntries, error: xpError } = await admin
      .schema("core")
      .from("user_assessment_xp")
      .select("xp_type, xp_amount")
      .eq("user_id", userId)
      .eq("assessment_type", "ipip")
      .eq("xp_type", "completion");
    if (xpError) {
      throw xpError;
    }

    assertExists(xpEntries, "XP entries query should return data");
    assert(
      xpEntries.length > 0,
      "Completion XP entry should be inserted after finishing IPIP",
    );

    const { data: archetypeRecords, error: archetypeError } = await admin
      .schema("core")
      .from("user_archetypes")
      .select("is_primary")
      .eq("user_id", userId)
      .eq("is_primary", true);
    if (archetypeError) {
      throw archetypeError;
    }

    assertExists(archetypeRecords, "Archetype history query should return data");
    assert(
      archetypeRecords.length > 0,
      "Completing IPIP should insert a primary archetype entry",
    );
  },
});

Deno.test({
  name: "Personality assessment - share tokens can be generated, fetched, and revoked",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
    await requireAuthSetup();
    const tokens = await loadCachedTokens();
    assertExists(tokens?.regular, "Cached auth tokens are required");

    const authToken = tokens.regular.token;
    const userId = tokens.regular.userId;

    await resetAssessmentData(userId);
    await ensureAssessmentRecord(authToken);

    const answers = buildCompleteAssessmentAnswers();
    await callTRPCEndpoint(
      "personalityAssessment.saveIPIPProgress",
      {
        answers,
        current_index: answers.length,
        language: "en",
      },
      { type: "mutation", authToken },
    );

    const shareResponse = await callTRPCEndpoint(
      "personalityAssessment.generateShareToken",
      { expiresInDays: 7 },
      { type: "mutation", authToken },
    );
    const sharePayload = shareResponse[0]?.result?.data as
      | { token: string }
      | undefined;
    assertExists(sharePayload, "Expected share token payload");

    const sharedResult = await callTRPCEndpoint(
      "personalityAssessment.getSharedResults",
      { token: sharePayload.token },
    );
    const sharedData = sharedResult[0]?.result?.data as
      | { answers: unknown[] | null }
      | undefined;
    assertExists(sharedData, "Shared results query should succeed");
    assert(sharedData.answers !== null, "Shared results should include answers");

    const revokeResponse = await callTRPCEndpoint(
      "personalityAssessment.revokeShareToken",
      { token: sharePayload.token },
      { type: "mutation", authToken },
    );
    const revokePayload = revokeResponse[0]?.result?.data as
      | { success: boolean }
      | undefined;
    assertExists(revokePayload, "Expected revoke payload");
    assertEquals(revokePayload.success, true);
  },
});
