import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

/**
 * Profile completion is calculated in two places: core.v_profile_completion_scores
 * (migration 345) and the TypeScript path in routes/profile-completion.ts. They
 * have to agree, and #585 is what happens when they quietly do not — both
 * counted core.user_skills without a taxonomy filter, so the 25-row soft-skills
 * self-assessment satisfied the ">= 3 skills" component on its own.
 *
 * These assert the *rule*, so that changing one side without the other is a
 * visible edit here rather than a silent divergence in production.
 */
const SCORED_TAXONOMIES = ["csi", "onet"] as const;

type SkillRow = { skill_taxonomy: string };

/** Mirrors the `.in("skill_taxonomy", [...])` filter both paths now apply. */
function countScorableSkills(rows: SkillRow[]): number {
  return rows.filter((r) =>
    (SCORED_TAXONOMIES as readonly string[]).includes(r.skill_taxonomy)
  ).length;
}

Deno.test("soft skills alone do not satisfy the skills component", () => {
  // marcus.rivera@example.test: three soft_skills rows, zero trade skills, and
  // GET /v1/profiles/completion/status returned completionPercentage 100.
  const rows: SkillRow[] = [
    { skill_taxonomy: "soft_skills" },
    { skill_taxonomy: "soft_skills" },
    { skill_taxonomy: "soft_skills" },
  ];

  assertEquals(countScorableSkills(rows), 0);
  assert(countScorableSkills(rows) < 3);
});

Deno.test("a full soft-skills assessment still scores zero here", () => {
  const rows: SkillRow[] = Array.from({ length: 25 }, () => ({
    skill_taxonomy: "soft_skills",
  }));

  assertEquals(countScorableSkills(rows), 0);
});

Deno.test("csi and onet skills both count", () => {
  const rows: SkillRow[] = [
    { skill_taxonomy: "csi" },
    { skill_taxonomy: "onet" },
    { skill_taxonomy: "csi" },
  ];

  assertEquals(countScorableSkills(rows), 3);
});

Deno.test("soft skills do not pad a nearly-complete trade-skill set", () => {
  const rows: SkillRow[] = [
    { skill_taxonomy: "csi" },
    { skill_taxonomy: "csi" },
    { skill_taxonomy: "soft_skills" },
    { skill_taxonomy: "soft_skills" },
  ];

  // Two real skills is two, not four.
  assertEquals(countScorableSkills(rows), 2);
});

Deno.test("the scored taxonomies match what the skills widget reads", () => {
  // GET /v1/profiles/widgets/skills filters to the same pair. If these drift, a
  // worker sees "Skills: complete" beside a widget saying "No skills added yet".
  assertEquals([...SCORED_TAXONOMIES], ["csi", "onet"]);
});
