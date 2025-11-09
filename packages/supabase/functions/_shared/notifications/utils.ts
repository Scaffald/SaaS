import { createClient } from "@supabase/supabase-js";

import type { Database } from "../database.types.ts";
import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_DELIVERY_STATUSES,
  NOTIFICATION_EVENT_KINDS,
  NOTIFICATION_FREQUENCIES,
  NOTIFICATION_SEVERITIES,
  NotificationChannel,
  NotificationDeliveryStatus,
  NotificationDeliveryRow,
  NotificationEventKind,
  NotificationEventPayload,
  NotificationFrequency,
  NotificationPreferencesRow,
  NotificationRow,
  NotificationSupabaseClient,
  DeliveryMetadata,
} from "./types.ts";

type ChannelEnabledMap = Record<NotificationChannel, boolean>;

interface QuietHours {
  start: string;
  end: string;
}

interface TypeOverride {
  channels?: Partial<ChannelEnabledMap>;
  frequency?: NotificationFrequency;
}

interface ResolvedPreferences {
  globalEnabled: boolean;
  channelEnabled: ChannelEnabledMap;
  digestFrequency: NotificationFrequency;
  quietHours: QuietHours | null;
  typeOverrides: Record<string, TypeOverride>;
}

export interface RoutingCapabilities {
  in_app?: boolean;
  email?: boolean;
  push?: boolean;
  sms?: boolean;
}

export interface RoutingPlan {
  immediate: NotificationChannel[];
  digest: NotificationChannel[];
  disabled: NotificationChannel[];
  effectiveFrequency: NotificationFrequency;
}

interface RecordDeliveryEventInput {
  supabase: NotificationSupabaseClient;
  notificationId: string;
  deliveryId: number | null;
  channel: NotificationChannel | null;
  event: NotificationEventKind;
  meta?: Record<string, unknown> | null;
}

const DEFAULT_CHANNELS: ChannelEnabledMap = {
  in_app: true,
  email: true,
  push: true,
  sms: false,
};

const BACKOFF_MINUTES = [0, 1, 5, 15, 60, 240, 720];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") {
    const normalised = value.toLowerCase();
    if (["true", "yes", "1"].includes(normalised)) return true;
    if (["false", "no", "0"].includes(normalised)) return false;
  }
  return fallback;
}

function parseChannelEnabled(raw: unknown): ChannelEnabledMap {
  if (!isRecord(raw)) {
    return { ...DEFAULT_CHANNELS };
  }

  const resolved: ChannelEnabledMap = { ...DEFAULT_CHANNELS };

  for (const channel of NOTIFICATION_CHANNELS) {
    if (channel in raw) {
      resolved[channel] = toBoolean(raw[channel], DEFAULT_CHANNELS[channel]);
    }
  }

  return resolved;
}

function parseQuietHours(raw: unknown): QuietHours | null {
  if (!isRecord(raw)) return null;
  const start = typeof raw.start === "string" ? raw.start : undefined;
  const end = typeof raw.end === "string" ? raw.end : undefined;

  if (!start || !end) return null;

  return { start, end };
}

function parseTypeOverrides(raw: unknown): Record<string, TypeOverride> {
  if (!isRecord(raw)) return {};

  const overrides: Record<string, TypeOverride> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (!isRecord(value)) continue;

    const entry: TypeOverride = {};

    if ("channels" in value && isRecord(value.channels)) {
      const overrideChannels: Partial<ChannelEnabledMap> = {};
      for (const channel of NOTIFICATION_CHANNELS) {
        if (channel in value.channels!) {
          overrideChannels[channel] = toBoolean(
            value.channels![channel],
            DEFAULT_CHANNELS[channel],
          );
        }
      }
      entry.channels = overrideChannels;
    }

    if (
      "frequency" in value &&
      typeof value.frequency === "string" &&
      (NOTIFICATION_FREQUENCIES as readonly string[]).includes(value.frequency)
    ) {
      entry.frequency = value.frequency as NotificationFrequency;
    }

    overrides[key] = entry;
  }

  return overrides;
}

