/**
 * EEO aggregation and four-fifths adverse-impact math.
 *
 * Acceptance point 3 of #535 asks for the adverse-impact math to be verified
 * against a fixture with known expected output. Every expectation below is
 * hand-computed and written out in the comment above it, so a failure says
 * which arithmetic changed rather than only that a number moved.
 */

import {
  assertAlmostEquals,
  assertEquals,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  adverseImpact,
  aggregateByJobGroup,
  analyseDimension,
  buildReport,
  countsTowardSelectionRate,
  type EeoRecord,
  ETHNICITIES,
  GENDERS,
  maxStageReached,
  MIN_CELL_SIZE,
  tallyDimension,
} from "../../lib/eeo-aggregation.ts";

let seq = 0;

function record(overrides: Partial<EeoRecord> = {}): EeoRecord {
  seq += 1;
  return {
    applicationId: `app-${seq}`,
    jobGroup: "professionals",
    ethnicity: "white",
    gender: "male",
    veteranStatus: "non_veteran",
    disabilityStatus: "no",
    currentStatus: "new",
    reachedStatuses: [],
    ...overrides,
  };
}

/** `n` applicants of one ethnicity, of whom `hired` were hired. */
function cohort(
  ethnicity: string,
  n: number,
  hired: number,
  extra: Partial<EeoRecord> = {},
): EeoRecord[] {
  return Array.from({ length: n }, (_, i) =>
    record({
      ethnicity,
      currentStatus: i < hired ? "hired" : "rejected",
      reachedStatuses: i < hired ? ["screen", "interview", "offer", "hired"] : [
        "screen",
      ],
      ...extra,
    }));
}

// ─────────────────────────────────────────────────────────────────────────
// Stage derivation
// ─────────────────────────────────────────────────────────────────────────

Deno.test("maxStageReached: a candidate rejected after interviewing still counts as interviewed", () => {
  // Current status is off the ladder. Reading it alone would report this
  // person as never interviewed, understating the interview rate of whichever
  // group they belong to.
  const rejected = record({
    currentStatus: "rejected",
    reachedStatuses: ["screen", "interview"],
  });
  assertEquals(maxStageReached(rejected), 2);
});

Deno.test("maxStageReached: a hired candidate counts as having reached every prior stage", () => {
  const hired = record({ currentStatus: "hired", reachedStatuses: [] });
  assertEquals(maxStageReached(hired), 4);

  const totals = tallyDimension([hired], ETHNICITIES, (r) => r.ethnicity);
  const white = totals.find((t) => t.category === "white")!;
  // 1 application, and it counts at interview, offer and hire — not just hire.
  assertEquals(
    [white.applications, white.interviewed, white.offers, white.hired],
    [1, 1, 1, 1],
  );
});

Deno.test("maxStageReached: inquired is a side conversation, not a further round", () => {
  const inquired = record({
    currentStatus: "inquired",
    reachedStatuses: ["screen", "inquired"],
  });
  // Same rank as screen: below interview.
  assertEquals(maxStageReached(inquired), 1);
});

// ─────────────────────────────────────────────────────────────────────────
// The four-fifths rule, on a hand-computed fixture
// ─────────────────────────────────────────────────────────────────────────

Deno.test("adverse impact: ratios and flags match the hand-computed fixture", () => {
  // white   10 applicants,  5 hired -> 0.50  <- highest, the reference
  // asian   10 applicants,  4 hired -> 0.40  -> 0.40/0.50 = 0.80  pass (not < 0.8)
  // black   10 applicants,  2 hired -> 0.20  -> 0.20/0.50 = 0.40  FLAG
  // hispanic 0 applicants           -> null  -> no ratio
  const records = [
    ...cohort("white", 10, 5),
    ...cohort("asian", 10, 4),
    ...cohort("black", 10, 2),
  ];

  const categories = analyseDimension(
    records,
    ETHNICITIES,
    (r) => r.ethnicity,
  );
  const by = (name: string) => categories.find((c) => c.category === name)!;

  assertAlmostEquals(by("white").selectionRate!, 0.5, 1e-9);
  assertAlmostEquals(by("asian").selectionRate!, 0.4, 1e-9);
  assertAlmostEquals(by("black").selectionRate!, 0.2, 1e-9);

  assertAlmostEquals(by("white").impactRatio!, 1.0, 1e-9);
  assertAlmostEquals(by("asian").impactRatio!, 0.8, 1e-9);
  assertAlmostEquals(by("black").impactRatio!, 0.4, 1e-9);

  // 0.8 exactly is not adverse impact — the rule flags below four-fifths.
  assertEquals(by("asian").impactRatio! < 0.8, false);
  assertEquals(by("black").impactRatio! < 0.8, true);

  // A category nobody applied to has no rate and no ratio; it is not zero.
  assertEquals(by("hispanic").applications, 0);
  assertEquals(by("hispanic").selectionRate, null);
  assertEquals(by("hispanic").impactRatio, null);
});

