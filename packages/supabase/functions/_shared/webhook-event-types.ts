/**
 * The webhook events a subscriber can pick, served by
 * `GET /v1/webhooks/event-types`.
 *
 * A hand-maintained copy of `WebhookEventType` in
 * `packages/scf-schemas/src/webhooks/types.ts`: the api function cannot import
 * the package (see `schema-copies-in-sync.test.ts` for why), and
 * `webhook-event-types-in-sync.test.ts` fails if the two lists drift.
 *
 * Plain strings rather than a zod enum so the route can serve them without
 * caring which zod instance built them.
 */

export const WEBHOOK_EVENT_TYPES = [
  // Job events
  "job.created",
  "job.updated",
  "job.published",
  "job.closed",
  "job.deleted",

  // Application events
  "application.created",
  "application.submitted",
  "application.updated",
  "application.withdrawn",
  "application.accepted",
  "application.rejected",

  // User events
  "user.created",
  "user.updated",
  "user.deleted",

  // Organization events
  "organization.created",
  "organization.updated",
  "organization.member_added",
  "organization.member_removed",

  // Background check events
  "background_check.initiated",
  "background_check.completed",
  "background_check.failed",

  // Work log events
  "work_log.created",
  "work_log.approved",
  "work_log.rejected",

  // Inquiry events
  "inquiry.created",
  "inquiry.responded",
  "inquiry.closed",
] as const;

export interface WebhookEventTypeInfo {
  /** The event type, e.g. `job.created` */
  value: string;
  /** Human-readable label, e.g. `Job Created` */
  label: string;
  /** The part before the dot, e.g. `job` */
  category: string;
}

const titleCase = (s: string) =>
  s.split(/[._]/).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

/** The catalog in the shape `@scaffald/sdk`'s `WebhookEventTypeInfo` expects. */
export function webhookEventTypeCatalog(): WebhookEventTypeInfo[] {
  return WEBHOOK_EVENT_TYPES.map((value) => ({
    value,
    label: titleCase(value),
    category: value.split(".")[0],
  }));
}
