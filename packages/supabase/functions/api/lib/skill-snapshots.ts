/**
 * Snapshot arithmetic for /v1/skills/snapshots.
 *
 * A snapshot freezes a worker's soft-skill averages at a moment in time, so the
 * analytics widgets can show movement rather than only a current score. The
 * shaping and diffing live here, away from the handlers, because they are the
 * only part with real logic worth testing directly — the handlers around them
 * are queries.
 *
 * Field names cross a boundary here: core.skill_snapshots is snake_case, the
 * SDK's SkillSnapshot is camelCase. Converting in one place keeps handlers from
 * each inventing their own half of the mapping.
 */

export interface SnapshotCategoryData {
  average: number;
  count: number;
}

export interface SnapshotData {
  soft_skills: {
    categories: Record<string, SnapshotCategoryData>;
    overall_average: number;
  };
  evidence_count: number;
  review_count: number;
}

export interface SnapshotRow {
  id: string;
  user_id: string;
  trigger_type: string;
  trigger_id: string | null;
  snapshot_data: SnapshotData | null;
  summary: Record<string, unknown> | null;
  created_at: string;
}

export interface SkillSnapshot {
  id: string;
  userId: string;
  triggerType: string;
  triggerId: string | null;
  snapshotData: SnapshotData;
  summary: Record<string, unknown> | null;
  createdAt: string;
}

const EMPTY_DATA: SnapshotData = {
  soft_skills: { categories: {}, overall_average: 0 },
  evidence_count: 0,
  review_count: 0,
};

/** Row -> the SDK's camelCase shape, tolerating a null snapshot_data. */
export function toSkillSnapshot(row: SnapshotRow): SkillSnapshot {
  return {
    id: row.id,
    userId: row.user_id,
    triggerType: row.trigger_type,
    triggerId: row.trigger_id,
    snapshotData: row.snapshot_data ?? EMPTY_DATA,
    summary: row.summary,
    createdAt: row.created_at,
  };
}

export interface SoftSkillRating {
  category: string;
  rating: number;
}

/**
 * Average the caller's soft-skill self-ratings, per category and overall.
 *
 * The overall figure is the mean of every rating, not the mean of the category
 * means — a category with one rating should not weigh as heavily as one with
 * ten.
 */
export function summariseSoftSkills(
  ratings: ReadonlyArray<SoftSkillRating>,
): SnapshotData["soft_skills"] {
  const categories: Record<string, SnapshotCategoryData> = {};
  let total = 0;

  for (const r of ratings) {
    const cur = categories[r.category] ?? { average: 0, count: 0 };
    // Hold the running sum in `average`, divide once at the end.
    cur.average += r.rating;
    cur.count += 1;
    categories[r.category] = cur;
    total += r.rating;
  }

  for (const key of Object.keys(categories)) {
    const c = categories[key];
    categories[key] = { average: round2(c.average / c.count), count: c.count };
  }

  return {
    categories,
    overall_average: ratings.length ? round2(total / ratings.length) : 0,
  };
}

export interface SnapshotDiff {
  deltaOverall: number;
  deltaCategories: Record<string, number>;
  improvedCount: number;
  declinedCount: number;
  stableCount: number;
}

/**
 * Difference between two snapshots, B relative to A.
 *
 * Categories present in only one snapshot still appear: a skill area the worker
 * started rating is a change worth showing, and treating the missing side as 0
 * would report a jump from nothing rather than an appearance. The absent side
 * contributes its own value as the delta, which is what "new since A" means
 * numerically.
 */
export function diffSnapshots(a: SnapshotData, b: SnapshotData): SnapshotDiff {
  const aCats = a.soft_skills?.categories ?? {};
  const bCats = b.soft_skills?.categories ?? {};
  const keys = new Set([...Object.keys(aCats), ...Object.keys(bCats)]);

  const deltaCategories: Record<string, number> = {};
  let improvedCount = 0;
  let declinedCount = 0;
  let stableCount = 0;

  for (const key of keys) {
    const before = aCats[key]?.average ?? 0;
    const after = bCats[key]?.average ?? 0;
    const delta = round2(after - before);
    deltaCategories[key] = delta;
    if (delta > 0) improvedCount += 1;
    else if (delta < 0) declinedCount += 1;
    else stableCount += 1;
  }

  return {
    deltaOverall: round2(
      (b.soft_skills?.overall_average ?? 0) -
        (a.soft_skills?.overall_average ?? 0),
    ),
    deltaCategories,
    improvedCount,
    declinedCount,
    stableCount,
  };
}

export interface TimelinePoint {
  date: string;
  overallAverage: number;
  categories: Record<string, number>;
  snapshotId: string;
}

/** Snapshots -> chart points, oldest first so a line chart reads left to right. */
export function toTimeline(rows: ReadonlyArray<SnapshotRow>): TimelinePoint[] {
  return rows
    .map((row) => {
      const data = row.snapshot_data ?? EMPTY_DATA;
      const categories: Record<string, number> = {};
      for (
        const [key, value] of Object.entries(data.soft_skills?.categories ?? {})
      ) {
        categories[key] = value.average;
      }
      return {
        date: row.created_at,
        overallAverage: data.soft_skills?.overall_average ?? 0,
        categories,
        snapshotId: row.id,
      };
    })
    .sort((x, y) => x.date.localeCompare(y.date));
}

/**
 * Summary stamped onto a new snapshot: how it moved against the previous one.
 * Null when there is no previous snapshot — the first one has nothing to move
 * against, and reporting a delta of 0 would imply it did not change.
 */
export function buildSummary(
  previous: SnapshotData | null,
  current: SnapshotData,
): Record<string, unknown> | null {
  if (!previous) return null;
  const diff = diffSnapshots(previous, current);
  return {
    delta_overall: diff.deltaOverall,
    previous_overall: previous.soft_skills?.overall_average ?? 0,
    delta_categories: diff.deltaCategories,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
