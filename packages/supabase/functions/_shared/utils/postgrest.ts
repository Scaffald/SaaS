/**
 * Helpers for building PostgREST filter strings from untrusted input.
 *
 * `.eq()`, `.ilike()` and friends send their value as a separate parameter, so
 * interpolating user input into those is safe. `.or()` is different: its whole
 * argument is PostgREST *filter grammar*, parsed server-side. Inside it, `,`
 * separates conditions and `()` groups them, so a search term containing those
 * characters does not stay a search term — it becomes additional filter logic.
 *
 * RLS still bounds which rows can match, so this is filter-logic manipulation
 * within the caller's own visible set rather than cross-tenant access. Issue
 * #429.
 */

/**
 * Quote a value for use inside a PostgREST filter condition.
 *
 * PostgREST treats a double-quoted value as a literal, which neutralises `,`
 * and `()`. Backslash and double-quote are the only characters that still need
 * escaping once quoted.
 *
 * Note `*` is PostgREST's wildcard alias for `%` in like/ilike patterns and
 * stays a wildcard even when quoted. That is deliberate: a wildcard only
 * broadens matching within rows the caller may already read, so it is a search
 * feature rather than an escalation.
 */
export function quotePostgrestValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`
}

/**
 * Build an `.or()` argument matching a search term against several columns
 * with `ilike`, safely.
 *
 *   query.or(orIlike(["title", "description"], userInput))
 *
 * Prefer this over hand-writing the string; the whole point is that the
 * template-literal form is the bug.
 */
export function orIlike(columns: string[], term: string): string {
  const pattern = quotePostgrestValue(`%${term}%`)
  return columns.map((column) => `${column}.ilike.${pattern}`).join(",")
}
