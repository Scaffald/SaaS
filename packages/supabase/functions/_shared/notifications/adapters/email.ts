import { normalizeMetadata } from "../utils.ts";
import type { ChannelAdapter } from "../types.ts";

interface SendEmailPayload {
  personalizations: Array<{ to: Array<{ email: string }>; dynamic_template_data?: Record<string, unknown> }>;
  from: { email: string; name?: string };
  subject?: string;
  content?: Array<{ type: string; value: string }>;
  template_id?: string;
  mail_settings?: { sandbox_mode?: { enable: boolean } };
}

const SENDGRID_ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

function buildEmailPayload(
  metadata: Record<string, unknown>,
  notificationTitle: string,
  notificationBody: Record<string, unknown>,
  messageFallback: string,
): SendEmailPayload {
  const fromEmail = typeof metadata.fromEmail === "string"
    ? metadata.fromEmail
    : Deno.env.get("SENDGRID_FROM_EMAIL") ?? "notifications@scaffald.com";

  const fromName = typeof metadata.fromName === "string"
    ? metadata.fromName
    : Deno.env.get("SENDGRID_FROM_NAME") ?? "Scaffald";

  const templateId = typeof metadata.templateId === "string"
    ? metadata.templateId
    : Deno.env.get("SENDGRID_TEMPLATE_ID") ?? undefined;

  const dynamicTemplateData = (metadata.templateData && typeof metadata.templateData === "object")
    ? metadata.templateData as Record<string, unknown>
    : undefined;

  const htmlBody = typeof metadata.html === "string"
    ? metadata.html
    : `<p>${messageFallback}</p>`;

  const textBody = typeof metadata.text === "string"
    ? metadata.text
    : messageFallback;

  const payload: SendEmailPayload = {
    personalizations: [
      {
        to: [
          {
            email: String(metadata.email),
          },
        ],
        dynamic_template_data: dynamicTemplateData,
      },
    ],
    from: { email: fromEmail, name: fromName },
  };

  if (templateId) {
    payload.template_id = templateId;
    if (!payload.personalizations[0].dynamic_template_data) {
      payload.personalizations[0].dynamic_template_data = {
        title: notificationTitle,
        preview: messageFallback,
        body: notificationBody,
      };
    }
  } else {
    payload.subject = typeof metadata.subject === "string"
      ? metadata.subject
      : notificationTitle;
    payload.content = [
      { type: "text/plain", value: textBody },
      { type: "text/html", value: htmlBody },
    ];
  }

  if (Deno.env.get("SENDGRID_SANDBOX_MODE") === "true") {
    payload.mail_settings = {
      sandbox_mode: { enable: true },
    };
  }

  return payload;
}

export const emailAdapter: ChannelAdapter = {
  async send({ delivery, notification }) {
    const apiKey = Deno.env.get("SENDGRID_API_KEY");
    if (!apiKey) {
      return {
        status: "failed",
        error: "SENDGRID_API_KEY environment variable is not set",
      };
    }

    const metadata = normalizeMetadata(delivery.metadata);
    const recipient = typeof metadata.email === "string" ? metadata.email : null;

    if (!recipient) {
      return {
        status: "failed",
        error: "Missing recipient email address in delivery metadata",
      };
    }

    const bodyPayload = notification.body ?? {};
    const messageFallback = notification.message ?? notification.preview ?? notification.title;

    const payload = buildEmailPayload(
      metadata,
      notification.title,
      bodyPayload,
      messageFallback,
    );

    try {
      const response = await fetch(SENDGRID_ENDPOINT, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok || response.status === 202) {
        const providerMessageId = response.headers.get("x-message-id") ?? undefined;
        return {
          status: "sent",
          providerMessageId,
          events: [
            {
              kind: "accepted",
              meta: {
                provider: "sendgrid",
                status: response.status,
              },
            },
          ],
        };
      }

      const errorBody = await response.text();

      const shouldRetry = response.status >= 500;

      return {
        status: shouldRetry ? "retry" : "failed",
        error: `SendGrid responded with status ${response.status}: ${errorBody}`,
      };
    } catch (error) {
      return {
        status: "retry",
        error: error instanceof Error ? error.message : "Unknown email error",
      };
    }
  },
};
