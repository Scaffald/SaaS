import { serve } from "https://deno.land/std@0.223.0/http/server.ts";
import { z } from "zod";

import { buildAppUrl, resolveAppBaseUrl } from "../_shared/app-url.ts";
import { corsHeaders, createCorsResponse } from "../_shared/cors.ts";
import { createServiceSupabaseClient } from "../_shared/notifications/utils.ts";
import {
  notificationEventSchema,
  type NotificationEventPayload,
} from "../_shared/notifications/types.ts";

const SENDGRID_ENDPOINT = "https://api.sendgrid.com/v3/mail/send";

const payloadSchema = z.object({
  invitationId: z.string().uuid(),
  token: z.string().min(32),
  actorId: z.string().uuid().optional(),
  resend: z.boolean().optional(),
});

type InviteRecord = {
  id: string;
  email: string;
  invited_user_id: string | null;
  role_id: string | null;
  status: string;
  expires_at: string | null;
  metadata: Record<string, unknown> | null;
  sent_at: string | null;
  notification_id: string | null;
  created_by: string | null;
  token_hash: string;
  team: {
    id: string;
    name: string | null;
    slug: string | null;
    organization_id: string | null;
    organization: {
      id: string;
      name: string | null;
    } | null;
  } | null;
  role: {
    id: string;
    key: string | null;
    name: string | null;
  } | null;
};

interface EmailResult {
  ok: boolean;
  status: "sent" | "failed";
  error?: string;
  providerMessageId?: string | null;
}

