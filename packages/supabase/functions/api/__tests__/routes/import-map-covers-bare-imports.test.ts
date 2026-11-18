/**
 * Every bare import the deployed `api` function can reach must be in
 * api/deno.json's import map.
 *
 * The deployed function resolves bare specifiers ONLY through api/deno.json.
 * `_shared/payments/stripe-client.ts` and `_shared/id-verification-api.ts`
 * load Stripe with a dynamic `import("stripe")`, which typecheck and the
 * mocked tests never evaluate, and api/deno.json had no "stripe" entry. So on
 * every environment with real Stripe keys, each charge (background checks, ID
 * verification) failed with `Relative import path "stripe" not prefixed …
 * not in import map` — found the first time dev got sandbox keys, 2026-11-18.
 *
 * This walks the relative-import graph from api/index.ts (static and dynamic
 * imports, `import type` included because it names the same package) and
 * checks each bare specifier against the map, the way the runtime would.
 */
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

const API_DIR = new URL("../../", import.meta.url);
const ENTRY = new URL("index.ts", API_DIR);

const IMPORT_RE =
  /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g;

function isBare(spec: string): boolean {
  return !/^(\.{1,2}\/|\/|https?:|npm:|jsr:|node:|data:)/.test(spec);
}

function mapped(spec: string, imports: Record<string, string>): boolean {
  if (spec in imports) return true;
  // "hono/" style prefix entries cover "hono/cors" etc.
  return Object.keys(imports).some((k) =>
    k.endsWith("/") && spec.startsWith(k)
  );
}

Deno.test("api/deno.json maps every bare import reachable from api/index.ts", async () => {
  const config = JSON.parse(
    await Deno.readTextFile(new URL("deno.json", API_DIR)),
  );
  const imports: Record<string, string> = config.imports ?? {};

  const seen = new Set<string>();
  const missing = new Map<string, string>();
  const queue: URL[] = [ENTRY];

  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file.href)) continue;
    seen.add(file.href);

    let source: string;
    try {
      source = await Deno.readTextFile(file);
    } catch {
      continue; // a generated or optional file; resolution is not this test's job
    }

    for (const match of source.matchAll(IMPORT_RE)) {
      const spec = match[1] ?? match[2];
      if (!spec) continue;
      if (spec.startsWith(".")) {
        if (/\.(ts|tsx|js|mjs)$/.test(spec)) queue.push(new URL(spec, file));
        continue;
      }
      if (isBare(spec) && !mapped(spec, imports) && !missing.has(spec)) {
        missing.set(
          spec,
          file.pathname.replace(new URL("../", API_DIR).pathname, ""),
        );
      }
    }
  }

  assertEquals(
    [...missing].map(([spec, from]) => `${spec}  (first imported by ${from})`),
    [],
    'add these to packages/supabase/functions/api/deno.json "imports"',
  );
});