Deno.test("adverse impact: every declared category appears even with no applicants", () => {
  const categories = analyseDimension([], ETHNICITIES, (r) => r.ethnicity);
  assertEquals(categories.length, ETHNICITIES.length);
  assertEquals(
    categories.map((c) => c.category).sort(),
    [...ETHNICITIES].sort(),
  );
});

Deno.test("adverse impact: no hires anywhere yields null ratios, never NaN", () => {
  // The screen this replaces divided by the highest rate unconditionally. With
  // nobody hired that is 0/0 -> NaN, and `NaN < 0.8` is false, so it rendered
  // "NaN% ✓ Pass" on a document people file with the government.
  const records = [...cohort("white", 10, 0), ...cohort("black", 10, 0)];
  const categories = analyseDimension(records, ETHNICITIES, (r) => r.ethnicity);

  for (const totals of categories) {
    assertEquals(totals.impactRatio, null);
    assertEquals(Number.isNaN(totals.impactRatio as unknown as number), false);
  }
  assertAlmostEquals(
    categories.find((c) => c.category === "white")!.selectionRate!,
    0,
    1e-9,
  );
});

// ─────────────────────────────────────────────────────────────────────────
// Withdrawn is not a rejection (#533, acceptance point 4)
// ─────────────────────────────────────────────────────────────────────────

Deno.test("withdrawn applicants leave the denominator and are reported separately", () => {
  assertEquals(
    countsTowardSelectionRate(record({ currentStatus: "withdrawn" })),
    false,
  );
  assertEquals(
    countsTowardSelectionRate(record({ currentStatus: "rejected" })),
    true,
  );

  // black: 10 records, 5 of them withdrawn, 2 hired.
  //   counted applicants = 5, hired = 2 -> 0.40
  // white: 10 applicants, 5 hired       -> 0.50  (reference)
  //   ratio = 0.40 / 0.50 = 0.80 -> passes.
  //
  // Had the withdrawn five stayed in the denominator: 2/10 = 0.20,
  // ratio 0.40 -> a flag that never happened. That is the whole point.
  const withdrawn = Array.from(
    { length: 5 },
    () => record({ ethnicity: "black", currentStatus: "withdrawn" }),
  );
  const records = [
    ...cohort("white", 10, 5),
    ...cohort("black", 5, 2),
    ...withdrawn,
  ];

  const categories = analyseDimension(records, ETHNICITIES, (r) => r.ethnicity);
  const black = categories.find((c) => c.category === "black")!;

  assertEquals(black.applications, 5);
  assertEquals(black.withdrawn, 5);
  assertEquals(black.hired, 2);
  assertAlmostEquals(black.selectionRate!, 0.4, 1e-9);
  assertAlmostEquals(black.impactRatio!, 0.8, 1e-9);
  assertEquals(black.impactRatio! < 0.8, false);
});

// ─────────────────────────────────────────────────────────────────────────
// Small-cell suppression
// ─────────────────────────────────────────────────────────────────────────

Deno.test("small cells are suppressed rather than published", () => {
  // 3 applicants is below MIN_CELL_SIZE (5). Publishing "3 applicants,
  // 0 hired" against a protected class re-identifies those people.
  const records = [
    ...cohort("white", 10, 5),
    ...cohort("native_american", 3, 0),
  ];
  const categories = analyseDimension(records, ETHNICITIES, (r) => r.ethnicity);

  const small = categories.find((c) => c.category === "native_american")!;
  assertEquals(small.applications < MIN_CELL_SIZE, true);
  assertEquals(small.suppressed, true);
  assertEquals(small.impactRatio, null);

  // A category with nobody in it is empty, not suppressed — there is no one
  // to re-identify.
  assertEquals(
    categories.find((c) => c.category === "asian")!.suppressed,
    false,
  );
  assertEquals(
    categories.find((c) => c.category === "white")!.suppressed,
    false,
  );
});