export function createServiceSupabaseClient(): NotificationSupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables",
    );
  }

  return createClient<Database>(supabaseUrl, serviceKey, {
    global: { headers: { "X-Client-Info": "notifications-edge" } },
    auth: { persistSession: false },
  });
}

export async function getUserPreferences(
  supabase: NotificationSupabaseClient,
  userId: string,
): Promise<{ row: NotificationPreferencesRow | null; resolved: ResolvedPreferences }>
{
  const { data, error } = await supabase
    .schema("core")
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load notification preferences: ${error.message}`);
  }

  const channelEnabled = parseChannelEnabled(data?.channel_enabled ?? null);
  const quietHours = parseQuietHours(data?.quiet_hours ?? null);
  const typeOverrides = parseTypeOverrides(data?.type_overrides ?? null);
  const digestFrequency = data?.digest_frequency ?? "immediate";
  const globalEnabled = data?.global_enabled ?? true;

  if (!globalEnabled) {
    for (const channel of NOTIFICATION_CHANNELS) {
      if (channel === "in_app") continue;
      channelEnabled[channel] = false;
    }
  }

  return {
    row: data ?? null,
    resolved: {
      globalEnabled,
      channelEnabled,
      digestFrequency,
      quietHours,
      typeOverrides,
    },
  };
}

function timeStringToMinutes(value: string): number {
  const [hoursStr, minutesStr] = value.split(":", 2);
  const hours = Number.parseInt(hoursStr ?? "0", 10);
  const minutes = Number.parseInt(minutesStr ?? "0", 10);
  return (Number.isNaN(hours) ? 0 : hours) * 60 + (Number.isNaN(minutes) ? 0 : minutes);
}

function getZonedDate(now: Date, timezone: string): Date {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);

  const getPart = (type: Intl.DateTimeFormatPartTypes, fallback: number): number => {
    const part = parts.find((p) => p.type === type);
    return part ? Number.parseInt(part.value, 10) : fallback;
  };

  const year = getPart("year", now.getUTCFullYear());
  const month = getPart("month", now.getUTCMonth() + 1) - 1;
  const day = getPart("day", now.getUTCDate());
  const hour = getPart("hour", now.getUTCHours());
  const minute = getPart("minute", now.getUTCMinutes());
  const second = getPart("second", now.getUTCSeconds());

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

function isWithinQuietHours(
  now: Date,
  quietHours: QuietHours | null,
  timezone: string,
): boolean {
  if (!quietHours) return false;

  const zonedDate = getZonedDate(now, timezone);
  const minutes = zonedDate.getUTCHours() * 60 + zonedDate.getUTCMinutes();

  const startMinutes = timeStringToMinutes(quietHours.start);
  const endMinutes = timeStringToMinutes(quietHours.end);

  if (startMinutes === endMinutes) {
    return false;
  }

  if (startMinutes < endMinutes) {
    return minutes >= startMinutes && minutes < endMinutes;
  }

  return minutes >= startMinutes || minutes < endMinutes;
}

function resolveTypeOverride(
  event: NotificationEventPayload,
  preferences: ResolvedPreferences,
): TypeOverride | null {
  return preferences.typeOverrides[event.type] ?? null;
}

export function planRouting(
  event: NotificationEventPayload,
  preferences: ResolvedPreferences,
  capabilities: RoutingCapabilities,
  timezone: string,
  now: Date,
): RoutingPlan {
  const immediate = new Set<NotificationChannel>();
  const digest = new Set<NotificationChannel>();
  const disabled = new Set<NotificationChannel>();

  const requestedChannels = new Set<NotificationChannel>(
    event.channels.length ? event.channels as NotificationChannel[] : ["in_app"],
  );
  requestedChannels.add("in_app");

  const override = resolveTypeOverride(event, preferences);

  const channelEnabled: ChannelEnabledMap = {
    ...preferences.channelEnabled,
    ...(override?.channels ?? {}),
  };

  const effectiveFrequency = override?.frequency ?? preferences.digestFrequency;
  const quietHoursActive = isWithinQuietHours(now, preferences.quietHours, timezone);

  for (const channel of requestedChannels) {
    const capability = capabilities[channel];
    if (capability === false) {
      disabled.add(channel);
      continue;
    }

    const enabled = channelEnabled[channel] ?? DEFAULT_CHANNELS[channel];
    if (!enabled) {
      disabled.add(channel);
      continue;
    }

    if (channel === "in_app") {
      immediate.add(channel);
      continue;
    }

    if (effectiveFrequency === "mute") {
      disabled.add(channel);
      continue;
    }

    const shouldDigest = (
      effectiveFrequency === "digest_daily" ||
      effectiveFrequency === "digest_weekly" ||
      (quietHoursActive && event.severity !== "critical")
    );

    if (shouldDigest) {
      digest.add(channel);
    } else {
      immediate.add(channel);
    }
  }

  return {
    immediate: Array.from(immediate),
    digest: Array.from(digest),
    disabled: Array.from(disabled),
    effectiveFrequency,
  };
}

function getIsoWeek(date: Date): { year: number; week: number } {
  const target = new Date(date.valueOf());
  // ISO week date weeks start on Monday, with week 1 containing Jan 4th.
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const diff = target.getTime() - firstThursday.getTime();
  const week = 1 + Math.round(diff / (7 * 24 * 3600 * 1000));
  return { year: target.getUTCFullYear(), week };
}

export function getDigestBucket(
  frequency: NotificationFrequency,
  now: Date,
  timezone: string,
): string {
  const zoned = getZonedDate(now, timezone);

  if (frequency === "digest_daily") {
    const year = zoned.getUTCFullYear();
    const month = String(zoned.getUTCMonth() + 1).padStart(2, "0");
    const day = String(zoned.getUTCDate()).padStart(2, "0");
    return `daily:${year}-${month}-${day}`;
  }

  if (frequency === "digest_weekly") {
    const { year, week } = getIsoWeek(zoned);
    return `weekly:${year}-W${String(week).padStart(2, "0")}`;
  }

  return `instant:${zoned.toISOString().slice(0, 10)}`;
}

export function calculateNextAttempt(
  attempts: number,
): Date | null {
  if (attempts >= BACKOFF_MINUTES.length) {
    return null;
  }

  const delayMinutes = BACKOFF_MINUTES[attempts];
  const next = new Date();
  next.setMinutes(next.getMinutes() + delayMinutes);
  return next;
}

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function recordDeliveryEvent({
  supabase,
  notificationId,
  deliveryId,
  channel,
  event,
  meta,
}: RecordDeliveryEventInput): Promise<void> {
  if (!(NOTIFICATION_EVENT_KINDS as readonly string[]).includes(event)) {
    console.warn(`Skipping unknown notification event kind: ${event}`);
    return;
  }

  const { error } = await supabase
    .schema("core")
    .from("notification_events")
    .insert({
      notification_id: notificationId,
      delivery_id: deliveryId ?? undefined,
      channel: channel ?? undefined,
      event,
      meta: meta ?? undefined,
    });

  if (error) {
    console.error("Failed to record notification event", error);
  }
}

export function normalizeMetadata(metadata: unknown): DeliveryMetadata {
  if (isRecord(metadata)) {
    return metadata;
  }
  return {};
}

export async function enqueueDelivery(
  supabase: NotificationSupabaseClient,
  notificationId: string,
  channel: NotificationChannel,
  provider: string | null,
  metadata: DeliveryMetadata,
  nextAttemptAt?: Date | null,
): Promise<NotificationDeliveryRow | null> {
  const { data, error } = await supabase
    .schema("core")
    .from("notification_deliveries")
    .insert({
      notification_id: notificationId,
      channel,
      provider: provider ?? undefined,
      metadata,
      next_attempt_at: nextAttemptAt ? nextAttemptAt.toISOString() : undefined,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to enqueue delivery", error);
    return null;
  }

  return data;
}

export async function upsertDigestQueue(
  supabase: NotificationSupabaseClient,
  userId: string,
  type: NotificationRow["type"],
  bucket: string,
  channels: NotificationChannel[],
  event: NotificationEventPayload,
): Promise<void> {
  const { data, error } = await supabase
    .schema("core")
    .from("notification_digest_queue")
    .select("*")
    .eq("user_id", userId)
    .eq("type", type)
    .eq("bucket", bucket)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to query digest queue: ${error.message}`);
  }

  const exampleEntry = {
    id: event.id,
    title: event.title,
    preview: event.preview ?? event.message ?? event.title,
    created_at: new Date().toISOString(),
  };

  if (!data) {
    const { error: insertError } = await supabase
      .schema("core")
      .from("notification_digest_queue")
      .insert({
        user_id: userId,
        type,
        bucket,
        count: 1,
        examples: [exampleEntry],
        channels,
      });

    if (insertError) {
      throw new Error(
        `Failed to insert digest queue entry: ${insertError.message}`,
      );
    }

    return;
  }

  const examples = Array.isArray(data.examples) ? [...data.examples] : [];
  examples.unshift(exampleEntry);

  const trimmedExamples = examples.slice(0, 5);

  const { error: updateError } = await supabase
    .schema("core")
    .from("notification_digest_queue")
    .update({
      count: (data.count ?? 0) + 1,
      examples: trimmedExamples,
      last_event_at: new Date().toISOString(),
      channels: ensureChannelArray([
        ...channels,
        ...((Array.isArray(data.channels) ? data.channels : []) as NotificationChannel[]),
      ]),
    })
    .eq("id", data.id);

  if (updateError) {
    throw new Error(
      `Failed to update digest queue entry: ${updateError.message}`,
    );
  }
}

