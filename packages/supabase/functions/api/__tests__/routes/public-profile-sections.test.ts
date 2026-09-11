/**
 * The public profile page's data endpoints must serve the audience that page
 * has: signed out.
 *
 * GET /v1/profiles/slug/{slug} already serves anonymously and returns a
 * `visibility` object telling the page which sections to render. The page then
 * fetched each one and got 401, so every public profile rendered "No profile
 * data available" for a profile that had data (#732). A visitor could not tell
 * an empty profile from a gated one, and neither could a crawler.
 *
 * These assertions are about the rules, not the wiring, because the wiring is
 * easy to reintroduce: an `if (!user) return 401` added to a section handler
 * looks locally sensible and silently empties every public profile again.
 */
import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";

const WIDGETS = new URL("../../routes/profile-widgets.ts", import.meta.url);
const REVIEWS = new URL("../../routes/reviews.ts", import.meta.url);
const WORK_LOGS = new URL("../../routes/work-logs.ts", import.meta.url);
const PROFILES = new URL("../../routes/profiles.ts", import.meta.url);
const VISIBILITY = new URL("../../lib/profile-visibility.ts", import.meta.url);

const read = (u: URL) => Deno.readTextFile(u);

/** Source minus comments — they quote the very code being asserted gone. */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

Deno.test("section handlers do not blanket-refuse anonymous callers", async () => {
  const src = code(await read(WIDGETS));

  // One is legitimate: /preferences is the caller's own settings and has no
  // public form. Any more than that and a public section has been re-gated.
  const bare =
    src.match(/return c\.json\(\{ error: "Unauthorized" \}, 401\)/g) ?? [];

  assertEquals(
    bare.length,
    1,
    `expected only the preferences route to refuse anonymously, found ${bare.length}`,
  );
});

Deno.test("every section decides through the shared visibility rule", async () => {
  const src = code(await read(WIDGETS));

  // general-info, experience, education, skills, certifications.
  const gated = src.match(/resolveSectionAccess\(/g) ?? [];
  assertEquals(
    gated.length,
    6, // one definition + five call sites
    "each public section must route its decision through resolveSectionAccess",
  );

  for (
    const section of [
      "work_experience",
      "education",
      "skills",
      "certifications",
    ]
  ) {
    assert(
      src.includes(`"${section}"`),
      `${section} must be gated by its visibility flag`,
    );
  }
});

Deno.test("someone else's sections are read with the service client", async () => {
  const src = code(await read(WIDGETS));

  // core.user_experience, user_education and user_certifications carry
  // owner-only SELECT policies, so a viewer's own client reads nothing of
  // another profile however the owner published it. The visibility check is the
  // authorization; the service client is only how it is carried out.
  assert(
    src.includes("useServiceClient"),
    "reads must switch client by audience",
  );
  assert(
    src.includes("access.useServiceClient ? getServiceClient() : supabase"),
    "your own profile must stay on your own client, so RLS still applies",
  );
});

Deno.test("the preferences route stays private", async () => {
  const src = code(await read(WIDGETS));
  const prefs = src.slice(src.indexOf('path: "/preferences"'));

  assert(
    prefs.includes('return c.json({ error: "Unauthorized" }, 401)'),
    "preferences are the caller's own settings and have no public form",
  );
  assertEquals(
    prefs.includes("resolveSectionAccess"),
    false,
    "preferences must not be exposed through the public section path",
  );
});

Deno.test("a hidden section answers 404, never 403", async () => {
  const src = code(await read(WIDGETS)) + code(await read(REVIEWS));

  // 403 would confirm the section exists and was hidden, which is the one thing
  // the owner asked not to reveal.
  assert(src.includes("not_found"), "a hidden section reads as absent");
  assertEquals(
    /status:\s*403|\},\s*403\)/.test(code(await read(WIDGETS))),
    false,
    "a hidden section must not be distinguishable from an empty one",
  );
});

Deno.test("the public work-log feed takes no auth", async () => {
  const src = code(await read(WORK_LOGS));
  const feed = src.slice(src.indexOf('path: "/public-feed"'));
  const handler = feed.slice(0, feed.indexOf("app.openapi("));

  // Its only consumer renders on app/(public)/users/[slug].tsx. The filters
  // inside it — verified status, show_on_profile, per-photo opt-in — are the
  // publication rule, and none of them depend on who is asking.
  assertEquals(
    /if \(!user\) return c\.json\(\{ error: "Unauthorized" \}, 401\)/.test(
      handler,
    ),
    false,
    "public-feed serves a page whose audience is signed out by definition",
  );
});

Deno.test("the defaults match what /slug/{slug} promises the page", async () => {
  // If these drift, the page renders a section the data endpoint then refuses,
  // or hides one it would have served.
  const lib = await read(VISIBILITY);
  const profiles = await read(PROFILES);

  const defaults = lib.slice(lib.indexOf("DEFAULT_PROFILE_VISIBILITY"));
  const slugDefaults = profiles.slice(profiles.indexOf("let visibility = {"));

  for (
    const [key, value] of Object.entries({
      work_experience: true,
      education: true,
      skills: true,
      certifications: true,
      reviews: true,
      contact_info: false,
    })
  ) {
    assert(
      new RegExp(`${key}:\\s*${value}`).test(defaults.slice(0, 600)),
      `lib default for ${key} should be ${value}`,
    );
    assert(
      new RegExp(`${key}:\\s*${value}`).test(slugDefaults.slice(0, 600)),
      `/slug default for ${key} should be ${value} — the two must agree`,
    );
  }
});