function hashInvitationToken(token: string): Promise<string> {
  const encoded = new TextEncoder().encode(token);
  return crypto.subtle.digest("SHA-256", encoded).then((buffer) =>
    Array.from(new Uint8Array(buffer))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

function buildAcceptUrl(token: string): string {
  const acceptPath = Deno.env.get("TEAM_INVITATION_ACCEPT_PATH") ??
    "/teams/invitations/accept";
  const base = resolveAppBaseUrl();
  const url = acceptPath.startsWith("/") ? `${base}${acceptPath}` : `${base}/${acceptPath}`;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}token=${encodeURIComponent(token)}`;
}

function buildRevokeUrl(invitationId: string): string {
  const revokePath = Deno.env.get("TEAM_INVITATION_MANAGE_PATH") ??
    "/dashboard/teams/invitations";
  return buildAppUrl(`${revokePath}?invitationId=${encodeURIComponent(invitationId)}`);
}

function buildEmailContent(params: {
  teamName: string;
  organizationName: string | null;
  roleName: string | null;
  acceptUrl: string;
  expiresAt: string | null;
}): { subject: string; text: string; html: string } {
  const { teamName, organizationName, roleName, acceptUrl, expiresAt } = params;
  const subject = `Invitation to join ${teamName}`;
  const expiryText = expiresAt
    ? `This invitation expires on ${new Date(expiresAt).toLocaleString()}.`
    : "This invitation will expire soon.";
  const roleText = roleName ? ` as a ${roleName}` : "";
  const orgText = organizationName ? ` at ${organizationName}` : "";

  const text = [
    `You've been invited to join ${teamName}${orgText}${roleText}.`,
    "",
    "To accept, open the link below:",
    acceptUrl,
    "",
    expiryText,
  ].join("\n");

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #1f2933;">
      <h2 style="color: #111827;">Join ${teamName}</h2>
      <p>
        You've been invited to join <strong>${teamName}</strong>${orgText}${roleText}.
      </p>
      <p style="margin: 24px 0;">
        <a
          href="${acceptUrl}"
          style="
            background-color: #2563eb;
            border-radius: 6px;
            color: #ffffff;
            display: inline-block;
            font-weight: 600;
            padding: 12px 24px;
            text-decoration: none;
          "
        >
          Accept invitation
        </a>
      </p>
      <p>
        If the button above doesn't work, copy and paste this link into your browser:<br />
        <a href="${acceptUrl}">${acceptUrl}</a>
      </p>
      <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">${expiryText}</p>
    </div>
  `;

  return { subject, text, html };
}

async function sendPlainEmail(
  to: string,
  content: { subject: string; text: string; html: string },
): Promise<EmailResult> {
  const apiKey = Deno.env.get("SENDGRID_API_KEY");
  if (!apiKey) {
    return { ok: false, status: "failed", error: "Missing SENDGRID_API_KEY environment variable." };
  }

  const fromEmail = Deno.env.get("SENDGRID_FROM_EMAIL") ?? "notifications@scaffald.com";
  const fromName = Deno.env.get("SENDGRID_FROM_NAME") ?? "Scaffald";

  const payload = {
    personalizations: [
      {
        to: [{ email: to }],
      },
    ],
    from: { email: fromEmail, name: fromName },
    subject: content.subject,
    content: [
      { type: "text/plain", value: content.text },
      { type: "text/html", value: content.html },
    ],
  };

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
      return {
        ok: true,
        status: "sent",
        providerMessageId: response.headers.get("x-message-id"),
      };
    }

    const errorBody = await response.text();
    return {
      ok: false,
      status: "failed",
      error: `SendGrid responded with status ${response.status}: ${errorBody}`,
    };
  } catch (error) {
    return {
      ok: false,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function publishNotificationEvent(event: NotificationEventPayload) {
  const functionsUrl = Deno.env.get("SUPABASE_FUNCTIONS_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!functionsUrl || !serviceKey) {
    throw new Error("Missing SUPABASE_FUNCTIONS_URL or SUPABASE_SERVICE_ROLE_KEY environment variable.");
  }

  const response = await fetch(`${functionsUrl}/notify-publish`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${serviceKey}`,
      "apikey": serviceKey,
      ...corsHeaders,
    },
    body: JSON.stringify(event),
  });

  const data = await response.json();
  if (!response.ok || !data?.ok) {
    throw new Error(
      typeof data?.error === "string"
        ? data.error
        : `notify-publish responded with status ${response.status}`,
    );
  }

  return data;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return createCorsResponse("ok");
  }

  if (req.method !== "POST") {
    return createCorsResponse(JSON.stringify({ error: "Method not allowed" }), 405);
  }

  let payload: z.infer<typeof payloadSchema>;

  try {
    const body = await req.json();
    payload = payloadSchema.parse(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return createCorsResponse(JSON.stringify({ error: "Invalid payload", details: message }), 400);
  }

  try {
    const supabase = createServiceSupabaseClient();

    const { data, error } = await supabase
      .schema("core")
      .from("team_invitations")
      .select(`
        id,
        email,
        invited_user_id,
        role_id,
        status,
        expires_at,
        metadata,
        sent_at,
        notification_id,
        created_by,
        token_hash,
        team:teams(
          id,
          name,
          slug,
          organization_id,
          organization:organizations(
            id,
            name
          )
        ),
        role:team_roles(
          id,
          key,
          name
        )
      `)
      .eq("id", payload.invitationId)
      .maybeSingle<InviteRecord>();

    if (error) {
      console.error("[send-team-invitation] query error", error);
      return createCorsResponse(JSON.stringify({
        error: "Failed to load invitation.",
        details: error.message,
      }), 500);
    }

    if (!data) {
      return createCorsResponse(JSON.stringify({
        error: "Invitation not found.",
      }), 404);
    }

    if (data.status !== "pending" && !payload.resend) {
      return createCorsResponse(JSON.stringify({
        error: `Cannot send invitation in status "${data.status}".`,
      }), 400);
    }

    const hashedToken = await hashInvitationToken(payload.token);
    if (hashedToken !== data.token_hash) {
      return createCorsResponse(JSON.stringify({
        error: "Invitation token mismatch.",
      }), 400);
    }

    const acceptUrl = buildAcceptUrl(payload.token);
    const revokeUrl = buildRevokeUrl(data.id);

    const teamName = data.team?.name ?? "your team";
    const organizationName = data.team?.organization?.name ?? null;
    const roleName = data.role?.name ?? null;

    const emailContent = buildEmailContent({
      teamName,
      organizationName,
      roleName,
      acceptUrl,
      expiresAt: data.expires_at,
    });

    const now = new Date();
    const channels: string[] = [];
    let notificationId: string | null = null;
    let deliveryStatus: string = "queued";
    let deliveryError: string | null = null;

    if (data.invited_user_id) {
      // Build notification event and leverage notify-publish to handle channel routing.
      const eventPayload: NotificationEventPayload = notificationEventSchema.parse({
        id: `team-invite:${data.id}`,
        type: "team.invite",
        severity: "important",
        title: `Invitation to join ${teamName}`,
        message: emailContent.text,
        preview: `Join ${teamName}`,
        recipients: [data.invited_user_id],
        channels: ["in_app", "email", "push"],
        metadata: {
          invitationId: data.id,
          teamId: data.team?.id ?? null,
          organizationId: data.team?.organization_id ?? null,
          roleId: data.role_id ?? null,
          acceptUrl,
          revokeUrl,
          sentAt: now.toISOString(),
          subject: emailContent.subject,
          html: emailContent.html,
          text: emailContent.text,
        },
        body: {
          invitationId: data.id,
          teamId: data.team?.id ?? null,
          teamName,
          organizationName,
          roleName,
          acceptUrl,
          expiresAt: data.expires_at,
          revokeUrl,
        },
        cta: {
      label: "View invitation",
      url: acceptUrl,
    },
        actorId: payload.actorId ?? data.created_by ?? undefined,
      });

      try {
        const publishResult = await publishNotificationEvent(eventPayload);
        const resultEntry = Array.isArray(publishResult.results)
          ? publishResult.results.find((entry: Record<string, unknown>) =>
            entry?.recipientId === data.invited_user_id
          )
          : null;

        if (resultEntry?.notificationId) {
          notificationId = String(resultEntry.notificationId);
        }

        const queuedChannels = Array.isArray(resultEntry?.queuedChannels)
          ? resultEntry.queuedChannels as NotificationChannel[]
          : [];
        const digestChannels = Array.isArray(resultEntry?.digestChannels)
          ? resultEntry.digestChannels as NotificationChannel[]
          : [];

        const combinedChannels = new Set<NotificationChannel>([
          ...queuedChannels,
          ...digestChannels,
        ]);

        channels.push(...combinedChannels);

        if (resultEntry?.status === "error") {
          deliveryStatus = "failed";
          deliveryError = typeof resultEntry.error === "string"
            ? resultEntry.error
            : "Failed to queue invitation notification.";
        } else if (resultEntry?.status === "duplicate") {
          deliveryStatus = "queued";
        } else {
          deliveryStatus = "queued";
        }
      } catch (error) {
        deliveryStatus = "failed";
        deliveryError = error instanceof Error ? error.message : String(error);
        console.error("[send-team-invitation] notify-publish failed", error);
      }
    } else {
      const emailResult = await sendPlainEmail(data.email, emailContent);
      deliveryStatus = emailResult.status;
      deliveryError = emailResult.error ?? null;
      channels.push("email");
    }

    const metadata = {
      ...(data.metadata ?? {}),
      lastDelivery: {
        channels,
        status: deliveryStatus,
        error: deliveryError,
        acceptUrl,
        revokeUrl,
        updatedAt: now.toISOString(),
      },
    };

    const { error: updateError } = await supabase
      .schema("core")
      .from("team_invitations")
      .update({
        sent_at: now.toISOString(),
        notification_id: notificationId,
        last_delivery_status: deliveryStatus,
        last_delivery_error: deliveryError,
        last_delivery_channels: channels.length ? channels : null,
        metadata,
      })
      .eq("id", data.id);

    if (updateError) {
      console.error("[send-team-invitation] failed to update invitation", updateError);
      return createCorsResponse(JSON.stringify({
        error: "Failed to update invitation delivery metadata.",
        details: updateError.message,
      }), 500);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        invitationId: data.id,
        notificationId,
        channels,
        status: deliveryStatus,
        error: deliveryError,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      },
    );
  } catch (error) {
    console.error("[send-team-invitation] unexpected error", error);
    return createCorsResponse(JSON.stringify({
      error: "Unexpected error while processing invitation.",
      details: error instanceof Error ? error.message : String(error),
    }), 500);
  }
});

