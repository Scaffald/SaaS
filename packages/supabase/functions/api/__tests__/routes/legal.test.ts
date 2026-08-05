/**
 * Legal documents REST API Tests
 * Tests for /v1/legal (public, unauthenticated) — current legal document versions.
 */

import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { assertStatus, createTestClient } from "../helpers/test-client.ts";
import { markTestStart } from "../setup.ts";

Deno.test("GET /v1/legal - returns both current documents without auth", async () => {
  markTestStart();

  const client = createTestClient();
  client.setAuthToken("");
  const response = await client.get("/v1/legal", {
    headers: { Authorization: "" },
  });

  assertStatus(response, 200);
  const body = response.body as {
    documents: Array<{
      doc_type: string;
      version: string;
      effective_at: string;
      url: string;
    }>;
  };
  assert(Array.isArray(body.documents));
  assertEquals(body.documents.length, 2);

  const types = body.documents.map((d) => d.doc_type).sort();
  assertEquals(types, ["privacy_policy", "terms_of_service"]);

  for (const doc of body.documents) {
    assert(doc.version.length > 0, "version must be non-empty");
    assert(doc.effective_at.length > 0, "effective_at must be non-empty");
    assert(doc.url.startsWith("/"), "url must be app-relative");
  }
});
