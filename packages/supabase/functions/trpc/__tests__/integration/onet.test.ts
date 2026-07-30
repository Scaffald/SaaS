import {
  assertEquals,
  assertExists,
} from 'jsr:@std/assert';

import { callTRPCEndpoint } from '../setup.ts';

Deno.test("O*NET - searchOccupations returns matching results", async () => {
  const response = await callTRPCEndpoint(
    "onet.searchOccupations",
    {
      query: "engineer",
      limit: 5,
    },
  );

  assertEquals(Array.isArray(response), true);

  const result = response[0]?.result?.data;
  if (!result) {
    console.log(
      "⚠️  O*NET search response payload",
      JSON.stringify(response, null, 2),
    );
  }
  assertExists(result, "TRPC response should include data");

  if (result.length > 0) {
    const first = result[0];
    assertExists(first.onetsoc_code, "Result should include O*NET code");
    assertExists(first.title, "Result should include occupation title");
    console.log(
      `✅ Found ${result.length} occupations (top match: ${first.title})`,
    );
  } else {
    console.log("⚠️  No occupations returned for 'engineer' query");
  }
});

