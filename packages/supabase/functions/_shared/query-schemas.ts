/**
 * Shared zod schemas for query-string parameters.
 *
 * A query string carries only strings, which is the whole problem with
 * `z.coerce.boolean()`: it is `Boolean(value)`, and `Boolean("false")` is
 * `true`. Any route validating a boolean query param with it reads *every*
 * value as `true`, including the one the client sent to turn the flag off.
 *
 * That is not theoretical. `office-jobs.ts` used it for `myTeamsOnly`, and
 * because the client always sends the param (`useState(false)` in
 * `office-jobs-list.tsx`), the office Jobs screen filtered every job out and
 * rendered "No jobs found" against a database holding thirteen of them. The
 * failure is silent: no error, no warning, just an empty list.
 */

import { z } from "zod";

/**
 * A boolean carried in a query string.
 *
 * Accepts the two spellings a client can reasonably send — `true`/`false` and
 * `1`/`0`, case-insensitively — and rejects anything else rather than
 * guessing. An absent param is `undefined`, which is distinct from `false`:
 * routes that treat "not asked" differently from "asked for off" keep that
 * distinction.
 *
 * Use `.default(false)` at the call site when the route wants absent to mean
 * off, so the choice is visible in the schema rather than implied.
 *
 * ```ts
 * const querySchema = z.object({
 *   myTeamsOnly: booleanQueryParam.optional(),
 *   includeArchived: booleanQueryParam.default(false),
 * });
 * ```
 *
 * Written as a `preprocess` rather than an enum + transform so the schema
 * still accepts a real boolean — which is what `.default(false)` supplies,
 * and what a non-query caller would pass.
 */
export const booleanQueryParam = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  // Anything else falls through unchanged so `z.boolean()` rejects it with a
  // real validation error, rather than being silently read as `true`.
  return value;
}, z.boolean());
