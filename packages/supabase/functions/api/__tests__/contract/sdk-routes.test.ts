/**
 * SDK ↔ api router contract test
 *
 * Every path an @scaffald/sdk method calls must resolve to a route registered
 * in the api edge function. When the two drift, the failure is silent and
 * expensive: the request 404s and the UI renders an empty or "not found" state
 * with no error anywhere near the cause. That is exactly how
 * `getProfileBySlug` shipped calling `/v1/profiles/slug/{slug}` for months
 * while the router only ever defined `/{username}` (PR #439).
 *
 * This is a *static* test — it parses source, boots nothing, touches no
 * database. The api function can only be imported inside the Supabase edge
 * runtime (bare `hono` is not resolvable under plain Deno), so reading the
 * source is both the accurate and the portable option.
 *
 *   deno test --allow-read packages/supabase/functions/api/__tests__/contract/
 *
 * ## The baseline
 *
 * The SDK is currently well ahead of the api: KNOWN_GAPS lists endpoints the
 * SDK calls that nothing implements. They are recorded, not fixed — this test
 * exists to stop the list from growing, not to pretend it is empty.
 *
 * The list is enforced in both directions. A new gap fails the test. So does a
 * *stale* entry: implement one of these endpoints and the test tells you to
 * delete its line, so the baseline can never quietly drift out of date.
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

const HERE = new URL(".", import.meta.url).pathname;
const API_DIR = new URL("../../", import.meta.url).pathname;
const REPO_ROOT = new URL("../../../../../../", import.meta.url).pathname;
const SDK_RESOURCES = `${REPO_ROOT}packages/sdk/src/resources`;

const HTTP_VERBS = "get|post|patch|put|delete";

/** SDK method name -> HTTP verb. `del` is the SDK's spelling of DELETE. */
const SDK_METHOD_VERB: Record<string, string> = {
  get: "GET",
  post: "POST",
  patch: "PATCH",
  put: "PUT",
  del: "DELETE",
};

/**
 * Endpoints the SDK calls that the api does not implement, as
 * `"<METHOD> <normalised path>"`. Shrink this list; do not grow it.
 *
 * Notable clusters, all confirmed by hand:
 *   - jobs: the router defines no POST/PATCH/DELETE at all, so createJob,
 *     updateJob and deleteJob cannot work.
 *   - `GET /v1/communities/posts/portfolio/:p` — the route exists but is
 *     mounted at `/user/{userId}`; the SDK has the wrong path segment.
 *
 * `/v1/profiles/slug/check` and `PATCH /v1/profiles/slug` were on this list
 * until #441 implemented them; the stale-entry check below is what flagged
 * them for removal after that merge.
 */
