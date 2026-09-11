/**
 * SDK ↔ api response-envelope contract test
 *
 * Sibling to sdk-routes.test.ts. That one asks whether a route exists at all;
 * this one asks whether the SDK agrees with it about the *shape* of the
 * success body.
 *
 * Some routes wrap their payload — `c.json({ data: … })` — and some return it
 * bare. The http client returns the parsed body verbatim:
 *
 *     if (response.ok) {
 *       const data = await response.json()
 *       return data          // no unwrapping
 *     }
 *
 * so a method declaring `Promise<UserProfile>` against a wrapping route
 * actually resolves to `{ data: UserProfile }`. TypeScript never notices,
 * because the generic is asserted (`this.get<UserProfile>(…)`), not inferred
 * from the wire. And the msw handlers are written from the declared types, so
 * the suite agrees with the type while the type disagrees with the API.
 *
 * That combination has now produced three wrong contracts that a green suite
 * certified — Scaffald/sdk#21 (employers), #26 (organizations) and #29
 * (getUser). A mock written from the type can never catch this class, which is
 * why the check has to compare the route to the SDK rather than either to a
 * fixture.
 *
 * Static, like its sibling: parses source, boots nothing, touches no database.
 *
 *   deno test --allow-read packages/supabase/functions/api/__tests__/contract/
 *
 * ## What counts as an envelope
 *
 * `data` plus nothing but pagination/metadata keys. A body that merely *has* a
 * `data` field alongside domain fields is not an envelope — the naive "has a
 * top-level data key" rule reported PrerequisitesCheckResponse as wrapped, and
 * a live probe of `/v1/prerequisites/check` showed it returns
 * `{ isComplete, hasName, … , data }` bare.
 *
 * ## The baseline
 *
 * BASELINE_MISMATCHES records the pairs that already disagreed. They are
 * recorded, not fixed: deciding which side should move is a public-API call
 * (Scaffald/SaaS#744), and it is 25 endpoints across 15 files. Enforced in both
 * directions — a new mismatch fails, and so does a stale entry, so the list can
 * only shrink.
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { normalisePath } from "./sdk-routes.test.ts";

const API_DIR = new URL("../../", import.meta.url).pathname;
const REPO_ROOT = new URL("../../../../../../", import.meta.url).pathname;
const SDK_SRC = `${REPO_ROOT}packages/sdk/src`;
const SDK_RESOURCES = `${SDK_SRC}/resources`;

const HTTP_VERBS = "get|post|put|patch|delete";

/**
 * Keys allowed to sit beside `data` and still count as an envelope. Anything
 * else means the body is a domain object that happens to contain `data`.
 */
const META_KEYS = new Set([
  "total",
  "count",
  "meta",
  "pagination",
  "page",
  "limit",
  "offset",
  "hasMore",
  "has_more",
  "cursor",
  "nextCursor",
  "next_cursor",
]);

/**
 * Pairs that already disagree. `"<VERB> <path>"` -> which side says what.
 * Delete a line when the pair is brought into agreement; leaving it fails.
 */
const BASELINE_MISMATCHES: Record<string, string> = {
  // Each of these resolves on both sides and genuinely disagrees. The value is
  // the reason, not a category — deciding which side moves is Scaffald/SaaS#744.

  "PATCH /v1/api-keys/:p": "sdk-bare",
  "GET /v1/api-keys/:p/usage": "sdk-bare",
  "GET /v1/auth/roles": "sdk-bare",
  "POST /v1/connections/:p/accept": "sdk-bare",
  "POST /v1/connections/request": "sdk-bare",
  "POST /v1/engagement/track": "sdk-bare",
  "POST /v1/follows/job": "sdk-bare",
  "POST /v1/follows/user": "sdk-bare",
  "POST /v1/office/jobs/:p/duplicate": "sdk-bare",
  "GET /v1/personality-assessment/ipip/status": "sdk-wrapped",
  "GET /v1/personality-assessment/status": "sdk-wrapped",
};

// ── shared parsing helpers ───────────────────────────────────────────────────

