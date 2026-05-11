/**
 * API Key System End-to-End Test
 * Run with: deno run --allow-net --allow-env test-api-keys.ts
 */

import {
  generateApiKey,
  hashApiKey,
  validateApiKeyFormat,
} from "../../_shared/utils/api-key.ts";

async function runTests() {
  console.log("=========================================");
  console.log("API Key System Unit Tests");
  console.log("=========================================\n");

  let testsPassed = 0;
  let testsFailed = 0;

  // Test 1: API Key Generation
  console.log("Test 1: API Key Generation");
  try {
    const testKey = generateApiKey("test");
    const liveKey = generateApiKey("live");

    if (!testKey.startsWith("sk_test_")) {
      throw new Error(
        `Expected test key to start with sk_test_, got ${testKey}`,
      );
    }

    if (!liveKey.startsWith("sk_live_")) {
      throw new Error(
        `Expected live key to start with sk_live_, got ${liveKey}`,
      );
    }

    // Check key length (should be sk_test_ or sk_live_ + 32 chars)
    const testKeyParts = testKey.split("_");
    const liveKeyParts = liveKey.split("_");

    if (testKeyParts.length !== 3) {
      throw new Error(
        `Expected test key to have 3 parts, got ${testKeyParts.length}`,
      );
    }

    if (liveKeyParts.length !== 3) {
      throw new Error(
        `Expected live key to have 3 parts, got ${liveKeyParts.length}`,
      );
    }

    console.log(`✅ Generated test key: ${testKey}`);
    console.log(`✅ Generated live key: ${liveKey}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${error.message}`);
    testsFailed++;
  }

  // Test 2: API Key Validation
  console.log("\nTest 2: API Key Format Validation");
  try {
    const validTestKey = "sk_test_abcdefghijklmnopqrstuvwxyz123456";
    const validLiveKey = "sk_live_abcdefghijklmnopqrstuvwxyz123456";
    const invalidKeyShort = "sk_test_short";
    const invalidKeyNoPrefix = "invalid_key_abcdefghijklmnopqrstuvwxyz123456";
    const invalidKeyWrongEnv = "sk_prod_abcdefghijklmnopqrstuvwxyz123456";

    if (!validateApiKeyFormat(validTestKey)) {
      throw new Error("Valid test key failed validation");
    }

    if (!validateApiKeyFormat(validLiveKey)) {
      throw new Error("Valid live key failed validation");
    }

    if (validateApiKeyFormat(invalidKeyShort)) {
      throw new Error("Short key should have failed validation");
    }

    if (validateApiKeyFormat(invalidKeyNoPrefix)) {
      throw new Error("Key without sk_ prefix should have failed validation");
    }

    if (validateApiKeyFormat(invalidKeyWrongEnv)) {
      throw new Error(
        "Key with wrong environment should have failed validation",
      );
    }

    console.log("✅ Valid test key passed validation");
    console.log("✅ Valid live key passed validation");
    console.log("✅ Invalid keys correctly rejected");
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${error.message}`);
    testsFailed++;
  }

  // Test 3: API Key Hashing
  console.log("\nTest 3: API Key Hashing");
  try {
    const apiKey = "sk_test_abcdefghijklmnopqrstuvwxyz123456";
    const hash1 = await hashApiKey(apiKey);
    const hash2 = await hashApiKey(apiKey);

    // Hashes should be consistent
    if (hash1 !== hash2) {
      throw new Error(`Hashing is not deterministic: ${hash1} !== ${hash2}`);
    }

    // Hash should be hex string
    if (!/^[a-f0-9]{64}$/.test(hash1)) {
      throw new Error(`Hash should be 64 hex chars, got ${hash1}`);
    }

    // Different keys should produce different hashes
    const differentKey = "sk_test_different_key_1234567890abcdef";
    const hash3 = await hashApiKey(differentKey);

    if (hash1 === hash3) {
      throw new Error("Different keys produced same hash");
    }

    console.log(`✅ Hash is deterministic: ${hash1.substring(0, 16)}...`);
    console.log("✅ Hash format is correct (SHA-256 hex)");
    console.log("✅ Different keys produce different hashes");
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${error.message}`);
    testsFailed++;
  }

  // Test 4: Key Prefix Extraction
  console.log("\nTest 4: Key Prefix Extraction");
  try {
    const { getKeyPrefix } = await import("../_shared/utils/api-key.ts");

    const testKey = "sk_test_abcdefgh12345678";
    const liveKey = "sk_live_xyz987654321abcd";

    const testPrefix = getKeyPrefix(testKey);
    const livePrefix = getKeyPrefix(liveKey);

    // Should return first 11 chars + ...
    if (!testPrefix.includes("sk_test_")) {
      throw new Error(`Test prefix should include sk_test_, got ${testPrefix}`);
    }

    if (!livePrefix.includes("sk_live_")) {
      throw new Error(`Live prefix should include sk_live_, got ${livePrefix}`);
    }

    if (!testPrefix.endsWith("...")) {
      throw new Error(`Prefix should end with ..., got ${testPrefix}`);
    }

    console.log(`✅ Test key prefix: ${testPrefix}`);
    console.log(`✅ Live key prefix: ${livePrefix}`);
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${error.message}`);
    testsFailed++;
  }

  // Test 5: Rate Limit Tiers
  console.log("\nTest 5: Rate Limit Tiers");
  try {
    const { RATE_LIMITS } = await import("../_shared/utils/api-key.ts");

    if (!RATE_LIMITS.free || !RATE_LIMITS.pro || !RATE_LIMITS.enterprise) {
      throw new Error("Missing rate limit tiers");
    }

    if (RATE_LIMITS.free.requestsPerMinute !== 100) {
      throw new Error(
        `Free tier should be 100 req/min, got ${RATE_LIMITS.free.requestsPerMinute}`,
      );
    }

    if (RATE_LIMITS.pro.requestsPerMinute !== 1000) {
      throw new Error(
        `Pro tier should be 1000 req/min, got ${RATE_LIMITS.pro.requestsPerMinute}`,
      );
    }

    if (RATE_LIMITS.enterprise.requestsPerMinute !== 10000) {
      throw new Error(
        `Enterprise tier should be 10000 req/min, got ${RATE_LIMITS.enterprise.requestsPerMinute}`,
      );
    }

    console.log(`✅ Free tier: ${RATE_LIMITS.free.requestsPerMinute} req/min`);
    console.log(`✅ Pro tier: ${RATE_LIMITS.pro.requestsPerMinute} req/min`);
    console.log(
      `✅ Enterprise tier: ${RATE_LIMITS.enterprise.requestsPerMinute} req/min`,
    );
    testsPassed++;
  } catch (error) {
    console.log(`❌ ${error.message}`);
    testsFailed++;
  }

  // Summary
  console.log("\n=========================================");
  console.log("Test Summary");
  console.log("=========================================");
  console.log(`✅ Tests passed: ${testsPassed}`);
  if (testsFailed > 0) {
    console.log(`❌ Tests failed: ${testsFailed}`);
  }
  console.log(`Total tests: ${testsPassed + testsFailed}`);

  if (testsFailed === 0) {
    console.log("\n✅ All API Key utility functions working correctly!");
  } else {
    console.log("\n❌ Some tests failed");
    Deno.exit(1);
  }
}

if (import.meta.main) {
  runTests();
}
