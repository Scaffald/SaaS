/**
 * What an account deletion keeps, in one place (#1313).
 *
 * PENDING LEGAL CONFIRMATION. Decided by Clay on 2026-10-18 as the working
 * line; every choice below is listed under "Needs legal sign-off" in the PR
 * that introduced it. To change a choice, change it here (buckets) or in the
 * SQL function named below (tables) — nothing else encodes it.
 *
 * Kept, detached from the person: the rows core.anonymize_worker_payment_data
 * (migration 095) clears the user id on. That function is the list; it is
 * mirrored in DETACHED_RECORDS only so the compliance log can say what was
 * kept without anyone reading SQL. Deleting these instead of detaching them
 * means changing that function, not a flag here.
 *
 * Deleted: everything else the user is linked to. auth.users cascades through
 * core.users to the profile, skills, applications, messages, notifications and
 * the rest (see _shared/user-deletion.ts); core.account_deletion_purge_unlinked
 * (390) removes what carries a user id with no foreign key (archived
 * notifications, inquiry read receipts, an audit email); and the processor
 * removes the user's files from every bucket below that is not retained.
 */

/**
 * Buckets whose objects are laid out under `{user id}/`, which is what every
 * one of their insert policies enforces (migrations 006, 013, 029, 031, 034,
 * 038, 050, 150, 317). organization-documents is keyed by organization and
 * cms-media by nobody, so neither is here.
 */
export const USER_KEYED_BUCKETS: ReadonlyArray<string> = [
  "avatars",
  "certifications",
  "portfolio",
  "resumes",
  "background-check-documents",
  "work-log-photos",
  "work-log-exports",
  "feedback-screenshots",
  "application-attachments",
  "community-media",
];

/**
 * User-keyed buckets whose files survive the deletion.
 *
 * background-check-documents: background-check report files, kept until legal
 * confirms the FCRA retention period. The core.background_checks rows that
 * point at them are kept and detached too (DETACHED_RECORDS).
 */
export const RETAINED_BUCKETS: ReadonlyArray<string> = [
  "background-check-documents",
];

/** The buckets the processor empties under the user's folder. */
export const PURGED_BUCKETS: ReadonlyArray<string> = USER_KEYED_BUCKETS.filter(
  (bucket) => !RETAINED_BUCKETS.includes(bucket),
);

/**
 * Rows kept with the user id cleared — the body of
 * core.anonymize_worker_payment_data, for the compliance log.
 */
export const DETACHED_RECORDS: ReadonlyArray<string> = [
  "core.payment_transactions.user_id",
  "core.success_fees.worker_user_id",
  "core.background_checks.user_id",
  "core.background_check_consent.worker_user_id",
  "core.background_check_disputes.user_id",
  "core.id_verifications.worker_user_id",
];

/** Snapshot written into each request's compliance log. */
export function retentionSnapshot() {
  return {
    detached_records: [...DETACHED_RECORDS],
    retained_buckets: [...RETAINED_BUCKETS],
    purged_buckets: [...PURGED_BUCKETS],
  };
}
