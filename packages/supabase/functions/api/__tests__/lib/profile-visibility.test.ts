import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  canViewSection,
  DEFAULT_PROFILE_VISIBILITY,
  loadProfileVisibility,
  type ProfileVisibility,
  resolveAudience,
} from "../../lib/profile-visibility.ts";

const VIEWER = "viewer-1";
const SUBJECT = "subject-1";

Deno.test("an explicit userId resolves without a signed-in caller", () => {
  // This is the whole fix: a named profile needs no "me" to fall back to, so an
  // anonymous viewer can be served.
  assertEquals(resolveAudience({ requestedUserId: SUBJECT }), {
    kind: "other",
    userId: SUBJECT,
  });
});

Deno.test("no userId and no viewer is unauthenticated", () => {
  // "me" was meant, and there is no me.
  assertEquals(resolveAudience({}), { kind: "unauthenticated" });
});

Deno.test("no userId falls back to the caller, as self", () => {
  assertEquals(resolveAudience({ viewerId: VIEWER }), {
    kind: "self",
    userId: VIEWER,
  });
});

Deno.test("asking for your own id by name is still self", () => {
  assertEquals(
    resolveAudience({ requestedUserId: VIEWER, viewerId: VIEWER }),
    { kind: "self", userId: VIEWER },
  );
});

Deno.test("your own profile ignores section visibility", () => {
  const hidden: ProfileVisibility = {
    ...DEFAULT_PROFILE_VISIBILITY,
    work_experience: false,
  };
  assert(
    canViewSection({ kind: "self", userId: VIEWER }, "work_experience", hidden),
  );
});

Deno.test("a hidden section is refused to everyone else", () => {
  const hidden: ProfileVisibility = {
    ...DEFAULT_PROFILE_VISIBILITY,
    education: false,
  };
  assertEquals(
    canViewSection({ kind: "other", userId: SUBJECT }, "education", hidden),
    false,
  );
});

Deno.test("an unauthenticated audience is refused every section", () => {
  for (const section of Object.keys(DEFAULT_PROFILE_VISIBILITY)) {
    assertEquals(
      canViewSection(
        { kind: "unauthenticated" },
        section as keyof ProfileVisibility,
        DEFAULT_PROFILE_VISIBILITY,
      ),
      false,
    );
  }
});

Deno.test("contact_info is private by default; the rest are public", () => {
  // These defaults have to match GET /v1/profiles/slug/{slug} exactly, or the
  // page renders a section the data endpoint then refuses.
  assertEquals(DEFAULT_PROFILE_VISIBILITY.contact_info, false);
  for (
    const s of [
      "work_experience",
      "education",
      "skills",
      "certifications",
      "reviews",
    ]
  ) {
    assertEquals(
      DEFAULT_PROFILE_VISIBILITY[s as keyof ProfileVisibility],
      true,
      `${s} should be visible by default`,
    );
  }
});

/** Returns a canned preferences row. */
function fakeService(row: unknown) {
  const builder = {
    select: () => builder,
    eq: () => builder,
    maybeSingle: () => Promise.resolve({ data: row }),
  };
  return { schema: () => ({ from: () => builder }) };
}

Deno.test("missing preferences fall back to the defaults", async () => {
  const v = await loadProfileVisibility(fakeService(null), SUBJECT);
  assertEquals(v, DEFAULT_PROFILE_VISIBILITY);
});

Deno.test("a partial preference merges over the defaults", async () => {
  // A row that sets only one key must not blank the others out.
  const v = await loadProfileVisibility(
    fakeService({ profile_visibility: { education: false } }),
    SUBJECT,
  );

  assertEquals(v.education, false);
  assertEquals(v.skills, true);
  assertEquals(v.contact_info, false);
});

Deno.test("the returned object is a copy, not the shared default", async () => {
  // Mutating one caller's result must not change everyone else's visibility.
  const v = await loadProfileVisibility(fakeService(null), SUBJECT);
  v.skills = false;
  assertEquals(DEFAULT_PROFILE_VISIBILITY.skills, true);
});
