/** Pay rules for the office job routes (#1411, #1412). */
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { jobPayProblem, mergedJobPay } from "../../lib/job-pay.ts";

Deno.test("job pay - Min above Max is refused", () => {
  assertEquals(
    jobPayProblem({
      pay_range_min_cents: 9_000_000,
      pay_range_max_cents: 5_000_000,
      pay_range_type: "salary",
    })?.field,
    "pay_range_max_cents",
  );
});

Deno.test("job pay - an amount needs a type, one end is enough", () => {
  assertEquals(
    jobPayProblem({ pay_range_min_cents: 4_000 })?.field,
    "pay_range_type",
  );
  assertEquals(
    jobPayProblem({ pay_range_max_cents: 4_000, pay_range_type: null })?.field,
    "pay_range_type",
  );
});

Deno.test("job pay - valid shapes pass", () => {
  assertEquals(jobPayProblem({}), null);
  assertEquals(jobPayProblem({ pay_range_type: "hourly" }), null);
  assertEquals(
    jobPayProblem({ pay_range_min_cents: 4_000, pay_range_type: "hourly" }),
    null,
  );
  assertEquals(
    jobPayProblem({
      pay_range_min_cents: 4_000,
      pay_range_max_cents: 4_000,
      pay_range_type: "hourly",
    }),
    null,
  );
});

Deno.test("job pay - a PATCH is judged against the row it leaves", () => {
  const stored = {
    pay_range_min_cents: 4_000,
    pay_range_max_cents: 5_000,
    pay_range_type: "hourly",
  };
  assertEquals(
    jobPayProblem(mergedJobPay(stored, { pay_range_min_cents: 9_000 }))?.field,
    "pay_range_max_cents",
  );
  assertEquals(
    jobPayProblem(mergedJobPay(stored, { pay_range_type: null }))?.field,
    "pay_range_type",
  );
  // Clearing everything is fine.
  assertEquals(
    jobPayProblem(
      mergedJobPay(stored, {
        pay_range_min_cents: null,
        pay_range_max_cents: null,
        pay_range_type: null,
      }),
    ),
    null,
  );
});
