import {
  createServiceSupabaseClient,
  ensureChannelArray,
  enqueueDelivery,
  filterImmediateChannels,
  getDeviceTokens,
  getUserContacts,
  getUserPreferences,
  planRouting,
  insertNotification,
} from "./utils.ts";
import type {
  NotificationChannel,
  NotificationFrequency,
  NotificationSupabaseClient,
  NotificationType,
  NotificationSeverity,
  NotificationEventPayload,
} from "./types.ts";

export interface DigestProcessSummary {
  processed: number;
  notificationsCreated: number;
  deliveriesQueued: number;
  skipped: number;
}

function defaultDigestTitle(
  frequency: NotificationFrequency,
  count: number,
): string {
  const label = frequency === "digest_weekly" ? "Weekly" : "Daily";
  return `${label} digest · ${count} update${count === 1 ? "" : "s"}`;
}

export async function processDigestQueue(
  frequency: NotificationFrequency,
  opts?: { supabase?: NotificationSupabaseClient },
): Promise<DigestProcessSummary> {
  const supabase = opts?.supabase ?? createServiceSupabaseClient();
  const bucketPrefix = frequency === "digest_weekly" ? "weekly:" : "daily:";

  const { data, error } = await supabase
    .schema("core")
    .from("notification_digest_queue")
    .select("*")
    .like("bucket", `${bucketPrefix}%`)
    .is("processed_at", null)
    .gt("count", 0)
    .limit(200);

  if (error) {
    throw new Error(`Failed to load digest queue entries: ${error.message}`);
  }

  const entries = data ?? [];
  const summary: DigestProcessSummary = {
    processed: 0,
    notificationsCreated: 0,
    deliveriesQueued: 0,
    skipped: 0,
  };

  for (const entry of entries) {
    summary.processed += 1;

    const digestChannels = ensureChannelArray(
      Array.isArray(entry.channels) ? entry.channels as NotificationChannel[] : [],
    ).filter((channel) => channel !== "in_app");

    if (digestChannels.length === 0) {
      summary.skipped += 1;
      await supabase
        .schema("core")
        .from("notification_digest_queue")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", entry.id);
      continue;
    }

    const { resolved: preferences } = await getUserPreferences(
      supabase,
      entry.user_id,
    );

    const contacts = await getUserContacts(supabase, entry.user_id);
    const devices = await getDeviceTokens(supabase, entry.user_id);

    const permittedChannels = digestChannels.filter((channel) => {
      if (channel === "email") return Boolean(contacts.email) && (preferences.channelEnabled.email ?? true);
      if (channel === "sms") return Boolean(contacts.phone) && (preferences.channelEnabled.sms ?? false);
      if (channel === "push") return devices.length > 0 && (preferences.channelEnabled.push ?? true);
      return preferences.channelEnabled[channel] ?? true;
    });

    if (permittedChannels.length === 0) {
      summary.skipped += 1;
      await supabase
        .schema("core")
        .from("notification_digest_queue")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", entry.id);
      continue;
    }

    const title = defaultDigestTitle(frequency, entry.count ?? 0);
    const message = `${entry.count ?? 0} notification${(entry.count ?? 0) === 1 ? "" : "s"} were batched for you.`;

    const bodyPayload = {
      digest: {
        bucket: entry.bucket,
        count: entry.count,
        items: entry.examples ?? [],
      },
    };

    const metadataPayload = {
      digest_frequency: frequency,
    };

    const preview = entry.examples && Array.isArray(entry.examples) && entry.examples[0]?.title
      ? String(entry.examples[0].title)
      : message;

    const notification = await insertNotification(supabase, {
      user_id: entry.user_id,
      type: entry.type as NotificationType,
      severity: "info" as NotificationSeverity,
      title,
      message,
      preview,
      body: bodyPayload,
      metadata: metadataPayload,
      routed_channels: ensureChannelArray([
        ...permittedChannels,
        "in_app",
      ]),
    });

    if (!notification) {
      console.error("Failed to insert digest notification for user", entry.user_id);
      summary.skipped += 1;
      continue;
    }

    summary.notificationsCreated += 1;

    const digestEvent: NotificationEventPayload = {
      id: `${entry.bucket}:${entry.id}`,
      type: notification.type as NotificationType,
      severity: "info",
      title,
      message,
      preview,
      recipients: [entry.user_id],
      channels: [...permittedChannels, "in_app"],
      body: bodyPayload,
      metadata: metadataPayload,
    };

    const routes = planRouting(
      digestEvent,
      preferences,
      {
        in_app: true,
        email: Boolean(contacts.email),
        push: devices.length > 0,
        sms: Boolean(contacts.phone),
      },
      "UTC",
      new Date(),
    );

    const immediateChannels = filterImmediateChannels(routes).filter((channel) => permittedChannels.includes(channel));

    for (const channel of immediateChannels) {
      if (channel === "email" && contacts.email) {
        await enqueueDelivery(supabase, notification.id, "email", "sendgrid", {
          email: contacts.email,
          subject: title,
          templateData: bodyPayload,
        });
        summary.deliveriesQueued += 1;
      } else if (channel === "sms" && contacts.phone) {
        await enqueueDelivery(supabase, notification.id, "sms", "twilio", {
          phone: contacts.phone,
          body: message,
        });
        summary.deliveriesQueued += 1;
      } else if (channel === "push" && devices.length > 0) {
        for (const device of devices) {
          await enqueueDelivery(supabase, notification.id, "push", "expo", {
            token: device.token,
            platform: device.platform,
            data: bodyPayload,
            title,
            body: message,
          });
          summary.deliveriesQueued += 1;
        }
      }
    }

    const { error: queueUpdateError } = await supabase
      .schema("core")
      .from("notification_digest_queue")
      .update({
        processed_at: new Date().toISOString(),
        channels: permittedChannels,
      })
      .eq("id", entry.id);

    if (queueUpdateError) {
      console.error("Failed to mark digest entry processed", queueUpdateError);
    }
  }

  return summary;
}
