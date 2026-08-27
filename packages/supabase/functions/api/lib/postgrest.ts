/**
 * Small helpers for shapes PostgREST hands back.
 */

/**
 * Unwrap an embedded to-one relation.
 *
 * PostgREST returns `project:project_id (name)` as an object on some versions
 * and a one-element array on others, and both shapes reach the handlers. Every
 * call site that reads a joined row needs this, so it lives here rather than
 * being redefined per route file — it was private to work-logs.ts, and the
 * organizations members route referenced it without importing anything, which
 * would have thrown at runtime.
 */
// deno-lint-ignore no-explicit-any
export function firstOf<T>(value: any): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
