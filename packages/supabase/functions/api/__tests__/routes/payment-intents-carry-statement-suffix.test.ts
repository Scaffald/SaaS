/**
 * Every PaymentIntent the api creates carries STATEMENT_DESCRIPTOR_SUFFIX.
 *
 * The Stripe account is Unicorn Love, LLC's, so without a suffix a Scaffald
 * customer's card statement shows only the legal entity — a charge people do
 * not recognise and dispute (#1260). The suffix is per-call, so a new
 * `paymentIntents.create` that forgets it would quietly regress that. This
 * reads each route's source and checks every create call's options object.
 */
import { assert } from "https://deno.land/std@0.208.0/assert/mod.ts";

const ROUTES_DIR = new URL("../../routes/", import.meta.url);

/** The `{ … }` argument of each `paymentIntents.create(` call, brace-matched. */
function createCallArgs(source: string): string[] {
  const out: string[] = [];
  const marker = "paymentIntents.create(";
  let from = 0;
  while (true) {
    const at = source.indexOf(marker, from);
    if (at === -1) return out;
    const open = source.indexOf("{", at);
    let depth = 0;
    let end = open;
    for (; end < source.length; end++) {
      if (source[end] === "{") depth++;
      else if (source[end] === "}" && --depth === 0) break;
    }
    out.push(source.slice(open, end + 1));
    from = end;
  }
}

Deno.test("every PaymentIntent the api creates sets the statement descriptor suffix", async () => {
  let calls = 0;
  for await (const entry of Deno.readDir(ROUTES_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".ts")) continue;
    const source = await Deno.readTextFile(new URL(entry.name, ROUTES_DIR));
    for (const args of createCallArgs(source)) {
      calls++;
      assert(
        /statement_descriptor_suffix:\s*STATEMENT_DESCRIPTOR_SUFFIX/.test(args),
        `routes/${entry.name}: a paymentIntents.create call has no statement_descriptor_suffix`,
      );
    }
  }
  // Background checks, ID verification and success fees today.
  assert(calls >= 3, `expected at least 3 create calls, found ${calls}`);
});
