import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  isDraft,
  loadOwnReview,
  mergeMetadata,
  type ReviewDraftRow,
} from "../../lib/review-drafts.ts";

function row(overrides: Partial<ReviewDraftRow> = {}): ReviewDraftRow {
  return {
    id: "r1",
    author_user_id: "u1",
    subject_id: "s1",
    subject_type: "user",
    rating: null,
    headline: null,
    body: null,
    metadata: {},
    created_at: "2026-08-12T00:00:00Z",
    updated_at: "2026-08-12T00:00:00Z",
    ...overrides,
  };
}

/** Records the filters applied so the ownership predicate can be asserted. */
function fakeSupabase(result: { data: unknown; error: { message: string } | null }) {
  const filters: Record<string, unknown> = {};
  const builder = {
    select: () => builder,
    eq: (col: string, val: unknown) => {
      filters[col] = val;
      return builder;
    },
    maybeSingle: () => Promise.resolve(result),
  };
  return {
    filters,
    client: { schema: () => ({ from: () => builder }) },
  };
}

Deno.test("isDraft treats a missing status as draft", () => {
  assert(isDraft(row({ metadata: {} })));
  assert(isDraft(row({ metadata: { status: "draft" } })));
  assert(!isDraft(row({ metadata: { status: "submitted" } })));
});

Deno.test("mergeMetadata keeps sibling keys", () => {
  // The wizard writes step progress, the draft blob and is_public into one
  // jsonb column from separate requests; overwriting loses the others.
  const merged = mergeMetadata(
    { draft: { a: 1 }, steps: { one: true }, is_public: true },
    { status: "submitted" },
  );
  assertEquals(merged, {
    draft: { a: 1 },
    steps: { one: true },
    is_public: true,
    status: "submitted",
  });
});

Deno.test("mergeMetadata tolerates a null column", () => {
  assertEquals(mergeMetadata(null, { status: "draft" }), { status: "draft" });
  assertEquals(mergeMetadata(undefined, { a: 1 }), { a: 1 });
});

Deno.test("mergeMetadata lets the patch win on a shared key", () => {
  assertEquals(mergeMetadata({ status: "draft" }, { status: "submitted" }), {
    status: "submitted",
  });
});

// The predicate the whole review system's integrity rests on.
Deno.test("loadOwnReview filters by both id and author", async () => {
  const { filters, client } = fakeSupabase({ data: row(), error: null });

  await loadOwnReview(client, "r1", "u1");

  assertEquals(filters["id"], "r1");
  assertEquals(filters["author_user_id"], "u1");
});

Deno.test("loadOwnReview returns nothing for someone else's review", async () => {
  // The query returns no row because author_user_id did not match.
  const { client } = fakeSupabase({ data: null, error: null });

  const result = await loadOwnReview(client, "r1", "someone-else");

  assertEquals(result.review, null);
  assertEquals(result.error, null);
});

Deno.test("loadOwnReview distinguishes a failed lookup from an empty one", async () => {
  const { client } = fakeSupabase({ data: null, error: { message: "boom" } });

  const result = await loadOwnReview(client, "r1", "u1");

  assertEquals(result.review, null);
  assertEquals(result.error, "boom");
});

Deno.test("requireDraft rejects an already-submitted review", async () => {
  // A submitted review is a published statement about someone; letting the
  // author keep editing changes what a reader already saw.
  const { client } = fakeSupabase({
    data: row({ metadata: { status: "submitted" } }),
    error: null,
  });

  const result = await loadOwnReview(client, "r1", "u1", { requireDraft: true });

  assertEquals(result.review, null);
  assertEquals(result.error, null);
});

Deno.test("requireDraft allows a draft through", async () => {
  const { client } = fakeSupabase({
    data: row({ metadata: { status: "draft" } }),
    error: null,
  });

  const result = await loadOwnReview(client, "r1", "u1", { requireDraft: true });

  assert(result.review !== null);
  assertEquals(result.review?.id, "r1");
});

Deno.test("without requireDraft a submitted review still loads", async () => {
  // POST /submit needs to read the row it is about to stamp.
  const { client } = fakeSupabase({
    data: row({ metadata: { status: "submitted" } }),
    error: null,
  });

  const result = await loadOwnReview(client, "r1", "u1");

  assert(result.review !== null);
});
