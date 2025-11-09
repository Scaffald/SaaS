declare module "https://esm.sh/@supabase/supabase-js@2.39.0" {
  export * from "@supabase/supabase-js";
}

declare module "https://esm.sh/@supabase/supabase-js@2.38.4" {
  export * from "@supabase/supabase-js";
}

declare module "https://esm.sh/expo-server-sdk@4.9.1" {
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
