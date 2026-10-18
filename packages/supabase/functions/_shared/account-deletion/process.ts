/**
 * Carry out account deletion requests whose grace period has passed (#1313).
 *
 * Until this existed a request was a 'pending' row that nothing read, while
 * the app promised completion within 30 days. Driven once a day by pg_cron
 * (migration 391) through the `account-deletion-process` function; kept here,
 * apart from the HTTP wrapper, so the gated test drives exactly this code
 * against the real database.
 *
 * Per request, in this order:
 *
 *   0. claim     core.claim_due_account_deletions — one row per call, FOR
 *                UPDATE SKIP LOCKED, so overlapping runs never share a row.
 *   1. blockers  read-only (_shared/user-deletion.ts). Anything blocking marks
 *                the request failed, names the tables, and writes nothing else.
 *   2. detach    core.anonymize_worker_payment_data — payment, fee, background
 *                check and ID-verification rows are kept, user id cleared.
 *   3. unlinked  core.account_deletion_purge_unlinked — rows with a user id
 *                and no foreign key.
 *   4. storage   the user's files in every purged bucket (policy.ts).
 *   5. release   nullable verification pointers.
 *   6. auth      delete the auth user; the cascade takes the rest.
 *   7. email     confirmation, to the address read before step 6.
 *
 * Every step records itself in compliance_log.steps when it finishes, and a
 * retry skips the steps already recorded — so a run that dies part-way is
 * resumed, not restarted. The log holds timestamps, counts and table names;
 * never an email, a name or a file path.
 *
 * Status: 'completed' when the auth user is gone; 'failed' when a run stopped
 * before any destructive step (the request can still be cancelled); 'partial'
 * when it stopped after one. Failed and partial requests are retried by a
 * later run (no sooner than 12 hours, so daily), up to MAX_ATTEMPTS, and
 * listed at GET /v1/office/account-deletions.
 *
 * Organization requests are not claimed (see migration 390): they wait in the
 * office list for manual handling.
 */

import { wrapInBrandedTemplate } from "../email-template.ts";
import { emailAdapter } from "../notifications/adapters/email.ts";
import {
  deleteAuthUser,
  findDeletionBlockers,
  isUserNotFound,
  releaseNullableReferences,
  type UserRelation,
} from "../user-deletion.ts";
import { PURGED_BUCKETS, retentionSnapshot } from "./policy.ts";

// deno-lint-ignore no-explicit-any
// biome-ignore lint/suspicious/noExplicitAny: untyped Deno Supabase client (#477)
type SupabaseLike = any;

/** Retries stop here; the office list shows what is left. */
export const MAX_ATTEMPTS = 5;

/** A cron slot gets 55s (migration 391's timeout). Leave room to answer. */
export const TIME_BUDGET_MS = 45_000;

export const DEFAULT_LIMIT = 25;

/** The steps, in the order they run. */
export const STEPS = [
  "payment_data_detached",
  "unlinked_rows_purged",
  "storage_removed",
  "references_released",
  "auth_user_deleted",
] as const;
type Step = typeof STEPS[number];

/**
 * Blocks the processor but not the office route: deleting an organization's
 * owner leaves an organization nobody can administer. An operator may do that
 * on purpose; a self-service request should not.
 */
const PROCESSOR_ONLY_BLOCKERS: ReadonlyArray<UserRelation> = [
  { table: "organizations", column: "owner_user_id" },
];

export type SendEmail = (message: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) => Promise<{ sent: boolean; error?: string }>;

export interface ProcessOptions {
  limit?: number;
  timeBudgetMs?: number;
  /** Only these requests (an operator re-run, or the gated test). */
  ids?: string[];
  /** Defaults to the Resend adapter. Tests pass their own. */
  sendEmail?: SendEmail;
}

export interface ProcessSummary {
  claimed: number;
  completed: number;
  partial: number;
  failed: number;
  truncated: boolean;
  results: Array<{ id: string; status: string; error?: string }>;
}

interface DeletionRow {
  id: string;
  deleted_user_id: string | null;
  deletion_type: string;
  requested_at: string;
  status: string;
  attempts: number;
  payment_data_anonymized: boolean;
  compliance_log: Record<string, unknown> | null;
}

interface ComplianceLog {
  version: 1;
  retention: ReturnType<typeof retentionSnapshot>;
  steps: Partial<Record<Step | "confirmation_email", Record<string, unknown>>>;
  blocked_by?: Array<{ table: string; count: number }>;
  last_error?: { step: string; at: string; message: string };
}

function readLog(row: DeletionRow): ComplianceLog {
  const raw = (row.compliance_log ?? {}) as Partial<ComplianceLog>;
  return {
    version: 1,
    retention: retentionSnapshot(),
    steps: { ...(raw.steps ?? {}) },
    ...(raw.blocked_by ? { blocked_by: raw.blocked_by } : {}),
    ...(raw.last_error ? { last_error: raw.last_error } : {}),
  };
}

