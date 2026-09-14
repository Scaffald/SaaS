/**
 * A policy that names a role which cannot reach the table is not a policy.
 *
 * RLS decides which rows a role may see. A GRANT decides whether it may touch
 * the table at all. Write the policy, forget the grant, and the table answers
 * `permission denied` — which surfaces through the API as a 401 or a 500, never
 * as anything pointing at the cause. Postgres does say so, in a hint nobody
 * sees:
 *
 *   permission denied for table review_pins
 *   HINT: Grant the required privileges to the current role with:
 *         GRANT SELECT ON core.review_pins TO authenticated;
 *
 * This has been fixed one table at a time — migrations 332, 335, 347, 352, 355
 * and now 356 — each found by an endpoint failing somewhere a person happened
 * to look. #755 was found by loading a public profile in a browser; the
 * pinned-reviews feature had never worked in any environment.
 *
 * The check asks the database the question a user's request asks: can this role
 * actually read this table? That is truer than reading the catalogue, because
 * it also catches a table whose grant exists but whose policy predicate reads
 * something the role cannot see — exactly core.user_skills below.
 */
import {
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import { TEST_SUPABASE_ANON_KEY, TEST_SUPABASE_URL } from "../setup.ts";

/**
 * core tables a policy opens to `anon`, and which the product therefore expects
 * a signed-out visitor to be able to read.
 *
 * Explicit rather than derived: pg_policies is not reachable through PostgREST,
 * and probing every table would mostly assert things nobody publishes. Add a
 * table here when a migration opens it to anon.
 */
const ANON_READABLE = ["review_pins", "reviews"] as const;

/**
 * Open to `anon` by policy, and still unreadable — where a grant is the wrong
 * fix.
 *
 * core.user_skills carries user_skills_select_public for `anon`, but its
 * predicate reads core.preferences to check profile_visibility -> skills, and
 * `anon` cannot read that table either. Granting SELECT on user_skills alone
 * only moves the error to core.preferences, and granting *that* would expose
 * every user's preferences to anonymous readers. It needs a SECURITY DEFINER
 * helper for the visibility lookup — a design change, not a missing grant, so
 * it is filed rather than papered over. The API path is unaffected: the public
 * skills widget reads through the service client behind an explicit visibility
 * check (#732).
 */
const KNOWN_UNREACHABLE: ReadonlyArray<string> = ["user_skills"];

async function anonCanRead(table: string): Promise<number> {
  const res = await fetch(
    `${TEST_SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`,
    { headers: { apikey: TEST_SUPABASE_ANON_KEY, "Accept-Profile": "core" } },
  );
  const status = res.status;
  await res.body?.cancel();
  return status;
}

Deno.test("every core table a policy opens to anon is actually readable by anon", async () => {
  const refused: string[] = [];

  for (const table of ANON_READABLE) {
    if (KNOWN_UNREACHABLE.includes(table)) continue;
    const status = await anonCanRead(table);
    if (status === 401 || status === 403) refused.push(`${table} -> ${status}`);
  }

  assertEquals(refused, []);
});

Deno.test("the probe distinguishes refused from merely empty", async () => {
  // Guarding the guard. A table that exists, is granted, and holds no rows
  // answers 200 with []. If this ever stopped being true the test above would
  // pass for the wrong reason — a refusal would look like an empty table.
  const status = await anonCanRead("review_pins");

  assertEquals(status, 200);
});

Deno.test("user_skills is still unreachable, and for the documented reason", async () => {
  // Pinned as a known gap rather than silently skipped: when somebody fixes the
  // predicate, this fails and the exception gets removed instead of rotting.
  const status = await anonCanRead("user_skills");

  assertEquals(
    status === 401 || status === 403,
    true,
    "user_skills became anon-readable — remove it from KNOWN_UNREACHABLE",
  );
});
