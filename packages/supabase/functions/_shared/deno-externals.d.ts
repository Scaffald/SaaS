// Re-export types from npm packages for Deno compatibility
// Note: With npm: specifiers in import_map.json, types are resolved from node_modules

// Expo Push Notification types
declare module "expo-server-sdk" {
  type ExpoPushMessage = {
    to: string;
    data?: Record<string, unknown>;
    title?: string;
    subtitle?: string;
    body?: string;
    sound?: string | null;
    ttl?: number;
    expiration?: number;
    priority?: 'default' | 'normal' | 'high';
    badge?: number;
    channelId?: string;
  };

  type ExpoPushTicket =
    | { status: "ok"; id?: string }
    | { status: "error"; message?: string; details?: { error?: string } };

  type ExpoPushReceipt =
    | { status: "ok" }
    | { status: "error"; message?: string; details?: { error?: string } };

  type ExpoPushReceiptId = string;

  export class Expo {
    constructor(options?: { accessToken?: string });
    static isExpoPushToken(token: string): boolean;
    sendPushNotificationsAsync(
      messages: ExpoPushMessage[],
    ): Promise<ExpoPushTicket[]>;
    getPushNotificationReceiptsAsync(
      receiptIds: ExpoPushReceiptId[],
    ): Promise<Record<string, ExpoPushReceipt>>;
  }
}
