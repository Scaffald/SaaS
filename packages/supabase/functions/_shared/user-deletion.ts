/**
 * Deleting a user: the checks and the delete, shared by the office route
 * (`DELETE /v1/office/users/:id`) and the account-deletion processor (#1313).
 *
 * Moved here from api/routes/office-users.ts so the two paths cannot drift: a
 * relation that blocks one blocks the other, and both report it the same way.
 *
 * The order is the guarantee, and both callers keep it:
 *
 *   1. findDeletionBlockers — read-only. A user who cannot be deleted must not
 *      be partly deleted first.
 *   2. releaseNullableReferences — the one write before the delete. If the
 *      delete then fails, the released pointers stay released: an audit
 *      attribution is lost, no record is destroyed, and a retry is safe.
 *   3. deleteAuthUser — auth.users cascades to core.users, which cascades to
 *      the profile, skills, education, experience, certifications,
 *      applications, work logs, reviews, notifications and role assignments.
 *      Nothing the user owns is deleted by hand outside that cascade.
 */

/** Untyped Deno Supabase client, as in the other shared libs (see #477). */
// deno-lint-ignore no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: untyped Deno Supabase client (#477)
type SupabaseLike = any;

export interface UserRelation {
  /** A table in the `core` schema. */
  table: string;
  column: string;
}

/**
 * Relations that block deleting a user, and cannot be resolved automatically.
 *
 * Each is a RESTRICT foreign key over content the user owns rather than a
 * pointer to them — an organization document, a task, a punchlist, a
 * project. Removing the person should not silently remove work other people
 * depend on, and the column is NOT NULL so it cannot be released either.
 * These need a human decision (reassign or delete the content first), so the
 * callers report them instead of guessing.
 */
export const BLOCKING_RELATIONS: ReadonlyArray<UserRelation> = [
  { table: "tasks", column: "created_by_user_id" },
  { table: "punchlists", column: "created_by_user_id" },
  { table: "organization_documents", column: "created_by" },
  { table: "organization_document_versions", column: "uploaded_by" },
  { table: "organization_document_shares", column: "created_by" },
  { table: "organization_folders", column: "created_by" },
  { table: "organization_locations", column: "created_by" },
  // RESTRICT to auth.users (105). Missing from the office route's list until
  // #1313, so deleting a project creator answered 500 with an FK error
  // instead of 409.
  { table: "projects", column: "created_by" },
];

/**
 * Verification pointers that can be released.
 *
 * These are nullable audit references — "this skill was verified by X". Once X
 * is gone, null is the honest value, and holding the deletion hostage to an
 * audit pointer would make any reviewer undeletable. Migration 390 made their
 * foreign keys ON DELETE SET NULL as well; releasing them here first keeps the
 * delete working in an environment that has not applied 390 yet.
 */
export const RELEASABLE_REFERENCES: ReadonlyArray<UserRelation> = [
  { table: "work_logs", column: "verified_by_user_id" },
  { table: "user_skills", column: "verified_by" },
  { table: "skill_evidence", column: "verified_by" },
];

export type BlockerCheck =
  | { ok: true; blocked: Array<{ table: string; count: number }> }
  | { ok: false; message: string };

/**
 * Count the user's rows in every blocking relation. Writes nothing.
 *
 * `extra` lets a caller add relations of its own: the processor also refuses
 * to delete an organization's owner, which an office operator may do
 * deliberately.
 */
export async function findDeletionBlockers(
  supabaseAdmin: SupabaseLike,
  userId: string,
  extra: ReadonlyArray<UserRelation> = [],
): Promise<BlockerCheck> {
  const blocked: Array<{ table: string; count: number }> = [];
  for (const rel of [...BLOCKING_RELATIONS, ...extra]) {
    const { count, error } = await supabaseAdmin
      .schema("core")
      .from(rel.table)
      .select("*", { count: "exact", head: true })
      .eq(rel.column, userId);

    // A head-count against a table that cannot be read comes back with a null
    // count and no error, so null is the failure signal — not `error`.
    if (count === null) {
      return {
        ok: false,
        message: `Could not count core.${rel.table}.${rel.column}: ${
          error?.message ?? "no count returned"
        }`,
      };
    }
    if (count > 0) blocked.push({ table: rel.table, count });
  }
  return { ok: true, blocked };
}

/** Null the user's verification pointers. Safe to repeat. */
export async function releaseNullableReferences(
  supabaseAdmin: SupabaseLike,
  userId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  for (const ref of RELEASABLE_REFERENCES) {
    const { error } = await supabaseAdmin
      .schema("core")
      .from(ref.table)
      .update({ [ref.column]: null })
      .eq(ref.column, userId);

    if (error) {
      return {
        ok: false,
        message: `core.${ref.table}.${ref.column}: ${error.message}`,
      };
    }
  }
  return { ok: true };
}

/**
 * Delete the auth user, which cascades through core.users.
 *
 * `alreadyGone` when GoTrue says the user does not exist: a retry after a run
 * that deleted the user and then died must count that step as done, not fail
 * on it.
 */
export async function deleteAuthUser(
  supabaseAdmin: SupabaseLike,
  userId: string,
): Promise<
  { ok: true; alreadyGone: boolean } | { ok: false; message: string }
> {
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  if (!error) return { ok: true, alreadyGone: false };
  if (isUserNotFound(error)) return { ok: true, alreadyGone: true };
  return { ok: false, message: error.message ?? String(error) };
}

export function isUserNotFound(error: unknown): boolean {
  const e = error as { status?: number; code?: string; message?: string };
  return e?.status === 404 || e?.code === "user_not_found" ||
    /user not found/i.test(e?.message ?? "");
}
