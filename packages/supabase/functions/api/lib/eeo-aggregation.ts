/**
 * EEO-1 style aggregation and four-fifths adverse-impact analysis.
 *
 * Pure functions, no database. The endpoint reads rows under service_role and
 * hands them here; everything that could be wrong about the *numbers* is
 * therefore testable against a fixture with known expected output (#535).
 *
 * ─── Why aggregation happens server-side, always ──────────────────────────
 *
 * `core.eeo_self_identification` holds protected-class data. Migration 305's
 * RLS policy is `auth.uid() = user_id` for both SELECT and INSERT — an
 * applicant may read and write their own row and nobody else's — and migration
 * 343 deliberately withheld UPDATE/DELETE from `authenticated` because a
 * voluntary self-identification is an audit record, not an editable field.
 *
 * Employers must never receive individual rows. They receive counts computed
 * here. That is the whole reason this file takes already-fetched rows rather
 * than exposing a query the client could shape.
 */

// ─────────────────────────────────────────────────────────────────────────
// Vocabulary — mirrors the CHECK constraints on core.eeo_self_identification
// ─────────────────────────────────────────────────────────────────────────

export const ETHNICITIES = [
  "hispanic",
  "white",
  "black",
  "asian",
  "native_american",
  "pacific_islander",
  "two_or_more",
  "declined",
] as const;

export const GENDERS = ["male", "female", "non_binary", "declined"] as const;

export const VETERAN_STATUSES = [
  "protected_veteran",
  "non_veteran",
  "declined",
] as const;

export const DISABILITY_STATUSES = ["yes", "no", "declined"] as const;

export type Ethnicity = typeof ETHNICITIES[number];

/**
 * Where each pipeline status sits on the ladder.
 *
 * `inquired` shares a rank with `screen`: it is a side conversation, not a
 * further round. `rejected` and `withdrawn` are deliberately absent — they are
 * outcomes, not rungs, and a candidate rejected at interview must still count
 * as having reached interview. That is what `reached_statuses` is for.
 */
export const STAGE_RANK: Record<string, number> = {
  new: 0,
  screen: 1,
  inquired: 1,
  interview: 2,
  offer: 3,
  hired: 4,
};

export const INTERVIEW_RANK = STAGE_RANK.interview;
export const OFFER_RANK = STAGE_RANK.offer;
export const HIRED_RANK = STAGE_RANK.hired;

/**
 * Cells smaller than this are reported as suppressed rather than as a count.
 *
 * An aggregate of one *is* an individual record. Publishing "1 Native American
 * applicant, 0 hired" to an employer re-identifies that person and their
 * protected-class data just as surely as handing over the row, which is the
 * exact thing migration 343 was written to prevent.
 *
 * Five is the common floor for published EEO tabulations. It is a starting
 * default, not a legal determination — see the note on the endpoint.
 */
export const MIN_CELL_SIZE = 5;

// ─────────────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────────────

/** One applicant's self-identification joined to their application's progress. */
export interface EeoRecord {
  applicationId: string;
  /** `jobs.eeo_job_category`, or null when the job was never categorised. */
  jobGroup: string | null;
  ethnicity: string;
  gender: string;
  veteranStatus: string;
  disabilityStatus: string;
  /** Current `core.applications.status`, in the DB vocabulary. */
  currentStatus: string;
  /** Every status this application has ever been moved to, from activity. */
  reachedStatuses: string[];
}

// ─────────────────────────────────────────────────────────────────────────
// Stage derivation
// ─────────────────────────────────────────────────────────────────────────

/**
 * Highest rung this application ever reached.
 *
 * Current status alone undercounts badly: someone now `hired` was also
 * interviewed and offered, and someone `rejected` after a final interview
 * reached interview even though their current status is off the ladder. So the
 * answer is the max over the current status and every recorded transition.
 */
