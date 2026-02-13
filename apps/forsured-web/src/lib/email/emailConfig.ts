/**
 * ForSured Email Configuration
 *
 * Email configuration and auditability
 *
 * Direct SendGrid API integration for email sending.
 * Webhooks are handled via /api/webhooks/sendgrid route.
 *
 * This is a server-side module (Node.js only).
 */

// Environment variables
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ||
  process.env.EMAIL_FROM_ADDRESS;
const SENDGRID_FROM_NAME = process.env.SENDGRID_FROM_NAME ||
  process.env.EMAIL_FROM_NAME || "ForSured";

// Validate required environment variables at module load
if (typeof process !== "undefined" && !SENDGRID_API_KEY) {
  console.warn("[email] SENDGRID_API_KEY not set - email sending will fail");
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  metadata?: Record<string, unknown>;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  provider: string;
  error?: string;
}

/**
 * Send an email via SendGrid API
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendEmailResult> {
  if (!SENDGRID_API_KEY) {
    console.error("[email] Cannot send email: SENDGRID_API_KEY not configured");
    return {
      success: false,
      provider: "sendgrid",
      error: "SENDGRID_API_KEY not configured",
    };
  }

  if (!SENDGRID_FROM_EMAIL) {
    console.error(
      "[email] Cannot send email: SENDGRID_FROM_EMAIL not configured",
    );
    return {
      success: false,
      provider: "sendgrid",
      error: "SENDGRID_FROM_EMAIL not configured",
    };
  }

  // Normalize recipients to array
  const recipients = Array.isArray(options.to) ? options.to : [options.to];

  // Build custom args from metadata for webhook tracking
  const customArgs: Record<string, string> = {
    forsured: "true",
  };

  if (options.metadata) {
    for (const [key, value] of Object.entries(options.metadata)) {
      if (value !== undefined && value !== null) {
        customArgs[key] = String(value);
      }
    }
  }

  const payload = {
    personalizations: [
      {
        to: recipients.map((email) => ({ email })),
        custom_args: customArgs,
      },
    ],
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: SENDGRID_FROM_NAME,
    },
    subject: options.subject,
    content: [
      ...(options.text ? [{ type: "text/plain", value: options.text }] : []),
      { type: "text/html", value: options.html },
    ],
    categories: ["forsured"],
    custom_args: customArgs,
  };

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // SendGrid returns 202 Accepted for successful sends
    if (response.status === 202) {
      const messageId = response.headers.get("x-message-id") || undefined;
      console.log("[email] Email sent successfully", {
        to: recipients,
        subject: options.subject,
        messageId,
      });
      return {
        success: true,
        messageId,
        provider: "sendgrid",
      };
    }

    const errorBody = await response.text();
    console.error("[email] SendGrid API error", {
      status: response.status,
      body: errorBody,
    });
    return {
      success: false,
      provider: "sendgrid",
      error: `HTTP ${response.status}: ${errorBody}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[email] Failed to send email", { error: errorMessage });
    return {
      success: false,
      provider: "sendgrid",
      error: errorMessage,
    };
  }
}

/**
 * Send a templated email via SendGrid dynamic templates
 */
export async function sendTemplatedEmail(
  templateId: string,
  data: Record<string, unknown>,
  to: string | string[],
  metadata?: Record<string, unknown>,
): Promise<SendEmailResult> {
  if (!SENDGRID_API_KEY) {
    console.error(
      "[email] Cannot send templated email: SENDGRID_API_KEY not configured",
    );
    return {
      success: false,
      provider: "sendgrid",
      error: "SENDGRID_API_KEY not configured",
    };
  }

  if (!SENDGRID_FROM_EMAIL) {
    console.error(
      "[email] Cannot send templated email: SENDGRID_FROM_EMAIL not configured",
    );
    return {
      success: false,
      provider: "sendgrid",
      error: "SENDGRID_FROM_EMAIL not configured",
    };
  }

  const recipients = Array.isArray(to) ? to : [to];

  const customArgs: Record<string, string> = {
    forsured: "true",
    templateId,
  };

  if (metadata) {
    for (const [key, value] of Object.entries(metadata)) {
      if (value !== undefined && value !== null) {
        customArgs[key] = String(value);
      }
    }
  }

  const payload = {
    personalizations: [
      {
        to: recipients.map((email) => ({ email })),
        dynamic_template_data: data,
        custom_args: customArgs,
      },
    ],
    from: {
      email: SENDGRID_FROM_EMAIL,
      name: SENDGRID_FROM_NAME,
    },
    template_id: templateId,
    categories: ["forsured"],
    custom_args: customArgs,
  };

  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 202) {
      const messageId = response.headers.get("x-message-id") || undefined;
      console.log("[email] Templated email sent successfully", {
        to: recipients,
        templateId,
        messageId,
      });
      return {
        success: true,
        messageId,
        provider: "sendgrid",
      };
    }

    const errorBody = await response.text();
    console.error("[email] SendGrid API error for templated email", {
      status: response.status,
      body: errorBody,
    });
    return {
      success: false,
      provider: "sendgrid",
      error: `HTTP ${response.status}: ${errorBody}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[email] Failed to send templated email", {
      error: errorMessage,
    });
    return {
      success: false,
      provider: "sendgrid",
      error: errorMessage,
    };
  }
}

/**
 * Track an email event for audit logging
 * Called from the webhook handler - logs to forsured.audit_log
 */
export async function trackEmailEvent(
  eventType:
    | "delivered"
    | "opened"
    | "clicked"
    | "bounced"
    | "dropped"
    | "spam_report",
  messageId: string,
  recipient: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const { auditService } = await import("../audit/AuditService");

  try {
    await auditService.log({
      category: "system",
      action: `email_${eventType}`,
      severity:
        eventType === "bounced" || eventType === "dropped" || eventType === "spam_report"
          ? "medium"
          : "info",
      status:
        eventType === "bounced" || eventType === "dropped" || eventType === "spam_report"
          ? "failure"
          : "success",
      resource_type: "email",
      resource_name: messageId,
      metadata: {
        messageId,
        recipient,
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("[email] Failed to log email event to audit trail:", error);
  }
}