export async function processDueDeletions(
  supabase: SupabaseLike,
  options: ProcessOptions = {},
): Promise<ProcessSummary> {
  const limit = options.limit ?? DEFAULT_LIMIT;
  const budget = options.timeBudgetMs ?? TIME_BUDGET_MS;
  const sendEmail = options.sendEmail ?? sendWithResend;
  const startedAt = Date.now();
  const seen = new Set<string>();

  const summary: ProcessSummary = {
    claimed: 0,
    completed: 0,
    partial: 0,
    failed: 0,
    truncated: false,
    results: [],
  };

  while (summary.claimed < limit) {
    if (Date.now() - startedAt > budget) {
      summary.truncated = true;
      break;
    }

    // One at a time, so a run that hits its budget has claimed nothing it
    // will not process.
    const { data, error } = await supabase
      .schema("core")
      .rpc("claim_due_account_deletions", {
        p_limit: 1,
        p_max_attempts: MAX_ATTEMPTS,
        p_ids: options.ids ?? null,
      });
    if (error) {
      throw new Error(`Failed to claim deletion requests: ${error.message}`);
    }
    const row = (data as DeletionRow[] | null)?.[0];
    if (!row) break;
    // The claim's retry delay (390) already keeps a row this run failed from
    // coming straight back; this makes that true even if the delay is changed.
    if (seen.has(row.id)) break;
    seen.add(row.id);

    summary.claimed += 1;
    const result = await processOne(supabase, row, sendEmail);
    summary.results.push({ id: row.id, ...result });
    if (result.status === "completed") summary.completed += 1;
    else if (result.status === "partial") summary.partial += 1;
    else summary.failed += 1;
  }

  return summary;
}

async function processOne(
  supabase: SupabaseLike,
  row: DeletionRow,
  sendEmail: SendEmail,
): Promise<{ status: string; error?: string }> {
  const log = readLog(row);
  const now = () => new Date().toISOString();
  const done = (step: Step) => Boolean(log.steps[step]);
  const anyDestructiveDone = () => STEPS.some(done);

  const save = async (fields: Record<string, unknown>) => {
    const { error } = await supabase
      .schema("core")
      .from("account_deletions")
      .update({ compliance_log: log, ...fields })
      .eq("id", row.id);
    if (error) {
      throw new Error(`Failed to record progress: ${error.message}`);
    }
  };

  const fail = async (step: string, message: string) => {
    log.last_error = { step, at: now(), message };
    const status = anyDestructiveDone() ? "partial" : "failed";
    console.error("[account-deletion-process] stopped", {
      id: row.id,
      step,
      status,
      attempts: row.attempts,
      message,
    });
    await save({ status, error_message: `${step}: ${message}` });
    return { status, error: `${step}: ${message}` };
  };

  const finish = async () => {
    delete log.last_error;
    await save({
      status: "completed",
      completed_at: now(),
      error_message: null,
    });
    console.info("[account-deletion-process] completed", { id: row.id });
    return { status: "completed" };
  };

  try {
    const userId = row.deleted_user_id;

    // deleted_user_id is ON DELETE SET NULL: on a worker request, null means
    // the auth user is already gone — a run that deleted it and died before
    // recording so. Nothing is left that this path could act on.
    if (!userId) {
      if (!done("auth_user_deleted")) {
        log.steps.auth_user_deleted = { at: now(), note: "already absent" };
      }
      return await finish();
    }

    // Read the address now: after step 6 there is nowhere to read it from.
    // Held in memory only.
    const { data: authData, error: authError } = await supabase.auth.admin
      .getUserById(userId);
    if (authError && !isUserNotFound(authError)) {
      return await fail("load_user", authError.message ?? String(authError));
    }
    const email = (authData?.user?.email as string | undefined) ?? null;

    // 1. Blockers, before anything is written. A request already part-way
    // through is still checked: the auth delete would fail on them anyway.
    if (!done("auth_user_deleted")) {
      const check = await findDeletionBlockers(
        supabase,
        userId,
        PROCESSOR_ONLY_BLOCKERS,
      );
      if (check.ok === false) return await fail("blockers", check.message);
      if (check.blocked.length > 0) {
        log.blocked_by = check.blocked;
        return await fail(
          "blockers",
          `owns content that must be reassigned first: ${
            check.blocked.map((b) => `core.${b.table} (${b.count})`).join(", ")
          }`,
        );
      }
      delete log.blocked_by;
    }

    // 2. Detach what is kept.
    if (!done("payment_data_detached")) {
      const { error } = await supabase
        .schema("core")
        .rpc("anonymize_worker_payment_data", { p_worker_user_id: userId });
      if (error) return await fail("payment_data_detached", error.message);
      const at = now();
      log.steps.payment_data_detached = { at };
      await save({
        payment_data_anonymized: true,
        payment_data_anonymized_at: at,
      });
    }

    // 3. Rows with no foreign key.
    if (!done("unlinked_rows_purged")) {
      const { data, error } = await supabase
        .schema("core")
        .rpc("account_deletion_purge_unlinked", { p_user_id: userId });
      if (error) return await fail("unlinked_rows_purged", error.message);
      log.steps.unlinked_rows_purged = { at: now(), ...(data ?? {}) };
      await save({});
    }

    // 4. Files.
    if (!done("storage_removed")) {
      const removed = await removeUserFiles(supabase, userId);
      if (removed.ok === false) {
        return await fail("storage_removed", removed.message);
      }
      log.steps.storage_removed = { at: now(), objects: removed.counts };
      await save({});
    }

    // 5. Verification pointers.
    if (!done("references_released")) {
      const released = await releaseNullableReferences(supabase, userId);
      if (released.ok === false) {
        return await fail("references_released", released.message);
      }
      log.steps.references_released = { at: now() };
      await save({});
    }

    // 6. The account. The cascade removes the profile, skills, applications,
    // messages, notifications and the rest; FKs clear this row's user ids.
    if (!done("auth_user_deleted")) {
      const deleted = await deleteAuthUser(supabase, userId);
      if (deleted.ok === false) {
        return await fail("auth_user_deleted", deleted.message);
      }
      log.steps.auth_user_deleted = {
        at: now(),
        ...(deleted.alreadyGone ? { note: "already absent" } : {}),
      };
      await save({});
    }

    // 7. Confirmation. A failure here does not undo or hold up the deletion,
    // which has happened; it is recorded, and not retried — the address
    // existed only in this run's memory.
    if (!log.steps.confirmation_email) {
      if (!email) {
        log.steps.confirmation_email = {
          at: now(),
          sent: false,
          reason: "no email",
        };
      } else {
        const sent = await sendConfirmation(sendEmail, email, row.requested_at);
        log.steps.confirmation_email = {
          at: now(),
          sent: sent.sent,
          ...(sent.error ? { reason: sent.error } : {}),
        };
      }
    }

    return await finish();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    try {
      return await fail("unexpected", message);
    } catch {
      // Could not even record the failure. The row stays 'in_progress' and is
      // reclaimed after the stale window (migration 390).
      return { status: "failed", error: message };
    }
  }
}