const KNOWN_GAPS = new Set([
  "DELETE /reviews/:p/draft",
  "DELETE /v1/employers/employment/:p",
  "DELETE /v1/employers/follow/:p",
  "DELETE /v1/jobs/:p",
  "DELETE /v1/skills/evidence/:p",
  "DELETE /v1/teams/:p/jobs/:p",
  "GET /reviews/:p/draft",
  "GET /reviews/analytics",
  "GET /reviews/my-reviews",
  "GET /reviews/soft-skills/by-category",
  "GET /v1/background-checks/:p/disputes",
  "GET /v1/communities/posts/portfolio/:p",
  "GET /v1/employers/follow/status",
  "GET /v1/organizations/:p/background-checks",
  "GET /v1/organizations/:p/background-checks/:p",
  "GET /v1/organizations/:p/documents",
  "GET /v1/organizations/:p/documents/:p",
  "GET /v1/organizations/:p/open-jobs-count",
  "GET /v1/profiles/skills/children",
  "GET /v1/profiles/skills/details",
  "GET /v1/profiles/skills/legacy",
  "GET /v1/skills/evidence",
  "GET /v1/skills/snapshots",
  "GET /v1/skills/snapshots/:p",
  "GET /v1/skills/snapshots/timeline",
  "GET /v1/teams/:p/jobs",
  "GET /v1/teams/roles",
  "GET /v1/webhooks/:p",
  "GET /v1/webhooks/:p/deliveries",
  "GET /v1/webhooks/event-types",
  "GET /v1/work-logs/projects/:p/rollup",
  "GET /v1/work-logs/public-feed",
  "GET /v1/work-logs/skills/suggestions",
  "PATCH /reviews/:p/category-rating",
  "PATCH /reviews/:p/comment",
  "PATCH /reviews/:p/draft",
  "PATCH /reviews/:p/skill-ratings",
  "PATCH /reviews/:p/soft-skill-votes",
  "PATCH /reviews/:p/step",
  "PATCH /v1/jobs/:p",
  "PATCH /v1/profiles/skills",
  "PATCH /v1/profiles/skills/legacy",
  "PATCH /v1/profiles/skills/multi-taxonomy",
  "PATCH /v1/skills/evidence/:p",
  "PATCH /v1/webhooks/:p",
  "PATCH /v1/work-logs/:p/profile-visibility",
  "POST /v1/api-keys/:p/revoke",
  "POST /v1/background-checks/confirm-payment",
  "POST /v1/background-checks/disputes",
  "POST /v1/background-checks/documents",
  "POST /v1/background-checks/documents/upload-url",
  "POST /v1/employers/follow",
  "POST /v1/inquiries/:p/respond",
  "POST /v1/inquiries/bulk/archive",
  "POST /v1/inquiries/bulk/mark-read",
  "POST /v1/jobs",
  "POST /v1/organizations/:p/documents/:p/download-url",
  "POST /v1/organizations/:p/documents/upload-session",
  "POST /v1/organizations/:p/members/:p/remove",
  "POST /v1/organizations/:p/members/invite",
  "POST /v1/profiles/avatar",
  "POST /v1/profiles/portfolio/upload-image",
  "POST /v1/projects/:p/addresses",
  "POST /v1/projects/:p/sites",
  "POST /v1/projects/:p/workers",
  "POST /v1/projects/:p/workers/claim",
  "POST /v1/projects/workers/:p/approve",
  "POST /v1/projects/workers/:p/reject",
  "POST /v1/skills/evidence",
  "POST /v1/skills/evidence/:p/verify",
  "POST /v1/skills/snapshots",
  "POST /v1/skills/snapshots/compare",
  "POST /v1/teams/:p/invitations/:p/resend",
  "POST /v1/teams/:p/jobs",
  "POST /v1/teams/invitations/:p/respond",
  "POST /v1/teams/invitations/respond",
  "POST /v1/webhooks/deliveries/:p/retry",
  "POST /v1/work-logs/:p/move",
  "POST /v1/work-logs/:p/move/approve",
  "POST /v1/work-logs/:p/move/cancel",
  "POST /v1/work-logs/:p/move/deny",
  "POST /v1/work-logs/check-overlap",
  "POST /v1/work-logs/skills",
]);

/**
 * Reduce a path to a comparable shape: drop the query string, collapse every
 * parameter spelling (`:id`, `{id}`, `${id}`) to `:p`.
 *
 * Static segments are deliberately NOT treated as matching a param route. A
 * literal `/slug/check` that only resolves because `/slug/:slug` swallows it is
 * a bug — it reaches the wrong handler — so it should be reported.
 */
export function normalisePath(input: string): string {
  let s = input;

  const q = s.indexOf("?");
  if (q !== -1) s = s.slice(0, q);

  // A `${...}` glued to a segment with no preceding `/` is a query suffix
  // (`/foo${query}`), not a path parameter.
  s = s.replace(/(?<!\/)\$\{[^}]*\}$/, "");

  s = s
    .replace(/\$\{[^}]*\}/g, ":p")
    .replace(/\{[^}]*\}/g, ":p")
    .replace(/:[A-Za-z_]\w*/g, ":p");

  // Nested backticks (`...${qs ? `?${qs}` : ""}`) truncate the captured string
  // mid-interpolation. Whatever dangles is always a query suffix.
  s = s.replace(/\$\{.*$/, "");

  s = s.replace(/\/{2,}/g, "/");
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  if (!s.startsWith("/")) s = `/${s}`;
  return s;
}

