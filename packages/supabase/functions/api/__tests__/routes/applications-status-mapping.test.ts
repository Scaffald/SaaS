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
  const payload = buildApplicationUpdatePayload({ completed_steps: [] }, NOW);

  assert(!("status" in payload), "must not write a status the caller omitted");
  assertEquals(payload.completed_steps, []);
  assertEquals(payload.updated_at, NOW);
});

Deno.test("update payload maps status and folds screening in one pass", () => {
  // This test previously asserted that current_location and
  // willing_to_relocate passed through as columns. They are not columns — see
  // the screening-fields section below — so it was encoding the #546 bug.
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
    completed_steps: ["screening"],
    screening_answers: {
      current_location: "Denver, CO",
      willing_to_relocate: true,
    },
    updated_at: NOW,
  });
});

// ─────────────────────────────────────────────────────────────────────────
// Flat screening fields (#546). The schema exposes five of them as top-level
// fields, but they are not columns — they live inside the screening_answers
// JSONB. The create handler folds them in; update passed them through, so
// PATCH {"years_experience": 9} failed with "Could not find the
// 'years_experience' column". Five advertised fields that could never be set.
// ─────────────────────────────────────────────────────────────────────────

Deno.test("a flat screening field lands inside screening_answers", () => {
  const payload = buildApplicationUpdatePayload({ years_experience: 9 }, NOW);

  assert(
    !("years_experience" in payload),
    "years_experience must not be written as a column",
  );
  assertEquals(payload.screening_answers, { years_experience: 9 });
});

Deno.test("updating one screening field preserves the others", () => {
  // A replace here would silently drop the applicant's other answers.
  const payload = buildApplicationUpdatePayload(
    { years_experience: 9 },
    NOW,
    { current_location: "Denver, CO", is_authorized_to_work: true },
  );

  assertEquals(payload.screening_answers, {
    current_location: "Denver, CO",
    is_authorized_to_work: true,
    years_experience: 9,
  });
});

Deno.test("all five flat fields are folded, none written as columns", () => {
  const payload = buildApplicationUpdatePayload({
    current_location: "Denver, CO",
    willing_to_relocate: true,
    years_experience: 9,
    is_authorized_to_work: true,
    earliest_start_date: "2026-09-01",
  }, NOW);

  for (
    const field of [
      "current_location",
      "willing_to_relocate",
      "years_experience",
      "is_authorized_to_work",
      "earliest_start_date",
    ]
  ) {
    assert(!(field in payload), `${field} leaked out as a column`);
  }

  assertEquals(
    Object.keys(payload.screening_answers as Record<string, unknown>).sort(),
    [
      "current_location",
      "earliest_start_date",
      "is_authorized_to_work",
      "willing_to_relocate",
      "years_experience",
    ],
  );
});

Deno.test("an explicit screening_answers object still works, and flat wins", () => {
  const payload = buildApplicationUpdatePayload(
    {
      screening_answers: { years_experience: 3, note: "keep" },
      years_experience: 9,
    },
    NOW,
  );

  assertEquals(payload.screening_answers, {
    years_experience: 9,
    note: "keep",
  });
});

Deno.test("real columns still pass straight through", () => {
  // This asserted `payload.is_complete === true`, treating it as a column. It
  // is not one, and passing it through is what made every submit-via-PATCH
  // fail — so the test was encoding the bug. Corrected rather than deleted.
  const payload = buildApplicationUpdatePayload(
    { completed_steps: ["screening"], is_complete: true },
    NOW,
  );

  assertEquals(payload.completed_steps, ["screening"]);
  assert(!("is_complete" in payload), "is_complete is not a column");
  assert(
    !("screening_answers" in payload),
    "must not invent a screening write",
  );
});

// ─────────────────────────────────────────────────────────────────────────
// Webhook payloads (#541). They used to carry the row verbatim, so a consumer
// polling GET /v1/applications/{id} saw `pending` while the webhook for the
// same row said `new` — one field, one resource, two vocabularies.
// ─────────────────────────────────────────────────────────────────────────

Deno.test("a webhook payload speaks the same vocabulary as the REST response", () => {
  // Both surfaces go through withApiStatus, so this is the invariant that
  // keeps them from drifting apart again.
  const row = { id: "app_1", status: "new", job_id: "job_1" };

  const restBody = withApiStatus(row);
  const webhookData = withApiStatus(row);

  assertEquals(webhookData.status, restBody.status);
  assertEquals(webhookData.status, "pending");
});

Deno.test("no DB status name survives into a webhook payload", () => {
  for (const dbStatus of DB_STATUSES) {
    const delivered = withApiStatus({ status: dbStatus }).status;

    assert(
      API_STATUSES.includes(delivered),
      `a webhook would deliver "${delivered}", which is not an API status`,
    );
  }

  // The two that actually differ — the rest coincide and prove nothing.
  assertEquals(withApiStatus({ status: "new" }).status, "pending");
  assertEquals(withApiStatus({ status: "screen" }).status, "reviewing");
});

// ─────────────────────────────────────────────────────────────────────────
// Phantom fields (#534, widening #546).
//
// applicationUpdateSchema accepts twelve fields; only screening_answers and
// completed_steps are columns. #546 mapped the five flat screening answers by
// name, which left custom_question_answers, attachments, is_complete, notes
// and metadata still reaching .update() and failing the whole request:
//
//   Could not find the 'is_complete' column of 'applications'
//
// Verified against the live schema: 9 of the 12 are not columns.
// ─────────────────────────────────────────────────────────────────────────

Deno.test("is_complete never reaches the update payload", () => {
  // It is a submission signal that drives scoring, not a stored field. While
  // it was passed through, every submit-via-PATCH failed.
  const payload = buildApplicationUpdatePayload({ is_complete: true }, NOW);

  assert(!("is_complete" in payload), "is_complete is not a column");
  assertEquals(payload.updated_at, NOW);
});

Deno.test("notes and metadata are dropped rather than written", () => {
  const payload = buildApplicationUpdatePayload(
    { notes: { a: 1 }, metadata: { b: 2 } },
    NOW,
  );

  assert(!("notes" in payload));
  assert(!("metadata" in payload));
});

Deno.test("attachments is written under its real column name", () => {
  const payload = buildApplicationUpdatePayload(
    { attachments: { resume: { path: "r.pdf" } } },
    NOW,
  );

  assert(!("attachments" in payload), "the column is attachment_metadata");
  assertEquals(payload.attachment_metadata, { resume: { path: "r.pdf" } });
});

Deno.test("custom_question_answers is folded into screening_answers", () => {
  const payload = buildApplicationUpdatePayload(
    { custom_question_answers: [{ question: "Why?", answer: "Because" }] },
    NOW,
  );

  assert(!("custom_question_answers" in payload));
  assertEquals(
    (payload.screening_answers as Record<string, unknown>)
      .custom_question_answers,
    [{ question: "Why?", answer: "Because" }],
  );
});

Deno.test("nothing outside the known columns ever reaches the payload", () => {
  // The allow-list is the point: a schema field added without a column must
  // fail at this boundary, not at PostgREST with the whole request rejected.
  const payload = buildApplicationUpdatePayload(
    { totally_invented_field: "x", another_one: 1, completed_steps: ["a"] },
    NOW,
  );

  assertEquals(Object.keys(payload).sort(), ["completed_steps", "updated_at"]);
});
