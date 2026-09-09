/**
 * Every table a route reads or writes must exist in the schema.
 *
 * This defect has been found one endpoint at a time, by accident, for months:
 * #476 (core.inquiries), #482 (core.organizations columns), #618
 * (core.employers), #481 (grants). Each was diagnosed from a 500 in a browser.
 * A sweep of every `.from()` in every route file turns up 43 such references
 * across 20 table names and 13 files — so the pattern is not a handful of
 * typos, and finding them by running the app does not scale.
 *
 * The schema comes from packages/supabase/types.ts, which is generated from the
 * database and checked in, so this needs no database to run.
 *
 * BASELINE_BROKEN below is the set that already existed when this test was
 * written. The test fails on anything *new*, and fails again when an entry is
 * fixed but left in the list — so the number can only go down.
 */
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

const ROUTES_DIR = new URL("../../routes/", import.meta.url);
const TYPES = new URL("../../../../types.ts", import.meta.url);

/** schema -> tables and views it contains, from the generated types. */
async function schemaCatalogue(): Promise<Set<string>> {
  const text = await Deno.readTextFile(TYPES);
  const out = new Set<string>();
  const block =
    /\n {2}(\w+): \{\n {4}Tables: \{\n([\s\S]*?)\n {4}\}\n {4}Views: \{\n([\s\S]*?)\n {4}\}\n/g;

  for (const m of text.matchAll(block)) {
    const [, schema, tables, views] = m;
    for (const src of [tables, views]) {
      for (const t of src.matchAll(/^ {6}(\w+): \{$/gm)) {
        out.add(`${schema}.${t[1]}`);
      }
    }
  }
  return out;
}

export interface TableRef {
  file: string;
  line: number;
  ref: string;
}

/**
 * Every `.from("x")` in a route file, resolved against the `.schema("y")` that
 * governs it.
 *
 * PostgREST defaults to `public` when no schema is set, which is exactly the
 * bug in office-users.ts: one `.schema("core")` on the first call in a chain of
 * deletes, and the rest silently address public.
 */
export function tableRefs(file: string, source: string): TableRef[] {
  const lines = source.split("\n");
  const refs: TableRef[] = [];

  // Scope by statement, not by a fixed line window. `.schema()` applies to the
  // chain it is written on and nothing after it — the delete cascade in
  // office-users.ts sets it once and then makes six more calls that quietly
  // address `public`. A backward line-scan reads those as `core` and hides the
  // bug it is meant to find.
  let start = 0;
  let buffer: string[] = [];

  const flush = () => {
    if (buffer.length === 0) return;
    const stmt = buffer.join("\n");

    for (let k = 0; k < buffer.length; k++) {
      const from = buffer[k].match(/\.from\(\s*"([\w.]+)"\s*\)/);
      if (!from) continue;
      // A storage bucket is not a table.
      if (/\.storage\b/.test(stmt)) continue;

      // The governing .schema() is the nearest one *before* this .from(),
      // not the first one in the statement. A statement can hold more than one
      // chain -- a Promise.all([...]) of two queries is a single statement --
      // and taking the first match attributed the second chain's .from() to the
      // first chain's schema. That is what put `community.users` in
      // BASELINE_BROKEN: office-communities.ts:146 reads .schema("core")
      // .from("users") inside a Promise.all whose first element is
      // .schema("community"), so a correct reference was reported as broken.
      //
      // Scanning backwards is still correct for the office-users.ts
      // delete-cascade bug this test was written to catch: those calls are
      // separate statements, so each lands in its own buffer and only the first
      // sees a .schema() at all.
      let schema = "public";
      for (let j = k; j >= 0; j--) {
        const m = buffer[j].match(/\.schema\(\s*"(\w+)"\s*\)/);
        if (m) {
          schema = m[1];
          break;
        }
      }

      const table = from[1];
      refs.push({
        file,
        line: start + k + 1,
        ref: table.includes(".") ? table : `${schema}.${table}`,
      });
    }
    buffer = [];
  };

  for (let i = 0; i < lines.length; i++) {
    if (buffer.length === 0) start = i;
    buffer.push(lines[i]);
    if (lines[i].trimEnd().endsWith(";")) flush();
  }
  flush();

  return refs;
}

/**
 * References that were already broken when this test landed. Each one is a bug;
 * none is acceptable. Remove entries as they are fixed — a fixed entry left
 * here fails the test rather than rotting.
 */
const BASELINE_BROKEN: Record<string, number> = {
  "core.soft_skills_ratings": 8,
  "core.profile_import_data": 5,
  "core.inquiries": 2,
  "core.profile_completion_nudges": 1,

  // core.content_reports, core.user_blocks and core.user_feedback were listed
  // here while types.ts was stale, and are gone now that it has been
  // regenerated (#707). The list did what it is for: the entries went stale,
  // the second test demanded their removal, and the count went down.
};

/** Schemas types.ts knows about — a reference into any other schema cannot be
 * judged here. `logs` is real in the database but absent from the generated
 * types, so treating it as missing would report a working route as broken. */
function knownSchemas(catalogue: Set<string>): Set<string> {
  return new Set([...catalogue].map((t) => t.split(".")[0]));
}

async function allRefs(): Promise<TableRef[]> {
  const refs: TableRef[] = [];
  for await (const entry of Deno.readDir(ROUTES_DIR)) {
    if (!entry.isFile || !entry.name.endsWith(".ts")) continue;
    const source = await Deno.readTextFile(new URL(entry.name, ROUTES_DIR));
    refs.push(...tableRefs(entry.name, source));
  }
  return refs;
}

Deno.test("no route references a table that does not exist", async () => {
  const catalogue = await schemaCatalogue();
  const schemas = knownSchemas(catalogue);
  const broken = (await allRefs()).filter((r) =>
    schemas.has(r.ref.split(".")[0]) && !catalogue.has(r.ref)
  );

  const counts: Record<string, number> = {};
  for (const r of broken) counts[r.ref] = (counts[r.ref] ?? 0) + 1;

  const unexpected = Object.entries(counts)
    .filter(([ref, n]) => n > (BASELINE_BROKEN[ref] ?? 0))
    .map(([ref, n]) => {
      const where = broken.filter((r) => r.ref === ref)
        .map((r) => `${r.file}:${r.line}`).join(", ");
      return `${ref}: ${n} reference(s), baseline ${
        BASELINE_BROKEN[ref] ?? 0
      } — at ${where}`;
    });

  assertEquals(unexpected, []);
});

Deno.test("BASELINE_BROKEN has no stale entries", async () => {
  const catalogue = await schemaCatalogue();
  const broken = await allRefs();

  const schemas = knownSchemas(catalogue);
  const counts: Record<string, number> = {};
  for (const r of broken) {
    if (schemas.has(r.ref.split(".")[0]) && !catalogue.has(r.ref)) {
      counts[r.ref] = (counts[r.ref] ?? 0) + 1;
    }
  }

  // A reference that has been fixed, or reduced, must be removed or lowered
  // here — otherwise the list stops describing the codebase.
  const stale = Object.entries(BASELINE_BROKEN)
    .filter(([ref, n]) => (counts[ref] ?? 0) < n)
    .map(([ref, n]) =>
      `${ref}: baseline says ${n}, found ${
        counts[ref] ?? 0
      } — lower or remove this entry`
    );

  assertEquals(stale, []);
});

Deno.test("the catalogue actually parsed", async () => {
  // If types.ts changes shape this test would otherwise pass vacuously by
  // finding an empty catalogue and calling every reference broken — or, worse,
  // by finding nothing to check at all.
  const catalogue = await schemaCatalogue();
  assertEquals(catalogue.has("core.work_logs"), true);
  assertEquals(catalogue.has("core.organizations"), true);
  assertEquals(catalogue.has("onet.skills"), true);
  assertEquals(catalogue.has("core.employers"), false);
});

Deno.test("tableRefs resolves .from against the governing .schema", () => {
  const refs = tableRefs(
    "x.ts",
    [
      'await db.schema("core").from("user_skills").delete().eq("user_id", id);',
      'await db.from("applications").delete().eq("user_id", id);',
    ].join("\n"),
  );

  assertEquals(refs[0].ref, "core.user_skills");
  // The second call carries no .schema(), so PostgREST addresses public — this
  // is the office-users.ts delete-cascade bug in miniature.
  assertEquals(refs[1].ref, "public.applications");
});

Deno.test("tableRefs attributes each chain in a statement to its own schema", () => {
  // A Promise.all of two queries is one statement with two .schema() calls.
  // Taking the first one for both is how a correct reference ended up in
  // BASELINE_BROKEN as `community.users`.
  const refs = tableRefs(
    "x.ts",
    [
      "const [a, b] = await Promise.all([",
      "  supabase",
      '    .schema("community")',
      '    .from("communities")',
      '    .select("id"),',
      "  supabase",
      '    .schema("core")',
      '    .from("users")',
      '    .select("id"),',
      "]);",
    ].join("\n"),
  );

  assertEquals(refs.map((r) => r.ref), ["community.communities", "core.users"]);
});

Deno.test("tableRefs ignores storage buckets", () => {
  const refs = tableRefs(
    "x.ts",
    [
      "const { error } = await supabase.storage",
      '  .from("certifications")',
      "  .upload(name, bytes);",
    ].join("\n"),
  );

  assertEquals(refs, []);
});
