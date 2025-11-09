import { normalizeMetadata } from "../utils.ts";
import type { ChannelAdapter } from "../types.ts";

function encodeBasicAuth(accountSid: string, authToken: string): string {
  return `Basic ${btoa(`${accountSid}:${authToken}`)}`;
}

export const smsAdapter: ChannelAdapter = {
  async send({ delivery, notification }) {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const fromNumber = Deno.env.get("TWILIO_SMS_FROM");

    if (!accountSid || !authToken || !fromNumber) {
      return {
        status: "failed",
        error: "Missing Twilio SMS configuration",
      };
    }

    const metadata = normalizeMetadata(delivery.metadata);
    const toNumber = typeof metadata.phone === "string"
      ? metadata.phone
      : typeof metadata.to === "string"
      ? metadata.to
      : null;

    if (!toNumber) {
      return {
        status: "failed",
        error: "Missing destination phone number in delivery metadata",
      };
    }

    const body = typeof metadata.body === "string"
      ? metadata.body
      : notification.message ?? notification.preview ?? notification.title;

    const statusCallback = typeof metadata.statusCallback === "string"
      ? metadata.statusCallback
      : Deno.env.get("TWILIO_SMS_STATUS_CALLBACK") ?? undefined;

    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

    const params = new URLSearchParams({
      From: fromNumber,
      To: toNumber,
      Body: body,
    });

    if (statusCallback) {
      params.append("StatusCallback", statusCallback);
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: encodeBasicAuth(accountSid, authToken),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });

      const responseBody = await response.json().catch(() => ({}));

      if (response.ok) {
        const sid = typeof responseBody.sid === "string" ? responseBody.sid : undefined;
        return {
          status: "sent",
          providerMessageId: sid,
          events: [
            {
              kind: "accepted",
              meta: {
                provider: "twilio",
                sid,
              },
            },
          ],
        };
      }

      const errorMessage = responseBody.message
        ? `${response.status}: ${responseBody.message}`
        : `Twilio responded with status ${response.status}`;

      const shouldRetry = response.status >= 500;

      return {
        status: shouldRetry ? "retry" : "failed",
        error: errorMessage,
      };
    } catch (error) {
      return {
        status: "retry",
        error: error instanceof Error ? error.message : "Unknown SMS error",
      };
    }
  },
};
