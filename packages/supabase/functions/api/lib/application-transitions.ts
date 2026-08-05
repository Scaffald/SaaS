/**
 * Which pipeline moves the server will accept.
 *
 * This table already existed — in the client, as
 * `useApplicationStatusChange.isValidTransition`. That made it advisory: it
 * shaped what the kanban offered, but anything calling the API directly could
 * move a candidate from `new` straight to `hired`, or back out of a terminal
 * state. Mirroring it here makes it a rule rather than a suggestion.
 *
 * Deliberately expressed in the DB vocabulary. The API surface renames two of
 * these (`new`→`pending`, `screen`→`reviewing`), and doing the check after
 * translation means one less place for the two namespaces to drift.
 */

import { DB_STATUSES, type DbStatus } from "../routes/applications.ts";

/**
 * Allowed next states, keyed by current state.
 *
 * `hired` and `rejected` are terminal. `withdrawn` is too, and is reachable
 * from any live stage — but only by the applicant, via the withdraw endpoint;
 * it is not an employer move, so it appears in no list here.
 */
export const ALLOWED_TRANSITIONS: Record<DbStatus, DbStatus[]> = {
  new: ["screen", "rejected"],
  screen: ["inquired", "interview", "rejected"],
  inquired: ["interview", "offer", "rejected"],
  interview: ["offer", "rejected"],
  offer: ["hired", "rejected"],
  hired: [],
  rejected: [],
  withdrawn: [],
};

/** Statuses no employer move can leave. */
export const TERMINAL_STATUSES: DbStatus[] = ["hired", "rejected", "withdrawn"];

export interface TransitionCheck {
  allowed: boolean;
  /** Present when refused; safe to return to the caller. */
  reason?: string;
}

/**
 * Whether an employer may move an application from `from` to `to`.
 *
 * A no-op move (`from === to`) is allowed: PATCH is not required to change the
 * status, and refusing would make an idempotent retry fail.
 */
export function checkTransition(from: string, to: string): TransitionCheck {
  if (from === to) return { allowed: true };

  if (!DB_STATUSES.includes(from as DbStatus)) {
    return {
      allowed: false,
      reason: `Application is in an unrecognised state: ${from}`,
    };
  }

  if (TERMINAL_STATUSES.includes(from as DbStatus)) {
    return {
      allowed: false,
      reason: `Cannot move an application out of ${from}`,
    };
  }

  const allowed = ALLOWED_TRANSITIONS[from as DbStatus] ?? [];

  if (!allowed.includes(to as DbStatus)) {
    return {
      allowed: false,
      reason: `Cannot move from ${from} to ${to}`,
    };
  }

  return { allowed: true };
}