export function maxStageReached(record: EeoRecord): number {
  let max = STAGE_RANK[record.currentStatus] ?? -1;
  for (const status of record.reachedStatuses) {
    const rank = STAGE_RANK[status];
    if (rank !== undefined && rank > max) max = rank;
  }
  return max;
}

/**
 * Whether this application belongs in a selection-rate denominator.
 *
 * Withdrawn candidates are excluded. The four-fifths rule measures the rate at
 * which an employer *selects* from those available to be selected; someone who
 * removed themselves was not passed over. Leaving them in depresses the
 * selection rate of whichever group they happen to fall in, which invents
 * adverse impact that did not occur (#533, and acceptance point 4 of #535).
 *
 * They are still counted and reported separately, so the number is visible
 * rather than silently dropped.
 */
export function countsTowardSelectionRate(record: EeoRecord): boolean {
  return record.currentStatus !== "withdrawn";
}

// ─────────────────────────────────────────────────────────────────────────
// Aggregation
// ─────────────────────────────────────────────────────────────────────────

export interface CategoryTotals {
  category: string;
  applications: number;
  interviewed: number;
  offers: number;
  hired: number;
  withdrawn: number;
  /** hired / applications, excluding withdrawn. Null when there is nobody. */
  selectionRate: number | null;
  /**
   * Four-fifths ratio against the most-selected group. Null when it cannot be
   * computed — see `adverseImpact`.
   */
  impactRatio: number | null;
  /** True when the cell is too small to report without re-identification. */
  suppressed: boolean;
}

export interface JobGroupTotals {
  jobGroup: string;
  totalApplications: number;
  totalHired: number;
  categories: CategoryTotals[];
}

function emptyTotals(category: string): CategoryTotals {
  return {
    category,
    applications: 0,
    interviewed: 0,
    offers: 0,
    hired: 0,
    withdrawn: 0,
    selectionRate: null,
    impactRatio: null,
    suppressed: false,
  };
}

/**
 * Tally one dimension (ethnicity, gender, veteran status, disability status)
 * across a set of records.
 *
 * `values` fixes the output order and guarantees every category appears, so a
 * group with no applicants renders as an explicit zero rather than vanishing.
 * A missing row is not the same as a zero, and on a compliance artifact the
 * difference matters.
 */
export function tallyDimension(
  records: EeoRecord[],
  values: readonly string[],
  pick: (record: EeoRecord) => string,
): CategoryTotals[] {
  const byCategory = new Map<string, CategoryTotals>();
  for (const value of values) byCategory.set(value, emptyTotals(value));

  for (const record of records) {
    const key = pick(record);
    const totals = byCategory.get(key);
    // An out-of-vocabulary value would mean the CHECK constraint was bypassed.
    // Dropping it silently would understate a denominator, so it gets its own
    // bucket and stays visible.
    if (!totals) {
      byCategory.set(key, emptyTotals(key));
    }
    const target = byCategory.get(key)!;

    if (!countsTowardSelectionRate(record)) {
      target.withdrawn += 1;
      continue;
    }

    target.applications += 1;
    const stage = maxStageReached(record);
    if (stage >= INTERVIEW_RANK) target.interviewed += 1;
    if (stage >= OFFER_RANK) target.offers += 1;
    if (stage >= HIRED_RANK) target.hired += 1;
  }

  const out = [...byCategory.values()];
  for (const totals of out) {
    totals.selectionRate = totals.applications > 0
      ? totals.hired / totals.applications
      : null;
  }
  return out;
}

/**
 * Apply the four-fifths rule across one dimension's categories, in place.
 *
 * Each group's selection rate is divided by the highest group's. Below 0.8 is
 * the conventional flag.
 *
 * Three cases produce `null` rather than a number, and the distinction is the
 * point — the previous hardcoded screen divided unconditionally, so an
 * organisation that had hired nobody rendered `NaN% ✓ Pass` on a document
 * people file:
 *
 *   - the group has no applicants, so it has no rate;
 *   - no group hired anyone, so the reference rate is 0 and the ratio is
 *     undefined for everyone;
 *   - the group is below `MIN_CELL_SIZE`, so publishing a ratio would expose
 *     an individual.
 *
 * Suppressed groups are still allowed to *set* the reference rate. Excluding
 * them would let a small, highly-selected group hide, flattering every ratio
 * computed against the remainder.
 */