/** Brace-match forward from the first `{` at or after `from`. */
function braceBlock(src: string, from: number): string {
  const i = src.indexOf("{", from);
  if (i === -1) return "";
  let depth = 0;
  for (let e = i; e < src.length; e++) {
    if (src[e] === "{") depth++;
    else if (src[e] === "}") {
      depth--;
      if (depth === 0) return src.slice(i, e + 1);
    }
  }
  return src.slice(i);
}

/** Top-level key names of an object literal / interface body. */
function topLevelKeys(block: string): string[] {
  const body = block.startsWith("{") ? block.slice(1, -1) : block;
  let depth = 0;
  let cur = "";
  const parts: string[] = [];
  for (const ch of body) {
    if ("{([".includes(ch)) depth++;
    else if ("})]".includes(ch)) depth--;
    else if ((ch === "," || ch === "\n") && depth === 0) {
      parts.push(cur);
      cur = "";
      continue;
    }
    if (depth === 0) cur += ch;
  }
  parts.push(cur);
  return parts
    .map((p) => {
      const t = p.trim();
      if (!t) return undefined;
      // `key: value`
      const withValue = /^["']?(\w+)["']?\??\s*:/.exec(t);
      if (withValue) return withValue[1];
      // Shorthand — `{ data }` is `{ data: data }`. Missing this read
      // `return c.json({ data }, 200)` as a bare body and reported two
      // perfectly correct routes as mismatched.
      const shorthand = /^(\w+)$/.exec(t);
      if (shorthand) return shorthand[1];
      // `...spread` — cannot know the keys, so surface it as a sentinel that
      // can never look like an envelope.
      if (t.startsWith("...")) return "\u0000spread";
      return undefined;
    })
    .filter((k): k is string => Boolean(k));
}

function isEnvelope(keys: string[]): boolean {
  if (!keys.includes("data")) return false;
  return keys.every((k) => k === "data" || META_KEYS.has(k));
}

// ── the api side ─────────────────────────────────────────────────────────────

/** Success-response envelope for each route in one router file. */
function routeEnvelopes(src: string): Array<[string, string, boolean | null]> {
  const lines = src.split("\n");

  const regs: Array<[number, string, string]> = [];
  lines.forEach((l, i) => {
    const plain = new RegExp(
      `^\\s*[A-Za-z_]\\w*\\.(${HTTP_VERBS})\\(\\s*["'\`](/[^"'\`]*)`,
    ).exec(l);
    if (plain) regs.push([i, plain[1].toUpperCase(), plain[2]]);
    const openapi = /^\s*[A-Za-z_]\w*\.openapi\(\s*(\w+)/.exec(l);
    if (openapi) regs.push([i, "OPENAPI", openapi[1]]);
  });
  regs.sort((a, b) => a[0] - b[0]);

  // createRoute({ method, path }) consts, so an app.openapi(x) can be resolved
  const declared = new Map<string, [string, string]>();
  for (
    const m of src.matchAll(/const (\w+)\s*=\s*create(?:OpenAPI)?Route\(\{/g)
  ) {
    const head = src.slice(m.index!, m.index! + 3000);
    const method = /method:\s*["'](\w+)["']/.exec(head);
    const path = /path:\s*["'`]([^"'`]+)["'`]/.exec(head);
    if (method && path) declared.set(m[1], [method[1].toUpperCase(), path[1]]);
  }

  const out: Array<[string, string, boolean | null]> = [];
  regs.forEach(([ln, verb, ident], idx) => {
    const end = idx + 1 < regs.length ? regs[idx + 1][0] : lines.length;
    const body = lines.slice(ln, end).join("\n");

    let method = verb;
    let path = ident;
    if (verb === "OPENAPI") {
      const d = declared.get(ident);
      if (!d) return;
      [method, path] = d;
    }

    let envelope: boolean | null = null;
    for (const r of body.matchAll(/return\s+c\.json\(\s*(\{)?/g)) {
      if (!r[1]) {
        envelope = false;
        break;
      } // c.json(someVariable)
      const keys = topLevelKeys(braceBlock(body, r.index!));
      if (keys[0] === "error") continue; // error branch
      envelope = isEnvelope(keys);
      break;
    }
    out.push([method, path, envelope]);
  });
  return out;
}

async function readRouteEnvelopes(): Promise<Map<string, boolean>> {
  const index = await Deno.readTextFile(`${API_DIR}index.ts`);
  const identToFile = new Map<string, string>();
  for (
    const m of index.matchAll(
      /import\s+(\w+)\s+from\s+"\.\/routes\/([\w-]+)\.ts"/g,
    )
  ) identToFile.set(m[1], m[2]);

  const out = new Map<string, boolean>();
  for (const m of index.matchAll(/\.route\(\s*"([^"]+)"\s*,\s*(\w+)\s*\)/g)) {
    const file = identToFile.get(m[2]);
    if (!file) continue;
    let src: string;
    try {
      src = await Deno.readTextFile(`${API_DIR}routes/${file}.ts`);
    } catch {
      continue;
    }
    for (const [verb, path, envelope] of routeEnvelopes(src)) {
      if (envelope === null) continue;
      out.set(`${verb} ${normalisePath(m[1] + path)}`, envelope);
    }
  }
  return out;
}

// ── the sdk side ─────────────────────────────────────────────────────────────

async function readSdkTypeDefs(): Promise<Map<string, string>> {
  const defs = new Map<string, string>();
  const walk = async (dir: string) => {
    for await (const e of Deno.readDir(dir)) {
      const p = `${dir}/${e.name}`;
      if (e.isDirectory) {
        if (e.name !== "__tests__") await walk(p);
      } else if (e.name.endsWith(".ts") || e.name.endsWith(".tsx")) {
        const src = await Deno.readTextFile(p);
        for (
          const m of src.matchAll(
            /export (?:interface|type) (\w+)\s*(?:=\s*)?\{/g,
          )
        ) {
          defs.set(m[1], braceBlock(src, m.index! + m[0].length - 1));
        }
      }
    }
  };
  await walk(SDK_SRC);
  return defs;
}

/** Does this declared return type describe an envelope? null = undeterminable. */
function sdkEnvelope(ret: string, defs: Map<string, string>): boolean | null {
  const t = ret.trim();
  if (t.startsWith("{")) return isEnvelope(topLevelKeys(braceBlock(t, 0)));
  if (/^\w+$/.test(t)) {
    const body = defs.get(t);
    if (!body) return null;
    return isEnvelope(topLevelKeys(body));
  }
  return null;
}

/**
 * What a caller of this method actually receives, and what that implies about
 * the route.
 *
 * Three shapes exist in this SDK, and conflating them produces false findings:
 *
 *   direct     return this.get<T>(path)
 *              -> caller gets the raw body, so T must match the route exactly.
 *
 *   unwrapping const res = await this.get<X>(path); return res.data
 *              -> the method strips the envelope itself. Its declared type
 *                 describes the INNER payload and is correct precisely because
 *                 the route wraps. 39 methods across six resources do this;
 *                 comparing their declared type to the route's envelope reports
 *                 every one of them as broken.
 *
 *   other      anything else — not judged.
 */
type SdkShape = { declared: boolean | null; unwraps: boolean };

async function readSdkEnvelopes(): Promise<Map<string, SdkShape>> {
  const defs = await readSdkTypeDefs();
  const out = new Map<string, SdkShape>();
  for await (const entry of Deno.readDir(SDK_RESOURCES)) {
    if (!entry.isFile || !entry.name.endsWith(".ts")) continue;
    const src = await Deno.readTextFile(`${SDK_RESOURCES}/${entry.name}`);
    for (
      const m of src.matchAll(
        /async \w+\([^)]*\)\s*:\s*Promise<([\s\S]*?)>\s*\{/g,
      )
    ) {
      const bodyStart = m.index! + m[0].length;
      const after = src.slice(bodyStart, bodyStart + 600);
      const call = new RegExp(
        `this\\.(${HTTP_VERBS})(?:<[^>]*>)?\\(\\s*[\`'"]([^\`'"]+)`,
      ).exec(after);
      if (!call) continue;
      // Body up to the method's closing brace, so the unwrap check cannot read
      // into the next method.
      const body = braceBlock(src, bodyStart - 1);
      const unwraps = /return\s+\w+\.data\b/.test(body);
      out.set(`${call[1].toUpperCase()} ${normalisePath(call[2])}`, {
        declared: sdkEnvelope(m[1], defs),
        unwraps,
      });
    }
  }
  return out;
}

/**
 * Does this pairing disagree? Returns a description, or null when they agree.
 */
function disagreement(
  shape: SdkShape,
  routeWrapped: boolean,
): string | null {
  if (shape.unwraps) {
    // The method reads `.data` off the body. That is only correct if the route
    // actually wraps; against a bare route it yields undefined.
    return routeWrapped
      ? null
      : "sdk unwraps `.data`, route returns a bare body";
  }
  if (shape.declared === null) return null; // type not resolvable — not judged
  if (shape.declared === routeWrapped) return null;
  return `sdk says ${shape.declared ? "wrapped" : "bare"}, route says ${
    routeWrapped ? "wrapped" : "bare"
  }`;
}

async function sdkCheckedOut(): Promise<boolean> {
  try {
    return (await Deno.stat(SDK_RESOURCES)).isDirectory;
  } catch {
    return false;
  }
}

// ── tests ────────────────────────────────────────────────────────────────────

Deno.test("envelope parser still understands both sides", async () => {
  if (!await sdkCheckedOut()) return;

  const routes = await readRouteEnvelopes();
  const sdk = await readSdkEnvelopes();

  // Guards against a parser regression turning every assertion below vacuous.
  assertEquals(
    routes.size > 200,
    true,
    `Classified only ${routes.size} route envelopes — the parser is probably out ` +
      `of date with a new registration style.`,
  );
  assertEquals(
    sdk.size > 250,
    true,
    `Classified only ${sdk.size} SDK method envelopes — the parser is probably ` +
      `out of date with a new declaration style.`,
  );

  // Both conventions must still be represented, or the classifier has collapsed
  // to a constant and would report perfect agreement.
  const wrapped = [...routes.values()].filter(Boolean).length;
  assertEquals(
    wrapped > 20 && wrapped < routes.size - 20,
    true,
    `${wrapped} of ${routes.size} routes classified as wrapped — implausible; ` +
      `the classifier is probably returning a constant.`,
  );
});

Deno.test("SDK ↔ api: no method disagrees with its route about the envelope", async () => {
  if (!await sdkCheckedOut()) return;

  const routes = await readRouteEnvelopes();
  const sdk = await readSdkEnvelopes();

  const found: string[] = [];
  for (const [key, shape] of sdk) {
    const routeWrapped = routes.get(key);
    if (routeWrapped === undefined) continue; // no such route — sdk-routes.test.ts covers that
    const why = disagreement(shape, routeWrapped);
    if (why === null) continue;
    if (key in BASELINE_MISMATCHES) continue;
    found.push(`${key} — ${why}`);
  }

  assertEquals(
    found.sort(),
    [],
    `These SDK methods disagree with their route about the response envelope. ` +
      `The declared type will be wrong at runtime — the payload is either one ` +
      `level deeper or one level shallower than callers expect, and no mock ` +
      `written from the type can catch it:\n  ${found.join("\n  ")}\n\n` +
      `Fix the side that is wrong, or add it to BASELINE_MISMATCHES with a reason.`,
  );
});

Deno.test("BASELINE_MISMATCHES has no stale entries", async () => {
  if (!await sdkCheckedOut()) return;

  const routes = await readRouteEnvelopes();
  const sdk = await readSdkEnvelopes();

  const stale: string[] = [];
  for (const key of Object.keys(BASELINE_MISMATCHES)) {
    const routeWrapped = routes.get(key);
    const shape = sdk.get(key);
    if (routeWrapped === undefined || shape === undefined) {
      stale.push(`${key} — no longer resolves on both sides; remove it`);
      continue;
    }
    if (disagreement(shape, routeWrapped) === null) {
      stale.push(`${key} — now agrees; remove it`);
    }
  }

  assertEquals(
    stale.sort(),
    [],
    `BASELINE_MISMATCHES is out of date. A fixed entry left here rots, so the ` +
      `list is enforced in both directions:\n  ${stale.join("\n  ")}`,
  );
});
