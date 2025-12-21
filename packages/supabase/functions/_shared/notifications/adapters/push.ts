import { Expo } from 'expo-server-sdk';
import type { ChannelAdapter } from '../types.ts';
import { normalizeMetadata } from '../utils.ts';

const expo = new Expo({
  accessToken: Deno.env.get("EXPO_ACCESS_TOKEN") ?? undefined,
});

export const pushAdapter: ChannelAdapter = {
  async send({ delivery, notification }) {
    const metadata = normalizeMetadata(delivery.metadata);

    const token = typeof metadata.token === "string"
      ? metadata.token
      : Array.isArray(metadata.tokens) && metadata.tokens.length > 0
      ? String(metadata.tokens[0])
      : null;

    if (!token) {
      return {
        status: "failed",
        error: "Missing Expo push token in delivery metadata",
      };
    }

    if (!Expo.isExpoPushToken(token)) {
      return {
        status: "failed",
        error: `Invalid Expo push token provided: ${token}`,
      };
    }

    const title = typeof metadata.title === "string"
      ? metadata.title
      : notification.title;

    const body = typeof metadata.body === "string"
      ? metadata.body
      : (notification.message ?? notification.preview ?? notification.title);

    const data: Record<string, unknown> = isPlainObject(metadata.data)
      ? metadata.data
      : isPlainObject(notification.body)
      ? notification.body
      : {};

    const sound = typeof metadata.sound === "string"
      ? metadata.sound
      : 'default';

    try {
      const [ticket] = await expo.sendPushNotificationsAsync([
        {
          to: token,
          title,
          body,
          sound,
          data,
          badge: typeof metadata.badge === "number"
            ? metadata.badge
            : undefined,
          ttl: typeof metadata.ttl === "number" ? metadata.ttl : undefined,
          priority: metadata.priority === "high" ? "high" : "default",
          channelId: typeof metadata.channelId === "string"
            ? metadata.channelId
            : undefined,
        },
      ]);

      if (ticket?.status === "ok") {
        return {
          status: "sent",
          providerMessageId: ticket.id,
          events: [
            {
              kind: "accepted",
              meta: {
                provider: "expo",
                ticket: ticket.id,
              },
            },
          ],
        };
      }

      if (ticket?.status === "error") {
        return {
          status: ticket.details?.error === "DeviceNotRegistered"
            ? "failed"
            : "retry",
          error: ticket.message ?? "Unknown Expo push error",
        };
      }

      return {
        status: "retry",
        error: "Unexpected Expo ticket response",
      };
    } catch (error) {
      return {
        status: "retry",
        error: error instanceof Error
          ? error.message
          : "Unknown Expo push error",
      };
    }
  },
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
