/**
 * Ownership guard for review drafts.
 *
 * Every mutating endpoint under /reviews/{reviewId}/* edits a row in
 * core.reviews that belongs to whoever is writing the review. Without a check
 * on author_user_id, any authenticated user could rewrite anyone else's ratings
 * and comments by guessing a UUID — the review system's entire integrity rests
 * on this one predicate, so it lives in a single place rather than being
 * retyped in each handler.
 *
 * Misses return `null` and callers answer 404, not 403. That is the convention
 * this API settled on in #608/#609: telling a caller "this exists but is not
 * yours" leaks that it exists.
 */

export interface ReviewDraftRow {
  id: string;
  author_user_id: string;
  subject_id: string;
  subject_type: string;
  rating: number | null;
  headline: string | null;
  body: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LoadDraftResult {
  review: ReviewDraftRow | null;
  /** Set when the lookup itself failed, as opposed to finding nothing. */
  error: string | null;
}

/**
 * Fetch a review the given user authored.
 *
 * `requireDraft` rejects rows that have already been submitted — a submitted
 * review is a published statement about someone, and letting the author keep
 * editing it after the fact would change what a reader already saw.
 */
export async function loadOwnReview(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  reviewId: string,
  userId: string,
  options: { requireDraft?: boolean } = {},
): Promise<LoadDraftResult> {
  const { data, error } = await supabase
    .schema("core")
    .from("reviews")
    .select("*")
    .eq("id", reviewId)
    .eq("author_user_id", userId)
    .maybeSingle();

  if (error) return { review: null, error: error.message };
  if (!data) return { review: null, error: null };

  if (options.requireDraft && !isDraft(data as ReviewDraftRow)) {
    return { review: null, error: null };
  }

  return { review: data as ReviewDraftRow, error: null };
}

/** A review is a draft until POST /{reviewId}/submit stamps it submitted. */
export function isDraft(review: ReviewDraftRow): boolean {
  const status = (review.metadata ?? {})["status"];
  return status === undefined || status === "draft";
}

/**
 * Merge a patch into `metadata` without dropping sibling keys.
 *
 * The wizard writes each step independently — step progress, the draft blob,
 * comment visibility — and they all share this one jsonb column. A plain
 * overwrite would make each step erase the last.
 */
export function mergeMetadata(
  current: Record<string, unknown> | null | undefined,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  return { ...(current ?? {}), ...patch };
}
