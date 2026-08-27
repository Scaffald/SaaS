/**
 * Rules for two endpoints that returned 500 for every caller — one because the
 * table it reads grants nothing to the roles the API uses, the other because it
 * read a table that has never existed.
 *
 * Both fixes hinge on a detail that is easy to undo by accident, so each is
 * pinned here rather than left to the route file.
 */
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

const ORGANIZATIONS = new URL("../../routes/organizations.ts", import.meta.url);
const REVIEW_LINKS = new URL("../../routes/review-links.ts", import.meta.url);
const MIGRATION = new URL(
  "../../../../migrations/347_review_links_grants_and_policies.sql",
  import.meta.url,
);

const read = (url: URL) => Deno.readTextFile(url);

/** Source with comments stripped — they name the very things being asserted gone. */
function code(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

Deno.test("the members list reads role_assignments, not a table that never existed", async () => {
  const source = code(await read(ORGANIZATIONS));

  assertEquals(source.includes('from("organization_members")'), false);
  assert(
    source.includes('from("role_assignments")'),
    "organization membership is a role scoped to the org",
  );
});

Deno.test("the members list reads with the service client, gated first", async () => {
  const source = code(await read(ORGANIZATIONS));
  const members = source.slice(source.indexOf('path: "/{id}/members"'));
  const handler = members.slice(0, members.indexOf("app.openapi("));

  // role_assignments carries one policy — user_id = auth.uid() — so the user's
  // own client sees exactly one row and the list silently returns a
  // one-member organization.
  assert(
    handler.includes("getServiceClient()"),
    "the user client can only see the caller's own assignment",
  );
  // Which is only safe because membership is not public.
  assert(
    handler.indexOf("canReadOrgInternals") < handler.indexOf("getServiceClient()"),
    "the access check must run before the service client reads anything",
  );
  assert(handler.includes("Organization not found"), "a non-member gets 404");
});

Deno.test("members are grouped per user, not per role assignment", async () => {
  const source = code(await read(ORGANIZATIONS));

  // A person can hold several roles in one organization; the seeded Unicorn org
  // has 15 assignments across 11 people, including duplicate admin rows.
  assert(
    source.includes("byUser"),
    "assignments must collapse to one entry per person",
  );
});

Deno.test("member search does not filter on a uuid column", async () => {
  const source = code(await read(ORGANIZATIONS));

  // The previous version ran `ilike` against user_id, which could only ever
  // match nothing.
  assertEquals(/ilike\(\s*"user_id"/.test(source), false);
});

Deno.test("firstOf is imported, not assumed", async () => {
  const source = await read(ORGANIZATIONS);

  // It was defined privately in work-logs.ts. Referencing it here without an
  // import typechecks under the current (broken) deno config and throws at
  // runtime, which is how it reached a live probe.
  assert(
    source.includes('from "../lib/postgrest.ts"'),
    "firstOf must come from the shared lib",
  );
});

Deno.test("the review-links list filters by subject as well as trusting RLS", async () => {
  const source = code(await read(REVIEW_LINKS));
  const list = source.slice(source.indexOf('path: "/"'));

  // This select had no filter at all and leaned entirely on a policy that did
  // not exist. Two independent guards, because a token is the only secret
  // protecting a review link.
  assert(
    list.includes('.eq("subject_user_id", user.id)'),
    "the list must scope to the caller in the query too",
  );
});

Deno.test("revoking someone else's link is not reported as success", async () => {
  const source = code(await read(REVIEW_LINKS));

  // An UPDATE matching no rows is not an error, so without checking the
  // returned row this answered 200 and did nothing.
  assert(source.includes(".maybeSingle()"), "the revoke must read back its row");
  assert(
    source.includes('{ error: "Not found" }, 404'),
    "a revoke that matched nothing must answer 404",
  );
});

Deno.test("the migration grants both roles and scopes every policy to the subject", async () => {
  const sql = await read(MIGRATION);

  // service_role bypasses RLS but still needs the table grant — which is why
  // by-token failed despite already using the service client.
  assert(/GRANT[^;]*TO service_role/.test(sql), "service_role needs the grant");
  assert(/GRANT[^;]*TO authenticated/.test(sql), "authenticated needs the grant");

  // Four policies, each scoped to the owner; the SELECT one is the only thing
  // between a caller and every share link on the platform.
  for (const cmd of ["SELECT", "INSERT", "UPDATE", "DELETE"]) {
    assert(
      new RegExp(`FOR ${cmd}`).test(sql),
      `no policy covers ${cmd}, so it stays denied`,
    );
  }
  assertEquals(
    (sql.match(/subject_user_id = auth\.uid\(\)/g) ?? []).length >= 4,
    true,
    "every policy must be scoped to the link's subject",
  );

  // Anonymous reviewers reach a link through the service client, which checks
  // expiry, revocation and use count first.
  assertEquals(/TO anon/.test(sql), false, "anon must not read the table directly");
});
