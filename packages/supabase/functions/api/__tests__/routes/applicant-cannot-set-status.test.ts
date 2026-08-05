/**
 * The applicant-facing update schema must not accept `status`.
 *
 * PATCH /v1/applications/{id} authorises on `application.user_id === auth user`
 * and otherwise only checks that the current status is `new` or `screen` —
 * exactly where a fresh application sits. While the schema accepted `status`,
 * an applicant could promote themselves to `hired`. Reproduced against a live
 * local API: the PATCH returned 200 and `core.applications.status` read
 * `hired`.
 *
 * This is a schema-level guarantee, so it is tested at the schema.
 */

import {
  assert,
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  applicationFilterSchema,
  applicationUpdateSchema,
} from "../../../_shared/application-schemas.ts";

const APP_ID = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";

Deno.test("the applicant update schema declares no status field", () => {
  assertFalse(
    "status" in applicationUpdateSchema.shape,
    "status is back on the applicant schema — an applicant can self-promote",
  );
});

Deno.test("a status sent by an applicant is stripped, not written", () => {
  const parsed = applicationUpdateSchema.parse({
    application_id: APP_ID,
    status: "hired",
  });

  assertFalse(
    "status" in parsed,
    "status survived parsing and would reach the .update() payload",
  );
});

Deno.test("every promotable status is stripped, not just hired", () => {
  for (const status of ["reviewing", "interview", "offer", "hired"]) {
    const parsed = applicationUpdateSchema.parse({
      application_id: APP_ID,
      status,
    });
    assertFalse("status" in parsed, `${status} was not stripped`);
  }
});

Deno.test("the applicant's legitimate fields still pass through", () => {
  // Removing status must not have narrowed the endpoint's real purpose.
  const parsed = applicationUpdateSchema.parse({
    application_id: APP_ID,
    screening_answers: { years_experience: 9 },
    completed_steps: ["screening"],
    is_complete: true,
  });

  assertEquals(parsed.completed_steps, ["screening"]);
  assertEquals(parsed.is_complete, true);
  assert(parsed.screening_answers);
});

Deno.test("the read-side filter schema keeps status", () => {
  // Filtering a list by status is not a privilege — only writing one is.
  const parsed = applicationFilterSchema.parse({ status: "hired" });
  assertEquals(parsed.status, "hired");
});