interface RouteFileStats {
  file: string;
  count: number;
}

/** Parse api/index.ts into the list of mounted sub-routers and their prefixes. */
async function readMounts(): Promise<Array<{ prefix: string; file: string }>> {
  const src = await Deno.readTextFile(`${API_DIR}index.ts`);

  const identToFile = new Map<string, string>();
  for (
    const m of src.matchAll(/import\s+(\w+)\s+from\s+"\.\/routes\/([\w-]+)\.ts"/g)
  ) {
    identToFile.set(m[1], m[2]);
  }

  const mounts: Array<{ prefix: string; file: string }> = [];
  for (const m of src.matchAll(/\.route\(\s*"([^"]+)"\s*,\s*(\w+)\s*\)/g)) {
    const file = identToFile.get(m[2]);
    if (file) mounts.push({ prefix: m[1], file });
  }
  return mounts;
}

/**
 * Collect every route a router file registers, as `"<METHOD> <path>"` relative
 * to the file. Handles both styles in this codebase: plain Hono
 * (`someRouter.get("/x", ...)`) and zod-openapi (`createRoute({ method, path })`,
 * which several files import under an alias).
 */
function readRoutesFromFile(src: string): Array<{ method: string; path: string }> {
  const out: Array<{ method: string; path: string }> = [];

  // Any identifier, not just `app`/`router` — files use `ccpaRouter.get(...)`
  // etc. Requiring the path to start with "/" is what keeps `c.get("user")`
  // and `Deno.env.get("...")` out.
  for (
    const m of src.matchAll(
      new RegExp(
        `\\b[A-Za-z_]\\w*\\.(${HTTP_VERBS})\\(\\s*["'\`](/[^"'\`]*)["'\`]`,
        "g",
      ),
    )
  ) {
    out.push({ method: m[1].toUpperCase(), path: m[2] });
  }

  // Resolve the local name(s) of createRoute — portfolio.ts imports it as
  // createOpenAPIRoute, so a hardcoded "createRoute({" misses the whole file.
  const aliases = new Set<string>();
  const importBlock = /import\s*\{([\s\S]*?)\}\s*from\s*"@hono\/zod-openapi"/.exec(src);
  if (importBlock) {
    for (const m of importBlock[1].matchAll(/\bcreateRoute\b(?:\s+as\s+(\w+))?/g)) {
      aliases.add(m[1] ?? "createRoute");
    }
  }
  for (const alias of aliases) {
    let i = 0;
    for (;;) {
      i = src.indexOf(`${alias}({`, i);
      if (i === -1) break;
      // method and path are always in the opening lines, before any nesting.
      const head = src.slice(i, i + 800);
      const method = /method:\s*["'](\w+)["']/.exec(head);
      const path = /path:\s*["'`]([^"'`]*)["'`]/.exec(head);
      if (method && path) {
        out.push({ method: method[1].toUpperCase(), path: path[1] });
      }
      i += alias.length + 2;
    }
  }

  return out;
}

/** Every route the api registers, as normalised `"<METHOD> <path>"`. */
async function readRegisteredRoutes(): Promise<{
  routes: Set<string>;
  stats: RouteFileStats[];
}> {
  const routes = new Set<string>();
  const stats: RouteFileStats[] = [];

  for (const { prefix, file } of await readMounts()) {
    let src: string;
    try {
      src = await Deno.readTextFile(`${API_DIR}routes/${file}.ts`);
    } catch {
      stats.push({ file, count: 0 });
      continue;
    }
    const parsed = readRoutesFromFile(src);
    for (const { method, path } of parsed) {
      const suffix = path === "/" || path === "" ? "" : path;
      routes.add(`${method} ${normalisePath(prefix + suffix)}`);
    }
    stats.push({ file, count: parsed.length });
  }

  return { routes, stats };
}

/** Every endpoint the SDK calls with a statically readable path. */
async function readSdkEndpoints(): Promise<Set<string>> {
  const endpoints = new Set<string>();

  for await (const entry of Deno.readDir(SDK_RESOURCES)) {
    if (!entry.isFile || !entry.name.endsWith(".ts")) continue;
    const src = await Deno.readTextFile(`${SDK_RESOURCES}/${entry.name}`);

    // Backticked paths may contain quotes inside `${...}`, so they need their
    // own alternative rather than one shared character class.
    for (
      const m of src.matchAll(
        /this\.(get|post|patch|put|del)(?:<[^>]*>)?\(\s*(?:`([^`]*)`|'([^']*)'|"([^"]*)")/g,
      )
    ) {
      const raw = m[2] ?? m[3] ?? m[4];
      if (!raw?.startsWith("/")) continue;
      endpoints.add(`${SDK_METHOD_VERB[m[1]]} ${normalisePath(raw)}`);
    }
  }

  return endpoints;
}

/** The SDK is a git submodule; it is not always checked out. */
async function sdkCheckedOut(): Promise<boolean> {
  try {
    return (await Deno.stat(SDK_RESOURCES)).isDirectory;
  } catch {
    return false;
  }
}

Deno.test("api router: parser still understands the route files", async () => {
  const { routes, stats } = await readRegisteredRoutes();

  // Without these guards a parser regression turns every assertion below into a
  // vacuous pass (or a 400-line failure), and nobody would trust the result.
  const emptyFiles = stats.filter((s) => s.count === 0).map((s) => s.file);
  assertEquals(
    emptyFiles,
    [],
    `Parsed 0 routes from these mounted router files — the parser is probably ` +
      `out of date with a new registration style: ${emptyFiles.join(", ")}`,
  );

  if (routes.size < 300) {
    throw new Error(
      `Only ${routes.size} registered routes parsed; expected 300+. ` +
        `The route parser has likely broken.`,
    );
  }
});

Deno.test("SDK ↔ api: no SDK method calls an unimplemented endpoint", async () => {
  if (!await sdkCheckedOut()) {
    console.warn(
      `skipped: SDK submodule not checked out at ${SDK_RESOURCES} ` +
        `(git submodule update --init packages/sdk)`,
    );
    return;
  }

  const { routes } = await readRegisteredRoutes();
  const sdkEndpoints = await readSdkEndpoints();

  if (sdkEndpoints.size < 300) {
    throw new Error(
      `Only ${sdkEndpoints.size} SDK endpoints parsed; expected 300+. ` +
        `The SDK parser has likely broken.`,
    );
  }

  const missing = [...sdkEndpoints].filter((e) => !routes.has(e)).sort();
  const newGaps = missing.filter((e) => !KNOWN_GAPS.has(e));

  assertEquals(
    newGaps,
    [],
    `These SDK methods call api endpoints that do not exist. They will 404 at ` +
      `runtime and surface as empty or "not found" UI, not as errors:\n` +
      newGaps.map((e) => `  ${e}`).join("\n") +
      `\n\nImplement the route, fix the SDK path, or — if it is genuinely ` +
      `expected for now — add it to KNOWN_GAPS with a reason.`,
  );
});

Deno.test("SDK ↔ api: KNOWN_GAPS has no stale entries", async () => {
  if (!await sdkCheckedOut()) return;

  const { routes } = await readRegisteredRoutes();
  const sdkEndpoints = await readSdkEndpoints();
  const missing = new Set([...sdkEndpoints].filter((e) => !routes.has(e)));

  // An entry stops being a gap once the route is implemented *or* once the SDK
  // stops calling it. Either way the line is dead and should go.
  const stale = [...KNOWN_GAPS].filter((e) => !missing.has(e)).sort();

  assertEquals(
    stale,
    [],
    `These KNOWN_GAPS entries are no longer gaps — the endpoint now resolves, ` +
      `or the SDK no longer calls it. Delete them from KNOWN_GAPS in ` +
      `${HERE}sdk-routes.test.ts so the baseline keeps meaning something:\n` +
      stale.map((e) => `  ${e}`).join("\n"),
  );
});
