/**
 * The rules a job's pay must meet (#1411, #1412).
 *
 * - Min above Max went live as "$90,000 – $50,000": nothing checked the
 *   order, on the client, here or in the database.
 * - An amount without a pay type was invisible to workers, whose formatter
 *   needed all three, so a type is required as soon as either amount is set.
 *
 * Migration 399 holds the same two rules as CHECK constraints; this answers
 * first with a message a person can act on. The job form
 * (scf-core features/office/job-pay.ts) says the same words.
 */

export interface JobPay {
  pay_range_min_cents?: number | null;
  pay_range_max_cents?: number | null;
  pay_range_type?: string | null;
}

export interface JobPayProblem {
  field: "pay_range_max_cents" | "pay_range_type";
  message: string;
}

const isAmount = (cents: number | null | undefined): cents is number =>
  typeof cents === "number";

export function jobPayProblem(pay: JobPay): JobPayProblem | null {
  const min = pay.pay_range_min_cents;
  const max = pay.pay_range_max_cents;
  if (isAmount(min) && isAmount(max) && min > max) {
    return {
      field: "pay_range_max_cents",
      message: "Max pay must be at least Min pay.",
    };
  }
  if ((isAmount(min) || isAmount(max)) && !pay.pay_range_type) {
    return {
      field: "pay_range_type",
      message: "Choose a pay type (hourly, salary, contract or project).",
    };
  }
  return null;
}

/**
 * What a PATCH would leave on the row: each field the body sends (null
 * clears it) over the stored one. Checking the body alone would let
 * `{ pay_range_min_cents: 9000000 }` past a stored max of 5000000.
 */
export function mergedJobPay(existing: JobPay, patch: JobPay): JobPay {
  const pick = <K extends keyof JobPay>(key: K) =>
    patch[key] !== undefined ? patch[key] : existing[key];
  return {
    pay_range_min_cents: pick("pay_range_min_cents"),
    pay_range_max_cents: pick("pay_range_max_cents"),
    pay_range_type: pick("pay_range_type"),
  };
}
