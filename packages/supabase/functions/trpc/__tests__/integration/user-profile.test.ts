import {
  assertEquals,
  assertExists,
  assertStringIncludes,
} from 'jsr:@std/assert';
import { createAdminClient, loadCachedTokens } from '../setup';

const TRPC_URL = 'http://127.0.0.1:54321/functions/v1/trpc';

Deno.test("User Profile - Get user skills (tests user_skills join)", async () => {
  const tokens = await loadCachedTokens();
  if (!tokens) throw new Error("No cached tokens available");
  const regularUserToken = tokens.regular.token;
  const TEST_USER_ID = tokens.regular.userId;

  const response = await fetch(
    `${TRPC_URL}/userProfile.getUserSkills?batch=1&input=${
      encodeURIComponent(JSON.stringify({
        "0": { userId: TEST_USER_ID },
      }))
    }`,
    {
      headers: {
        Authorization: `Bearer ${regularUserToken}`,
      },
    },
  );

  assertEquals(response.status, 200);
  const data = await response.json();

  // Should return array (may be empty if no skills yet)
  assertEquals(Array.isArray(data), true);

  if (data.length > 0) {
    const result = data[0].result;
    if (result.data) {
      assertEquals(Array.isArray(result.data), true);
      console.log(
        `✅ User skills fetched successfully (${result.data.length} skills)`,
      );
    }
  } else {
    console.log(
      "✅ User skills endpoint works (no skills found for test user)",
    );
  }
});

Deno.test({
  name: "User Profile - Skill enrichment includes taxonomy metadata",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
  const tokens = await loadCachedTokens();
  if (!tokens) {
    console.log("⚠️  Skipping skill enrichment test - no cached tokens");
    return;
  }

  const admin = createAdminClient();
  const TEST_USER_ID = tokens.regular.userId;

  const { data: csiSkill, error: csiError } = await admin
    .schema("data")
    .from("masterformat")
    .select("id, code_display")
    .limit(1)
    .maybeSingle();

  if (csiError || !csiSkill) {
    console.log(
      "⚠️  Skipping skill enrichment test - CSI data not available",
      csiError?.message,
    );
    return;
  }

  const { data: insertedSkill, error: insertError } = await admin
    .schema("core")
    .from("user_skills")
    .insert({
      user_id: TEST_USER_ID,
      skill_taxonomy: "csi",
      csi_skill_id: csiSkill.id,
      proficiency_level: 3,
    })
    .select()
    .maybeSingle();

  if (insertError || !insertedSkill) {
    console.log(
      "⚠️  Skipping skill enrichment test - unable to insert test skill",
      insertError?.message,
    );
    return;
  }

  try {
    const response = await fetch(
      `${TRPC_URL}/userProfile.getUserSkills?batch=1&input=${
        encodeURIComponent(JSON.stringify({
          "0": { userId: TEST_USER_ID },
        }))
      }`,
      {
        headers: {
          Authorization: `Bearer ${tokens.regular.token}`,
        },
      },
    );

    assertEquals(response.status, 200);
    const payload = await response.json();
    const resultData = payload[0]?.result?.data ?? [];
    assertEquals(Array.isArray(resultData), true);

    const enriched = resultData.find((skill: { id: string }) =>
      skill.id === insertedSkill.id
    );

    assertExists(enriched, "Inserted skill should be returned by API");
    assertEquals(enriched.taxonomy, "csi");
    assertEquals(
      enriched.displayCode,
      csiSkill.code_display,
    );
    assertEquals(enriched.taxonomyLabel, "CSI MasterFormat");
    assertStringIncludes(
      enriched.label ?? "",
      enriched.displayCode ?? "",
      "Label should include display code",
    );
    assertStringIncludes(
      enriched.label ?? "",
      enriched.name ?? "",
      "Label should include skill name",
    );
  } finally {
    await admin.schema("core").from("user_skills").delete().eq(
      "id",
      insertedSkill.id,
    );
  }
  },
});

Deno.test({
  name: "User Profile - Years of experience calculation merges overlapping periods",
  sanitizeResources: false,
  sanitizeOps: false,
  async fn() {
  const tokens = await loadCachedTokens();
  if (!tokens) {
    console.log("⚠️  Skipping experience calculation test - no cached tokens");
    return;
  }

  const admin = createAdminClient();
  const TEST_USER_ID = tokens.regular.userId;

  const { data: insertedRows, error: insertError } = await admin
    .schema("core")
    .from("user_experience")
    .insert([
      {
        user_id: TEST_USER_ID,
        job_title: "Test Role A",
        company_name: "Overlap Inc",
        start_date: "2020-01-01",
        end_date: "2021-01-01",
      },
      {
        user_id: TEST_USER_ID,
        job_title: "Test Role B",
        company_name: "Overlap Inc",
        start_date: "2020-06-01",
        end_date: "2021-06-01",
      },
    ])
    .select();

  if (insertError || !insertedRows || insertedRows.length === 0) {
    console.log(
      "⚠️  Skipping experience calculation test - unable to insert experience rows",
      insertError?.message,
    );
    return;
  }

  try {
    const { data: calculatedYears, error: calcError } = await admin.rpc(
      "calculate_years_of_experience",
      { p_user_id: TEST_USER_ID },
    );

    if (calcError?.code === "PGRST202") {
      console.log(
        "⚠️  Skipping experience calculation test - calculate_years_of_experience function not available",
      );
      return;
    }

    if (calcError) {
      throw calcError;
    }

    assertExists(calculatedYears, "Calculated years of experience should not be null");
    assertEquals(Number(calculatedYears?.toFixed(1)), 1.5, "Overlapping periods should be merged");

    const { data: userRecord, error: userError } = await admin
      .schema("core")
      .from("users")
      .select("years_of_experience")
      .eq("id", TEST_USER_ID)
      .maybeSingle();

    if (!userError && userRecord) {
      assertEquals(
        userRecord.years_of_experience,
        2,
        "Rounded years_of_experience column should be updated via trigger",
      );
    }
  } finally {
    await admin.schema("core").from("user_experience").delete().in(
      "id",
      insertedRows.map((row: { id: string }) => row.id),
    );
  }
  },
});