Deno.test("a suppressed group still sets the reference rate", () => {
  // small:  3 applicants, 3 hired -> 1.00, suppressed
  // white: 10 applicants, 5 hired -> 0.50
  //
  // Reference is 1.00, so white is 0.50 -> FLAG.
  // If suppression removed the small group from the reference, white would be
  // measured against itself (1.00) and pass — letting a highly-selected group
  // hide behind its own size and flatter every other ratio.
  const records = [...cohort("white", 10, 5), ...cohort("two_or_more", 3, 3)];
  const categories = analyseDimension(records, ETHNICITIES, (r) => r.ethnicity);

  assertEquals(
    categories.find((c) => c.category === "two_or_more")!.suppressed,
    true,
  );
  assertAlmostEquals(
    categories.find((c) => c.category === "white")!.impactRatio!,
    0.5,
    1e-9,
  );
});

// ─────────────────────────────────────────────────────────────────────────
// Grouping and integrity
// ─────────────────────────────────────────────────────────────────────────

Deno.test("uncategorised jobs collect in their own group rather than disappearing", () => {
  const records = [
    ...cohort("white", 5, 2, { jobGroup: null }),
    ...cohort("white", 5, 3, { jobGroup: "technicians" }),
  ];
  const groups = aggregateByJobGroup(records);

  assertEquals(groups.map((g) => g.jobGroup), ["technicians", "uncategorized"]);
  // Nothing is lost: 10 applications in, 10 accounted for.
  assertEquals(groups.reduce((n, g) => n + g.totalApplications, 0), 10);
  assertEquals(groups.reduce((n, g) => n + g.totalHired, 0), 5);
});

Deno.test("a value outside the CHECK vocabulary gets its own bucket, not the bin", () => {
  // Reaching here means the constraint was bypassed. Dropping the row would
  // understate a denominator and quietly change every ratio.
  const records = [...cohort("white", 5, 1), ...cohort("martian", 2, 0)];
  const categories = analyseDimension(records, ETHNICITIES, (r) => r.ethnicity);

  const martian = categories.find((c) => c.category === "martian");
  assertEquals(martian?.applications, 2);
  assertEquals(categories.reduce((n, c) => n + c.applications, 0), 7);
});

Deno.test("buildReport totals reconcile across dimensions", () => {
  const records = [
    ...cohort("white", 10, 5, { gender: "male" }),
    ...cohort("black", 6, 1, { gender: "female" }),
    record({
      ethnicity: "asian",
      gender: "non_binary",
      currentStatus: "withdrawn",
    }),
  ];
  const report = buildReport(records);

  // 17 records, one withdrawn -> 16 in the denominator, 6 hired.
  assertEquals(report.totals.selfIdentified, 17);
  assertEquals(report.totals.applications, 16);
  assertEquals(report.totals.hired, 6);
  assertEquals(report.totals.withdrawn, 1);

  // The gender dimension must account for exactly the same people.
  const genderApplications = report.gender.reduce(
    (n, c) => n + c.applications,
    0,
  );
  const ethnicityApplications = report.jobGroups
    .flatMap((g) => g.categories)
    .reduce((n, c) => n + c.applications, 0);
  assertEquals(genderApplications, ethnicityApplications);

  assertEquals(report.gender.length, GENDERS.length);
  assertEquals(report.minCellSize, MIN_CELL_SIZE);
});

Deno.test("an empty organisation reports zeroes, not an error or a blank", () => {
  const report = buildReport([]);
  assertEquals(report.totals.selfIdentified, 0);
  assertEquals(report.totals.applications, 0);
  assertEquals(report.jobGroups, []);
  // The dimensions still enumerate their categories, so the report renders as
  // a real form with zeroes rather than an empty page.
  assertEquals(report.gender.length, GENDERS.length);
  for (const totals of report.gender) {
    assertEquals(totals.selectionRate, null);
    assertEquals(totals.impactRatio, null);
  }
});
