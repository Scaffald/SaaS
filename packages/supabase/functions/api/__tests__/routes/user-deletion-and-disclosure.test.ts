/**
 * The two behaviours that were silently wrong, pinned as rules rather than as
 * table names — a rename should not be able to make either fail quietly again.
 *
 * Both come out of the same measurement: a head-count against a table the
 * client cannot read returns `{status: 204, error: null, count: null}`. No
 * error is raised. Any code that reads such a count as `count ?? 0` reports a
 * confident zero for data it never looked at, and the obvious fix — checking
 * `error` — does not work either.
 */
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

const CCPA = new URL("../../routes/ccpa.ts", import.meta.url);
const OFFICE_USERS = new URL("../../routes/office-users.ts", import.meta.url);

async function read(url: URL): Promise<string> {
  return await Deno.readTextFile(url);
}

/**
 * Source with comments removed.
 *
 * These handlers document the tables they used to query wrongly, so a naive
 * substring search finds the very names it is asserting are gone — and the
 * count labels ("education") collide with old table names too. Assertions here
 * are about code, so they read code only.
 */
function code(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

/** Tables the CCPA summary must count, and the column each is keyed by. */
const DISCLOSURE_SOURCES: ReadonlyArray<[string, string]> = [
  ["user_education", "user_id"],
  ["user_skills", "user_id"],
  ["user_experience", "user_id"],
  // core.certifications exists but is the catalogue and has no user_id.
  ["user_certifications", "user_id"],
  ["work_logs", "user_id"],
  ["applications", "user_id"],
  ["background_checks", "user_id"],
  // Keyed by the subject, which these two name differently.
  ["id_verifications", "worker_user_id"],
  ["reviews", "author_user_id"],
];

Deno.test("the CCPA summary counts every source it claims to", async () => {
  const source = await read(CCPA);

  const missing = DISCLOSURE_SOURCES
    .filter(([table]) => !source.includes(`"${table}"`))
    .map(([table]) => table);

  assertEquals(missing, []);
});

Deno.test("the CCPA summary reads no table that does not exist", async () => {
  const source = await read(CCPA);

  // Every one of these was queried before, and every one returned a null count
  // that became a zero in the user's disclosure.
  // Matched as queries, not as bare strings: "education" is also a legitimate
  // count label for core.user_education.
  const phantom = [
    "profiles",
    "education",
    "profile_skills",
    "work_experience",
    "feedback",
  ].filter((name) => new RegExp(`from\\("${name}"\\)`).test(code(source)));

  assertEquals(phantom, []);
  // No table anywhere has this column; it made every admin queue row nameless.
  assertEquals(code(source).includes("email_visible"), false);
});

Deno.test("the CCPA summary keys the subject correctly where it differs", async () => {
  const source = await read(CCPA);

  // Both tables exist, so a wrong column here fails exactly as silently as a
  // wrong table: null count, no error, reported as zero.
  assert(
    code(source).includes('"worker_user_id"'),
    "id_verifications is keyed by worker_user_id, not user_id",
  );
  assert(
    code(source).includes('"author_user_id"'),
    "reviews is keyed by author_user_id, not reviewer_user_id",
  );
  assertEquals(code(source).includes("reviewer_user_id"), false);
});

Deno.test("a count that could not be read is never treated as zero", async () => {
  const source = await read(CCPA);

  // The failure signal has to be the null count. `error` is null for a head
  // count against an unreadable table, so checking it alone would restore the
  // bug while looking like a fix.
  assert(
    source.includes("res.count === null"),
    "the summary must treat a null count as a failure, not as zero",
  );
  assert(
    source.includes("Failed to compile data summary"),
    "an uncountable category must fail the request, not shrink the total",
  );
});

Deno.test("delete-user never hand-deletes what the cascade owns", async () => {
  const source = await read(OFFICE_USERS);

  // These six statements were no-ops addressing `public`, and two siblings that
  // did work destroyed data on a path that then failed. core.users cascades, so
  // none of them should come back.
  const handRolled = [
    "user_certifications",
    "work_experience",
    "education",
    "applications",
    "organization_members",
  ].filter((t) =>
    new RegExp(`from\\("${t}"\\)\\s*\\.delete\\(\\)`).test(code(source))
  );

  assertEquals(handRolled, []);
});

Deno.test("delete-user checks for blockers before it writes anything", async () => {
  const source = await read(OFFICE_USERS);

  const blockIndex = source.indexOf("BLOCKING_RELATIONS");
  const releaseIndex = source.indexOf("RELEASABLE_REFERENCES");
  const deleteIndex = source.indexOf("auth.admin.deleteUser");

  assert(blockIndex >= 0 && releaseIndex >= 0 && deleteIndex >= 0);
  // Order is the guarantee: a user who cannot be deleted must not be partly
  // deleted first.
  assert(
    source.lastIndexOf("blockedBy") < source.lastIndexOf("auth.admin.deleteUser"),
    "the blocking check must run before the delete",
  );
});

Deno.test("delete-user reports blockers as a conflict, not a server error", async () => {
  const source = await read(OFFICE_USERS);

  // RESTRICT references are content the user owns; an operator needs to know
  // what to reassign, not see a 500.
  assert(source.includes("}, 409)"), "blocked deletion must answer 409");
  assert(
    source.includes("blockedBy"),
    "the response must name what blocks the deletion",
  );
  for (const table of ["tasks", "punchlists", "organization_documents"]) {
    assert(
      source.includes(`table: "${table}"`),
      `${table} has a RESTRICT reference to core.users and must be checked`,
    );
  }
});