Deno.test("User Profile - Get user certifications (tests private schema)", async () => {
  const tokens = await loadCachedTokens();
  if (!tokens) throw new Error("No cached tokens available");
  const regularUserToken = tokens.regular.token;
  const TEST_USER_ID = tokens.regular.userId;

  const response = await fetch(
    `${TRPC_URL}/userProfile.getUserCertifications?batch=1&input=${
      encodeURIComponent(JSON.stringify({
        "0": { userId: TEST_USER_ID },
      }))
    }`,
    {
      headers: {
        Authorization: `Bearer ${regularUserToken}`,
      },
    },
  );

  assertEquals(response.status, 200);
  const data = await response.json();

  assertEquals(Array.isArray(data), true);

  if (data.length > 0) {
    const result = data[0].result;
    if (result.data) {
      assertEquals(Array.isArray(result.data), true);
      console.log(
        `✅ User certifications fetched successfully (${result.data.length} certifications)`,
      );
    }
  } else {
    console.log(
      "✅ User certifications endpoint works (no certifications found for test user)",
    );
  }
});

Deno.test("User Profile - Get user experience (tests private schema)", async () => {
  const tokens = await loadCachedTokens();
  if (!tokens) throw new Error("No cached tokens available");
  const regularUserToken = tokens.regular.token;
  const TEST_USER_ID = tokens.regular.userId;

  const response = await fetch(
    `${TRPC_URL}/userProfile.getUserExperience?batch=1&input=${
      encodeURIComponent(JSON.stringify({
        "0": { userId: TEST_USER_ID },
      }))
    }`,
    {
      headers: {
        Authorization: `Bearer ${regularUserToken}`,
      },
    },
  );

  assertEquals(response.status, 200);
  const data = await response.json();

  assertEquals(Array.isArray(data), true);

  if (data.length > 0) {
    const result = data[0].result;
    if (result.data) {
      assertEquals(Array.isArray(result.data), true);
      console.log(
        `✅ User experience fetched successfully (${result.data.length} experiences)`,
      );
    }
  } else {
    console.log(
      "✅ User experience endpoint works (no experience found for test user)",
    );
  }
});

Deno.test("User Profile - Get user education (tests private schema)", async () => {
  const tokens = await loadCachedTokens();
  if (!tokens) throw new Error("No cached tokens available");
  const regularUserToken = tokens.regular.token;
  const TEST_USER_ID = tokens.regular.userId;

  const response = await fetch(
    `${TRPC_URL}/userProfile.getUserEducation?batch=1&input=${
      encodeURIComponent(JSON.stringify({
        "0": { userId: TEST_USER_ID },
      }))
    }`,
    {
      headers: {
        Authorization: `Bearer ${regularUserToken}`,
      },
    },
  );

  assertEquals(response.status, 200);
  const data = await response.json();

  assertEquals(Array.isArray(data), true);

  if (data.length > 0) {
    const result = data[0].result;
    if (result.data) {
      assertEquals(Array.isArray(result.data), true);
      console.log(
        `✅ User education fetched successfully (${result.data.length} education records)`,
      );
    }
  } else {
    console.log(
      "✅ User education endpoint works (no education found for test user)",
    );
  }
});

Deno.test("User Profile - Batch request (tests all endpoints together)", async () => {
  const tokens = await loadCachedTokens();
  if (!tokens) throw new Error("No cached tokens available");
  const regularUserToken = tokens.regular.token;
  const TEST_USER_ID = tokens.regular.userId;

  const response = await fetch(
    `${TRPC_URL}/userProfile.getUserSkills,userProfile.getUserCertifications,userProfile.getUserExperience,userProfile.getUserEducation?batch=1&input=${
      encodeURIComponent(JSON.stringify({
        "0": { userId: TEST_USER_ID },
        "1": { userId: TEST_USER_ID },
        "2": { userId: TEST_USER_ID },
        "3": { userId: TEST_USER_ID },
      }))
    }`,
    {
      headers: {
        Authorization: `Bearer ${regularUserToken}`,
      },
    },
  );

  assertEquals(response.status, 200);
  const data = await response.json();

  // Should return array of 4 results
  assertEquals(Array.isArray(data), true);
  assertEquals(data.length, 4);

  // Check none of them have errors
  const hasErrors = data.some((item: { error?: unknown }) => item.error);
  assertEquals(hasErrors, false, "Batch request should not have errors");

  console.log("✅ Batch user profile request successful");
  console.log(`   - Skills: ${data[0]?.result?.data?.length || 0}`);
  console.log(`   - Certifications: ${data[1]?.result?.data?.length || 0}`);
  console.log(`   - Experience: ${data[2]?.result?.data?.length || 0}`);
  console.log(`   - Education: ${data[3]?.result?.data?.length || 0}`);
});
