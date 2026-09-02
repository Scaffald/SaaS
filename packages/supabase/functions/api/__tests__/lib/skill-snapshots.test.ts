import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  buildSummary,
  diffSnapshots,
  type SnapshotData,
  type SnapshotRow,
  summariseSoftSkills,
  toSkillSnapshot,
  toTimeline,
} from "../../lib/skill-snapshots.ts";

const data = (
  categories: Record<string, { average: number; count: number }>,
  overall: number,
): SnapshotData => ({
  soft_skills: { categories, overall_average: overall },
  evidence_count: 0,
  review_count: 0,
});

const row = (over: Partial<SnapshotRow> = {}): SnapshotRow => ({
  id: "s1",
  user_id: "u1",
  trigger_type: "manual",
  trigger_id: null,
  snapshot_data: data({ reliability: { average: 4, count: 2 } }, 4),
  summary: null,
  created_at: "2026-08-01T00:00:00Z",
  ...over,
});

Deno.test("summariseSoftSkills averages per category", () => {
  const result = summariseSoftSkills([
    { category: "reliability", rating: 4 },
    { category: "reliability", rating: 2 },
    { category: "technical", rating: 5 },
  ]);

  assertEquals(result.categories.reliability, { average: 3, count: 2 });
  assertEquals(result.categories.technical, { average: 5, count: 1 });
});

Deno.test("the overall average weights ratings, not categories", () => {
  // Mean of category means would be (3 + 5) / 2 = 4. The mean of the ratings is
  // 11/3 = 3.67 — a category with one rating must not weigh as much as one with
  // two.
  const result = summariseSoftSkills([
    { category: "reliability", rating: 4 },
    { category: "reliability", rating: 2 },
    { category: "technical", rating: 5 },
  ]);

  assertEquals(result.overall_average, 3.67);
});

Deno.test("summariseSoftSkills handles no ratings", () => {
  const result = summariseSoftSkills([]);
  assertEquals(result.overall_average, 0);
  assertEquals(result.categories, {});
});

Deno.test("toSkillSnapshot maps snake_case to the SDK's camelCase", () => {
  const snap = toSkillSnapshot(row({ trigger_id: "t1" }));
  assertEquals(snap.userId, "u1");
  assertEquals(snap.triggerType, "manual");
  assertEquals(snap.triggerId, "t1");
  assertEquals(snap.createdAt, "2026-08-01T00:00:00Z");
});

Deno.test("toSkillSnapshot survives a null snapshot_data", () => {
  const snap = toSkillSnapshot(row({ snapshot_data: null }));
  assertEquals(snap.snapshotData.soft_skills.overall_average, 0);
  assertEquals(snap.snapshotData.evidence_count, 0);
});

Deno.test("diffSnapshots reports movement per category and overall", () => {
  const diff = diffSnapshots(
    data({ reliability: { average: 3, count: 1 } }, 3),
    data({ reliability: { average: 4.5, count: 2 } }, 4.5),
  );

  assertEquals(diff.deltaOverall, 1.5);
  assertEquals(diff.deltaCategories.reliability, 1.5);
  assertEquals(diff.improvedCount, 1);
  assertEquals(diff.declinedCount, 0);
});

Deno.test("a category rated for the first time shows as improved", () => {
  // Present in B only. Reporting nothing here would hide that the worker
  // started rating a whole skill area.
  const diff = diffSnapshots(
    data({}, 0),
    data({ technical: { average: 4, count: 1 } }, 4),
  );

  assertEquals(diff.deltaCategories.technical, 4);
  assertEquals(diff.improvedCount, 1);
});

Deno.test("a category that disappeared counts as declined", () => {
  const diff = diffSnapshots(
    data({ technical: { average: 4, count: 1 } }, 4),
    data({}, 0),
  );

  assertEquals(diff.deltaCategories.technical, -4);
  assertEquals(diff.declinedCount, 1);
});

Deno.test("an unchanged category is stable, not improved", () => {
  const diff = diffSnapshots(
    data({ reliability: { average: 4, count: 1 } }, 4),
    data({ reliability: { average: 4, count: 3 } }, 4),
  );

  assertEquals(diff.deltaCategories.reliability, 0);
  assertEquals(diff.stableCount, 1);
  assertEquals(diff.improvedCount, 0);
});

Deno.test("toTimeline sorts oldest first", () => {
  const points = toTimeline([
    row({ id: "b", created_at: "2026-08-05T00:00:00Z" }),
    row({ id: "a", created_at: "2026-08-01T00:00:00Z" }),
    row({ id: "c", created_at: "2026-08-09T00:00:00Z" }),
  ]);

  assertEquals(points.map((p) => p.snapshotId), ["a", "b", "c"]);
});

Deno.test("toTimeline flattens categories to plain numbers", () => {
  const [point] = toTimeline([row()]);
  assertEquals(point.categories, { reliability: 4 });
  assertEquals(point.overallAverage, 4);
});

Deno.test("buildSummary is null for the very first snapshot", () => {
  // A delta of 0 would claim it did not change; it had nothing to change from.
  assertEquals(buildSummary(null, data({}, 3)), null);
});

Deno.test("buildSummary records the move against the previous snapshot", () => {
  const summary = buildSummary(
    data({ reliability: { average: 3, count: 1 } }, 3),
    data({ reliability: { average: 4, count: 1 } }, 4),
  );

  assertEquals(summary?.delta_overall, 1);
  assertEquals(summary?.previous_overall, 3);
  assertEquals(
    (summary?.delta_categories as Record<string, number>).reliability,
    1,
  );
});
