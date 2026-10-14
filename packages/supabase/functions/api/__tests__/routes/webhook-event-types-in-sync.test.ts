/**
 * `GET /v1/webhooks/event-types` serves `_shared/webhook-event-types.ts`, a
 * copy of `WebhookEventType` in `packages/scf-schemas`. The copy exists for
 * the reasons `schema-copies-in-sync.test.ts` gives; this test keeps the two
 * lists identical, so an event added to the package is also offered on the
 * Create Webhook screen (#1085).
 */

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  WEBHOOK_EVENT_TYPES,
  webhookEventTypeCatalog,
} from "../../../_shared/webhook-event-types.ts";
import { WebhookEventType } from "../../../../../scf-schemas/src/webhooks/types.ts";

Deno.test("webhook event types match the scf-schemas enum", () => {
  assertEquals(
    [...WEBHOOK_EVENT_TYPES],
    [...WebhookEventType.options],
    "functions/_shared/webhook-event-types.ts has drifted from " +
      "packages/scf-schemas/src/webhooks/types.ts. Mirror the change.",
  );
});

Deno.test("the catalog labels and categorises every event type", () => {
  const catalog = webhookEventTypeCatalog();
  assertEquals(catalog.length, WEBHOOK_EVENT_TYPES.length);
  assertEquals(catalog[0], {
    value: "job.created",
    label: "Job Created",
    category: "job",
  });
  assertEquals(
    catalog.find((e) => e.value === "organization.member_added"),
    {
      value: "organization.member_added",
      label: "Organization Member Added",
      category: "organization",
    },
  );
});
