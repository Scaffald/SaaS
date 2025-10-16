import { assertEquals } from "jsr:@std/assert";
import { loadCachedTokens } from "../setup.ts";

const TRPC_URL = "http://127.0.0.1:54321/functions/v1/trpc";

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
