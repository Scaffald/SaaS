declare module "@supabase/supabase-js" {
  export * from "@supabase/supabase-js";
}

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
    priority?: "default" | "normal" | "high";
    badge?: number;
    channelId?: string;
  };

  type ExpoPushTicket =
    | { status: "ok"; id?: string }
    | { status: "error"; message?: string; details?: { error?: string } };

  export class Expo {
    constructor(options?: { accessToken?: string });
    static isExpoPushToken(token: string): boolean;
    sendPushNotificationsAsync(messages: ExpoPushMessage[]): Promise<ExpoPushTicket[]>;
  }
}
