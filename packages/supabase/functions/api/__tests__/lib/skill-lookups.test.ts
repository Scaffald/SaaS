import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  loadSkillLookups,
  normaliseOnetCode,
  type SkillLookups,
  toSkillWidgetEntry,
} from "../../lib/skill-lookups.ts";

/** Minimal stand-in for the supabase client's query builder. */
function fakeSupabase(
  csiRows: unknown[],
  onetRows: unknown[],
  calls?: { csiIds?: string[]; onetIds?: string[] },
) {
  return {
    schema(name: string) {
      return {
        from(_table: string) {
          return {
            select(_cols: string) {
              return {
                in(_col: string, ids: string[]) {
                  if (name === "data") {
                    if (calls) calls.csiIds = ids;
                    return Promise.resolve({ data: csiRows, error: null });
                  }
                  if (calls) calls.onetIds = ids;
                  return Promise.resolve({ data: onetRows, error: null });
                },
              };
            },
          };
        },
      };
    },
  };
}

const CSI = {
  id: "csi-1",
  name: "Electrical",
  code_key: "26-00-00-00",
  code_display: "26 00 00.00",
  depth: 1,
};

const lookupsWith = (): SkillLookups => ({
  csi: new Map([[CSI.id, CSI]]),
  onet: new Map([["47-2111.00", {
    onetsoc_code: "47-2111.00",
    title: "Electricians",
  }]]),
});

Deno.test("normaliseOnetCode trims the stray whitespace some rows carry", () => {
  assertEquals(normaliseOnetCode("  47-2111.00 "), "47-2111.00");
  assertEquals(normaliseOnetCode(null), "");
  assertEquals(normaliseOnetCode(undefined), "");
});

Deno.test("loadSkillLookups queries each taxonomy with its own ids", async () => {
  const calls: { csiIds?: string[]; onetIds?: string[] } = {};
  const supabase = fakeSupabase([CSI], [{
    onetsoc_code: "47-2111.00",
    title: "Electricians",
  }], calls);

  await loadSkillLookups(supabase, [
    { skill_taxonomy: "csi", csi_skill_id: "csi-1" },
    { skill_taxonomy: "onet", onet_occupation_id: " 47-2111.00 " },
  ]);

  assertEquals(calls.csiIds, ["csi-1"]);
  // Trimmed before the lookup, or the `.in()` never matches.
  assertEquals(calls.onetIds, ["47-2111.00"]);
});

Deno.test("loadSkillLookups deduplicates repeated ids", async () => {
  const calls: { csiIds?: string[] } = {};
  const supabase = fakeSupabase([CSI], [], calls);

  await loadSkillLookups(supabase, [
    { skill_taxonomy: "csi", csi_skill_id: "csi-1" },
    { skill_taxonomy: "csi", csi_skill_id: "csi-1" },
    { skill_taxonomy: "csi", csi_skill_id: "csi-1" },
  ]);

  assertEquals(calls.csiIds, ["csi-1"]);
});

Deno.test("loadSkillLookups issues no query when there is nothing to resolve", async () => {
  let queried = false;
  const supabase = {
    schema() {
      queried = true;
      return { from: () => ({ select: () => ({ in: () => Promise.resolve({ data: [], error: null }) }) }) };
    },
  };

  const lookups = await loadSkillLookups(supabase, []);

  assert(!queried);
  assertEquals(lookups.csi.size, 0);
  assertEquals(lookups.onet.size, 0);
});

// The #603 regression: this endpoint returned raw core.user_skills rows, which
// have no name and no display code, while its own response schema and SDK type
// declared both. Anything rendering `label` got an empty string.
Deno.test("toSkillWidgetEntry resolves a csi skill's name and display code", () => {
  const entry = toSkillWidgetEntry(
    {
      id: "row-1",
      skill_taxonomy: "csi",
      csi_skill_id: "csi-1",
      proficiency_level: 4,
      years_experience: 7,
    },
    lookupsWith(),
  );

  assertEquals(entry.name, "Electrical");
  assertEquals(entry.label, "Electrical");
  assertEquals(entry.displayCode, "26 00 00.00");
  assertEquals(entry.taxonomy, "csi");
  assertEquals(entry.proficiency, 4);
  assertEquals(entry.yearsExperience, 7);
});

Deno.test("toSkillWidgetEntry resolves an onet skill by trimmed code", () => {
  const entry = toSkillWidgetEntry(
    {
      id: "row-2",
      skill_taxonomy: "onet",
      onet_occupation_id: " 47-2111.00 ",
      proficiency_level: 3,
    },
    lookupsWith(),
  );

  assertEquals(entry.name, "Electricians");
  assertEquals(entry.taxonomy, "onet");
  assertEquals(entry.displayCode, "47-2111.00");
});

Deno.test("an unresolved skill still renders something rather than an empty row", () => {
  const entry = toSkillWidgetEntry(
    { id: "row-3", skill_taxonomy: "csi", csi_skill_id: "missing" },
    lookupsWith(),
  );

  assertEquals(entry.name, "");
  assertEquals(entry.label, "Unnamed skill");
});

Deno.test("proficiency and years default rather than emitting undefined", () => {
  const entry = toSkillWidgetEntry(
    { id: "row-4", skill_taxonomy: "csi", csi_skill_id: "csi-1" },
    lookupsWith(),
  );

  assertEquals(entry.proficiency, 0);
  assertEquals(entry.yearsExperience, null);
  assertEquals(entry.verified, false);
  assertEquals(entry.metadata, null);
});

Deno.test("an unknown taxonomy falls back to csi rather than leaking through", () => {
  const entry = toSkillWidgetEntry(
    { id: "row-5", skill_taxonomy: "soft_skills", csi_skill_id: null },
    lookupsWith(),
  );

  // The endpoint filters to csi/onet upstream, so this is belt-and-braces —
  // the union type must not be widened by a stray row.
  assertEquals(entry.taxonomy, "csi");
});