export function adverseImpact(categories: CategoryTotals[]): void {
  let referenceRate = 0;
  for (const totals of categories) {
    if (totals.selectionRate !== null && totals.selectionRate > referenceRate) {
      referenceRate = totals.selectionRate;
    }
  }

  for (const totals of categories) {
    totals.suppressed = totals.applications > 0 &&
      totals.applications < MIN_CELL_SIZE;

    totals.impactRatio =
      referenceRate > 0 && totals.selectionRate !== null && !totals.suppressed
        ? totals.selectionRate / referenceRate
        : null;
  }
}

/** Convenience: tally a dimension and apply the four-fifths rule to it. */
export function analyseDimension(
  records: EeoRecord[],
  values: readonly string[],
  pick: (record: EeoRecord) => string,
): CategoryTotals[] {
  const categories = tallyDimension(records, values, pick);
  adverseImpact(categories);
  return categories;
}

/**
 * Group records by `jobs.eeo_job_category` and tally ethnicity within each.
 *
 * Jobs with no category collect under `uncategorized` rather than being
 * dropped. An EEO-1 report that quietly omits every uncategorised requisition
 * understates the workforce, and the fix is to categorise the jobs — which the
 * employer can only know to do if the bucket is visible.
 */
export function aggregateByJobGroup(records: EeoRecord[]): JobGroupTotals[] {
  const byGroup = new Map<string, EeoRecord[]>();
  for (const record of records) {
    const key = record.jobGroup ?? "uncategorized";
    const list = byGroup.get(key) ?? [];
    list.push(record);
    byGroup.set(key, list);
  }

  const groups: JobGroupTotals[] = [];
  for (const [jobGroup, groupRecords] of byGroup) {
    const categories = analyseDimension(
      groupRecords,
      ETHNICITIES,
      (record) => record.ethnicity,
    );
    groups.push({
      jobGroup,
      totalApplications: categories.reduce((n, c) => n + c.applications, 0),
      totalHired: categories.reduce((n, c) => n + c.hired, 0),
      categories,
    });
  }

  groups.sort((a, b) => a.jobGroup.localeCompare(b.jobGroup));
  return groups;
}

export interface EeoReport {
  jobGroups: JobGroupTotals[];
  gender: CategoryTotals[];
  veteranStatus: CategoryTotals[];
  disabilityStatus: CategoryTotals[];
  totals: {
    applications: number;
    hired: number;
    withdrawn: number;
    jobGroups: number;
    /** Applicants who self-identified. Not the same as total applicants. */
    selfIdentified: number;
  };
  minCellSize: number;
}

export function buildReport(records: EeoRecord[]): EeoReport {
  const jobGroups = aggregateByJobGroup(records);
  const gender = analyseDimension(records, GENDERS, (r) => r.gender);
  const veteranStatus = analyseDimension(
    records,
    VETERAN_STATUSES,
    (r) => r.veteranStatus,
  );
  const disabilityStatus = analyseDimension(
    records,
    DISABILITY_STATUSES,
    (r) => r.disabilityStatus,
  );

  return {
    jobGroups,
    gender,
    veteranStatus,
    disabilityStatus,
    totals: {
      applications: gender.reduce((n, c) => n + c.applications, 0),
      hired: gender.reduce((n, c) => n + c.hired, 0),
      withdrawn: gender.reduce((n, c) => n + c.withdrawn, 0),
      jobGroups: jobGroups.length,
      selfIdentified: records.length,
    },
    minCellSize: MIN_CELL_SIZE,
  };
}
