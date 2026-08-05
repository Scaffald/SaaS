/**
 * Tests for the applications status vocabulary boundary.
 *
 * `core.applications.status` is TEXT constrained by `applications_status_check`
 * (migration 112) to the DB vocabulary. The REST surface publishes a different
 * vocabulary. Read went through STATUS_API_TO_DB; write spread the request body
 * straight into .update(), so an API name reached the column and the two names
 * that differ — `pending` and `reviewing` — failed the CHECK with a 500. The
 * remaining five only worked because both vocabularies spell them the same.
 *
 * Verified against the live local database before writing these:
 *   UPDATE core.applications SET status='pending'  -> rejected (check_violation)
 *   UPDATE core.applications SET status='reviewing'-> rejected (check_violation)
 *   UPDATE core.applications SET status='new'      -> accepted
 *   UPDATE core.applications SET status='inquired' -> accepted
 *
 * These are pure-function tests so they do not depend on the shared auth
 * fixtures, which are red for unrelated ES256/auth.uid() reasons.
 */

import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  API_STATUSES,
  buildApplicationUpdatePayload,
  DB_STATUSES,
  mapDbStatus,
  STATUS_API_TO_DB,
  STATUS_DB_TO_API,
  withApiStatus,
} from "../../routes/applications.ts";

/**
 * The exact CHECK constraint contents from
 * migration 112_req_221_inquiry_schema_expansion.sql. Hardcoded rather than
 * derived from DB_STATUSES: if someone edits DB_STATUSES without a migration,
 * this must fail rather than agree with itself.
 */
const CHECK_CONSTRAINT_VALUES = [
  "new",
  "screen",
  "inquired",
  "interview",
  "offer",
  "hired",
  "rejected",
  "withdrawn",
];

Deno.test("DB_STATUSES matches the applications_status_check constraint", () => {
  assertEquals([...DB_STATUSES].sort(), [...CHECK_CONSTRAINT_VALUES].sort());
});

Deno.test("every API status maps to a value the CHECK constraint accepts", () => {
  for (const apiStatus of API_STATUSES) {
    const dbStatus = STATUS_API_TO_DB[apiStatus];
    assert(
      CHECK_CONSTRAINT_VALUES.includes(dbStatus),
      `${apiStatus} -> ${dbStatus}, which the CHECK constraint rejects`,
    );
  }
});

Deno.test("the two statuses that used to 500 map to distinct DB names", () => {
  // These are the regression. Writing them unmapped violated the constraint.
  assertEquals(STATUS_API_TO_DB.pending, "new");
  assertEquals(STATUS_API_TO_DB.reviewing, "screen");
});

Deno.test("inquired survives the round trip in both directions", () => {
  // The office kanban sends `inquired` and the DB accepts it, but it was
  // missing from applicationUpdateSchema's enum, so the request 400'd.
  assertEquals(STATUS_API_TO_DB.inquired, "inquired");
  assertEquals(STATUS_DB_TO_API.inquired, "inquired");
  assert(API_STATUSES.includes("inquired"));
});

Deno.test("API -> DB -> API is lossless for every status", () => {
  for (const apiStatus of API_STATUSES) {
    assertEquals(mapDbStatus(STATUS_API_TO_DB[apiStatus]), apiStatus);
  }
});

Deno.test("DB -> API -> DB is lossless for every status", () => {
  for (const dbStatus of DB_STATUSES) {
    assertEquals(STATUS_API_TO_DB[STATUS_DB_TO_API[dbStatus]], dbStatus);
  }
});

Deno.test("withApiStatus translates a row and leaves other fields alone", () => {
  const row = { id: "abc", status: "new", job_id: "job-1", score: 42 };

  assertEquals(withApiStatus(row), {
    id: "abc",
    status: "pending",
    job_id: "job-1",
    score: 42,
  });
});

Deno.test("withApiStatus is what write handlers must return", () => {
  // POST created rows with DB status "new" and returned them raw, so the
  // response said `new` while applicationResponseSchema declares the API enum.
  assertEquals(withApiStatus({ status: "new" }).status, "pending");
  assertEquals(withApiStatus({ status: "screen" }).status, "reviewing");
  assertEquals(withApiStatus({ status: "withdrawn" }).status, "withdrawn");
});

// ─────────────────────────────────────────────────────────────────────────
// The PATCH write path. This is the regression: the maps above were always
// correct, the handler simply did not use them.
// ─────────────────────────────────────────────────────────────────────────

const NOW = "2026-08-04T12:00:00.000Z";

Deno.test("update payload writes DB status names, never API names", () => {
  for (const apiStatus of API_STATUSES) {
    const payload = buildApplicationUpdatePayload({ status: apiStatus }, NOW);

    assert(
      CHECK_CONSTRAINT_VALUES.includes(payload.status as string),
      `PATCH {status:"${apiStatus}"} would write "${payload.status}", ` +
        `which applications_status_check rejects`,
    );
  }
});

Deno.test("update payload maps the two statuses that used to 500", () => {
  // `{ ...input }` wrote "pending"/"reviewing" verbatim and the CHECK
  // constraint rejected both.
  assertEquals(
    buildApplicationUpdatePayload({ status: "pending" }, NOW).status,
    "new",
  );
  assertEquals(
    buildApplicationUpdatePayload({ status: "reviewing" }, NOW).status,
    "screen",
  );
});

Deno.test("update payload omits status entirely when none was sent", () => {
  const payload = buildApplicationUpdatePayload({ years_experience: 7 }, NOW);

  assert(!("status" in payload), "must not write a status the caller omitted");
  assertEquals(payload.years_experience, 7);
  assertEquals(payload.updated_at, NOW);
});

Deno.test("update payload passes non-status fields through untouched", () => {
  const payload = buildApplicationUpdatePayload(
    {
      status: "interview",
      current_location: "Denver, CO",
      willing_to_relocate: true,
      completed_steps: ["screening"],
    },
    NOW,
  );

  assertEquals(payload, {
    status: "interview",
    current_location: "Denver, CO",
    willing_to_relocate: true,
    completed_steps: ["screening"],
    updated_at: NOW,
  });
});
