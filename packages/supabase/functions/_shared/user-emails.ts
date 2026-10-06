/**
 * User emails from `auth.users`, for service-role API routes.
 */

/** Shape the email lookup needs. Kept loose to match the other API libs: this
 *  runs under Deno with an untyped Supabase client (see #477). */
// deno-lint-ignore no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: untyped Deno Supabase client (#477)
type SupabaseLike = any;

/**
 * Emails for a set of user ids, from `auth.users`.
 *
 * `core.users` has no `email` column — email lives in `auth.users`, which
 * PostgREST does not expose. Selecting `users(email)` answers
 * `column users_1.email does not exist` and fails the whole request: the admin
 * background-check routes did it (#635), then the office ID-verification list
 * did it again (#1020). Moved here from background-checks-admin so both use one
 * lookup.
 *
 * One `getUserById` per distinct id, in parallel, bounded by the caller's page
 * size. Requires the service-role client; `auth.users` is not reachable
 * through a request-scoped one.
 */
export async function emailsByUserId(
  supabaseAdmin: SupabaseLike,
  ids: Array<string | null | undefined>,
): Promise<Map<string, string | null>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();

  // The Admin Auth API, not a PostgREST query: the `auth` schema is not
  // exposed through PostgREST, so `.schema("auth").from("users")` fails and
  // every email comes back null — a quieter version of the same bug.
  //
  // `getUserById` per id rather than `listUsers`, which is the pattern in
  // routes/auth.ts: that one pages through EVERY user in the project to find
  // one address. Here the ids are already known and bounded by the page size,
  // so targeted lookups are both cheaper and correct as the user table grows.
  const entries = await Promise.all(
    unique.map(async (id) => {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
      if (error) {
        // A missing email is a degraded row, not a failed request: the queue
        // is still usable without it, and failing the whole call would
        // reintroduce exactly the outage this fixes.
        console.error(`Failed to resolve email for ${id}:`, error.message);
        return [id, null] as const;
      }
      return [id, (data?.user?.email as string | undefined) ?? null] as const;
    }),
  );

  return new Map(entries);
}
