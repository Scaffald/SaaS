/**
 * User emails from `auth.users`, for service-role API routes.
 */

/** Shape the email lookup needs. Kept loose to match the other API libs: this
 *  runs under Deno with an untyped Supabase client (see #477). */
// deno-lint-ignore no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: untyped Deno Supabase client (#477)
type SupabaseLike = any;

/** Ids per `core.user_emails` call; the function itself caps at 200. */
const RPC_BATCH = 200;
/** Admin API lookups in flight at once, when the RPC is unavailable. */
const FALLBACK_CONCURRENCY = 5;

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
 * One `core.user_emails` RPC per 200 ids (migration 393). This used to be one
 * Admin Auth API call per id, all at once: a 50-user page of /office/users
 * opened 50 requests through Kong, exhausted its connections, and Kong reset
 * other requests in flight — their auth checks came back 401 (#1337).
 *
 * If the RPC is missing (the function deployed before the migration), it
 * falls back to the per-id lookups, a few at a time. Requires the
 * service-role client either way.
 */
export async function emailsByUserId(
  supabaseAdmin: SupabaseLike,
  ids: Array<string | null | undefined>,
): Promise<Map<string, string | null>> {
  const unique = [...new Set(ids.filter((id): id is string => Boolean(id)))];
  if (unique.length === 0) return new Map();

  const emails = new Map<string, string | null>(unique.map((id) => [id, null]));
  try {
    for (let i = 0; i < unique.length; i += RPC_BATCH) {
      const { data, error } = await supabaseAdmin
        .schema("core")
        .rpc("user_emails", { p_user_ids: unique.slice(i, i + RPC_BATCH) });
      if (error) throw error;
      for (
        const row of (data ?? []) as Array<
          { user_id: string; email: string | null }
        >
      ) {
        emails.set(row.user_id, row.email ?? null);
      }
    }
    return emails;
  } catch (error) {
    console.error(
      "core.user_emails failed; resolving emails one by one:",
      (error as { message?: string })?.message ?? error,
    );
  }

  // The Admin Auth API, not a PostgREST query on `auth`: that schema is not
  // exposed, so `.schema("auth").from("users")` returns every email as null.
  let next = 0;
  const worker = async () => {
    while (next < unique.length) {
      const id = unique[next++];
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(id);
      if (error) {
        // A missing email is a degraded row, not a failed request.
        console.error(`Failed to resolve email for ${id}:`, error.message);
        continue;
      }
      emails.set(id, (data?.user?.email as string | undefined) ?? null);
    }
  };
  await Promise.all(
    Array.from(
      { length: Math.min(FALLBACK_CONCURRENCY, unique.length) },
      worker,
    ),
  );
  return emails;
}
