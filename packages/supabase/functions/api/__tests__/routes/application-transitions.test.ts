/**
 * Tests for the server-side pipeline transition rules (#530).
 *
 * This table existed only in the client before
 * (`useApplicationStatusChange.isValidTransition`), which made it advisory:
 * it shaped what the kanban offered, but anything calling the API directly
 * could move a candidate from `new` straight to `hired`, or resurrect a
 * rejected one. The negative cases below are the point.
 */

import {
  assert,
  assertEquals,
  assertFalse,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  ALLOWED_TRANSITIONS,
  checkTransition,
  TERMINAL_STATUSES,
} from "../../lib/application-transitions.ts";
import { DB_STATUSES } from "../../routes/applications.ts";

Deno.test("every DB status has a transition rule", () => {
  // A status missing from the table would fall through to `?? []` and become
  // silently un-movable, which is a confusing way to discover a gap.
  for (const status of DB_STATUSES) {
    assert(
      status in ALLOWED_TRANSITIONS,
      `${status} has no entry in ALLOWED_TRANSITIONS`,
    );
  }
});

Deno.test("every transition target is itself a real status", () => {
  for (const [from, targets] of Object.entries(ALLOWED_TRANSITIONS)) {
    for (const target of targets) {
      assert(
        DB_STATUSES.includes(target),
        `${from} -> ${target} names a status that does not exist`,
      );
    }
  }
});

Deno.test("the happy path walks the whole pipeline", () => {
  const path = ["new", "screen", "interview", "offer", "hired"];

  for (let i = 0; i < path.length - 1; i++) {
    const result = checkTransition(path[i], path[i + 1]);
    assert(result.allowed, `${path[i]} -> ${path[i + 1]} should be allowed`);
  }
});

Deno.test("the inquiry stage sits between screen and interview", () => {
  assert(checkTransition("screen", "inquired").allowed);
  assert(checkTransition("inquired", "interview").allowed);
  assert(checkTransition("inquired", "offer").allowed);
});

Deno.test("any live stage can be rejected", () => {
  for (const from of ["new", "screen", "inquired", "interview", "offer"]) {
    assert(
      checkTransition(from, "rejected").allowed,
      `${from} -> rejected should be allowed`,
    );
  }
});

Deno.test("stages cannot be skipped", () => {
  // The case the client-only check could not enforce.
  assertFalse(checkTransition("new", "hired").allowed);
  assertFalse(checkTransition("new", "offer").allowed);
  assertFalse(checkTransition("new", "interview").allowed);
  assertFalse(checkTransition("screen", "hired").allowed);
});

Deno.test("the pipeline does not run backwards", () => {
  assertFalse(checkTransition("interview", "screen").allowed);
  assertFalse(checkTransition("offer", "interview").allowed);
  assertFalse(checkTransition("screen", "new").allowed);
});

Deno.test("terminal states are terminal", () => {
  for (const from of TERMINAL_STATUSES) {
    for (const to of DB_STATUSES) {
      if (to === from) continue;
      const result = checkTransition(from, to);
      assertFalse(
        result.allowed,
        `${from} -> ${to} should be refused; ${from} is terminal`,
      );
    }
  }
});

Deno.test("a rejected candidate cannot be resurrected", () => {
  assertFalse(checkTransition("rejected", "interview").allowed);
  assertFalse(checkTransition("rejected", "new").allowed);
  assertFalse(checkTransition("hired", "offer").allowed);
});

Deno.test("withdrawn is not an employer move from anywhere", () => {
  // Withdrawal is the applicant's, via POST /{id}/withdraw. No employer PATCH
  // should be able to mark someone as having withdrawn on their behalf.
  for (const from of DB_STATUSES) {
    if (from === "withdrawn") continue;
    assertFalse(
      checkTransition(from, "withdrawn").allowed,
      `${from} -> withdrawn should not be an employer move`,
    );
  }
});

Deno.test("a no-op move is allowed so retries stay idempotent", () => {
  for (const status of DB_STATUSES) {
    assert(
      checkTransition(status, status).allowed,
      `${status} -> ${status} should be a no-op, not a rejection`,
    );
  }
});

Deno.test("an unrecognised current status is refused, not assumed", () => {
  const result = checkTransition("banana", "interview");

  assertFalse(result.allowed);
  assert(result.reason?.includes("unrecognised"));
});

Deno.test("refusals explain themselves", () => {
  // The message goes to the caller, so it has to say something useful.
  assertEquals(
    checkTransition("new", "hired").reason,
    "Cannot move from new to hired",
  );
  assertEquals(
    checkTransition("hired", "offer").reason,
    "Cannot move an application out of hired",
  );
});