/** Remove every object the user owns in the purged buckets. */
async function removeUserFiles(
  supabase: SupabaseLike,
  userId: string,
): Promise<
  { ok: true; counts: Record<string, number> } | { ok: false; message: string }
> {
  const list = async () =>
    await supabase.schema("core").rpc("account_deletion_storage_objects", {
      p_user_id: userId,
      p_buckets: PURGED_BUCKETS,
    });

  const { data, error } = await list();
  if (error) return { ok: false, message: `list: ${error.message}` };

  const byBucket = new Map<string, string[]>();
  for (
    const obj of (data ?? []) as Array<{ bucket_id: string; name: string }>
  ) {
    const names = byBucket.get(obj.bucket_id) ?? [];
    names.push(obj.name);
    byBucket.set(obj.bucket_id, names);
  }

  const counts: Record<string, number> = {};
  for (const [bucket, names] of byBucket) {
    for (let i = 0; i < names.length; i += 100) {
      const { error: removeError } = await supabase.storage
        .from(bucket)
        .remove(names.slice(i, i + 100));
      if (removeError) {
        return { ok: false, message: `${bucket}: ${removeError.message}` };
      }
    }
    counts[bucket] = names.length;
  }

  // The Storage API answers a remove of a missing object with success and an
  // empty list, so success is not proof. Look again.
  const { data: after, error: afterError } = await list();
  if (afterError) {
    return { ok: false, message: `verify: ${afterError.message}` };
  }
  const left = (after ?? []).length;
  if (left > 0) {
    return {
      ok: false,
      message: `${left} object(s) still present after removal`,
    };
  }

  return { ok: true, counts };
}

async function sendConfirmation(
  sendEmail: SendEmail,
  to: string,
  requestedAt: string,
): Promise<{ sent: boolean; error?: string }> {
  const requested = new Date(requestedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  const subject = "Your Scaffald account has been deleted";
  const paragraphs = [
    `As you asked on ${requested}, we have deleted your Scaffald account, your profile, your applications and messages, and the files you uploaded.`,
    "Payment and background-check records we are required to keep have been detached from your account.",
    "If you did not ask for this, reply to this email.",
  ];
  const html = wrapInBrandedTemplate({
    title: "Scaffald",
    subtitle: subject,
    body: paragraphs.map((p) => `<p style="margin:0 0 16px;">${p}</p>`).join(
      "",
    ),
    // The default footer points at notification settings in an account that
    // no longer exists.
    footerHtml:
      '<p style="margin:0;">A one-time message about your deletion request. You will not receive further email from Scaffald.</p>',
  });
  try {
    return await sendEmail({
      to,
      subject,
      html,
      text: paragraphs.join("\n\n"),
    });
  } catch (error) {
    return {
      sent: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** The production sender: the notification pipeline's Resend adapter. */
const sendWithResend: SendEmail = async ({ to, subject, html, text }) => {
  const result = await emailAdapter.send({
    // The adapter reads only these fields of a delivery and a notification.
    supabase: null as never,
    delivery: { metadata: { email: to, subject, html, text } } as never,
    notification: { title: subject, message: text, type: "system" } as never,
  });
  return result.status === "sent"
    ? { sent: true }
    : { sent: false, error: result.error ?? result.status };
};