export async function getUserContacts(
  supabase: NotificationSupabaseClient,
  userId: string,
): Promise<{ email: string | null; phone: string | null }>
{
  try {
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    if (error) {
      throw error;
    }
    return {
      email: data.user.email ?? null,
      phone: data.user.phone ?? null,
    };
  } catch (error) {
    console.error("Failed to fetch user contacts", error);
    return { email: null, phone: null };
  }
}

export async function getDeviceTokens(
  supabase: NotificationSupabaseClient,
  userId: string,
): Promise<Array<{ token: string; platform: string; metadata: DeliveryMetadata }>>
{
  const { data, error } = await supabase
    .schema("core")
    .from("notification_devices")
    .select("token, platform, metadata")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Failed to load notification devices: ${error.message}`);
  }

  return (data ?? []).map((device) => ({
    token: device.token,
    platform: device.platform,
    metadata: normalizeMetadata(device.metadata),
  }));
}

export async function insertNotification(
  supabase: NotificationSupabaseClient,
  payload: Partial<Database["core"]["Tables"]["notifications"]["Insert"]>,
  dedupeKey?: string | null,
): Promise<NotificationRow | null> {
  if (dedupeKey) {
    const { data, error } = await supabase
      .schema("core")
      .from("notifications")
      .upsert(payload, { onConflict: "dedupe_key" })
      .select()
      .single();

    if (error) {
      console.error("Failed to upsert notification", error);
      return null;
    }

    return data;
  }

  const { data, error } = await supabase
    .schema("core")
    .from("notifications")
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error("Failed to insert notification", error);
    return null;
  }

  return data;
}

export function safeJson(data: unknown): string {
  try {
    return JSON.stringify(data);
  } catch {
    return "{}";
  }
}

export function ensureChannelArray(channels: NotificationChannel[]): NotificationChannel[] {
  const seen = new Set<NotificationChannel>();
  const ordered: NotificationChannel[] = [];
  for (const channel of NOTIFICATION_CHANNELS) {
    if (channels.includes(channel) && !seen.has(channel)) {
      ordered.push(channel);
      seen.add(channel);
    }
  }
  return ordered;
}

export function filterImmediateChannels(plan: RoutingPlan): NotificationChannel[] {
  return ensureChannelArray([...plan.immediate]);
}

export function filterDigestChannels(plan: RoutingPlan): NotificationChannel[] {
  return ensureChannelArray([...plan.digest]);
}

export function mergeChannelSets(
  plan: RoutingPlan,
): NotificationChannel[] {
  return ensureChannelArray([
    ...plan.immediate,
    ...plan.digest,
  ]);
}

export function isValidDeliveryStatus(status: string): status is NotificationDeliveryStatus {
  return (NOTIFICATION_DELIVERY_STATUSES as readonly string[]).includes(status);
}
