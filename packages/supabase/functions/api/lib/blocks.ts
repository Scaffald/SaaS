/**
 * Block enforcement helpers (#690).
 *
 * A block that is only recorded is worse than no block at all: the user
 * believes they are no longer reachable and they are. Enforcement lives on the
 * read paths, and it is symmetric — if A blocked B, then A does not see B's
 * content AND B does not see A's.
 *
 * The symmetry is why this goes through `core.blocked_user_ids`, a
 * SECURITY DEFINER function, rather than a select the caller could write
 * themselves. RLS on core.user_blocks deliberately lets a user see only rows
 * where they are the *blocker* — you cannot enumerate who has blocked you —
 * which is right for privacy and useless for filtering a feed.
 */

// deno-lint-ignore no-explicit-any
type Client = any;

/**
 * Ids to hide from `userId`, in both directions.
 *
 * Returns an empty set on error rather than throwing. A feed that fails to
 * load because the block lookup hiccuped is a worse outcome than a feed that
 * briefly under-filters, and the caller has no useful recovery.
 */
export async function blockedUserIds(
  supabase: Client,
  userId: string,
): Promise<Set<string>> {
  const { data, error } = await supabase.rpc("blocked_user_ids", {
    for_user: userId,
  });

  if (error) {
    console.error("blockedUserIds failed:", error.message);
    return new Set<string>();
  }

  // The RPC returns SETOF uuid, which arrives as either bare strings or
  // single-key objects depending on the client version. Handle both rather
  // than depending on which.
  const ids = (data ?? []).map((row: unknown) =>
    typeof row === "string" ? row : Object.values(row as object)[0] as string
  );
  return new Set(ids.filter(Boolean));
}

/** Drop rows authored by someone on either side of a block. */
export function withoutBlocked<T>(
  rows: T[] | null | undefined,
  blocked: Set<string>,
  authorOf: (row: T) => string | null | undefined,
): T[] {
  if (!rows?.length || blocked.size === 0) return rows ?? [];
  return rows.filter((row) => {
    const author = authorOf(row);
    return !author || !blocked.has(author);
  });
}
