/**
 * Supabase Auth "Send Email" hook (HTTPS). See _shared/auth-email-hook.ts.
 *
 * Secrets (per environment, via `supabase secrets set`):
 *   AUTH_EMAIL_HOOK_SECRET   the `v1,whsec_…` Supabase shows for the hook
 *   NEVARMAIL_API_KEY        a NevarMail API key (nvm_…) for the Unicorn org
 *   NEVARMAIL_USE_CASE_ID    "Scaffald sign-in" use case id
 *   NEVARMAIL_BASE_URL       optional, defaults to https://app.nevarmail.com
 *
 * Fails closed: an unsigned or mis-signed request is 401 and sends nothing.
 * A send failure answers 500 with Supabase's error shape, so the user sees
 * "Error sending … email" instead of a silent success with no mail.
 */
import {
  buildEmails,
  type HookPayload,
  type OutgoingEmail,
  sendViaNevarMail,
  verifyHookSignature,
} from "../_shared/auth-email-hook.ts";

function hookError(status: number, message: string): Response {
  return new Response(
    JSON.stringify({ error: { http_code: status, message } }),
    { status, headers: { "Content-Type": "application/json" } },
  );
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return hookError(405, "Method not allowed");

  const secret = Deno.env.get("AUTH_EMAIL_HOOK_SECRET");
  const apiKey = Deno.env.get("NEVARMAIL_API_KEY");
  const useCaseId = Deno.env.get("NEVARMAIL_USE_CASE_ID");
  if (!secret || !apiKey || !useCaseId) {
    console.error(
      "[auth-email-hook] missing AUTH_EMAIL_HOOK_SECRET, NEVARMAIL_API_KEY or NEVARMAIL_USE_CASE_ID",
    );
    return hookError(500, "Auth email hook is not configured");
  }

  const body = await req.text();
  const ok = await verifyHookSignature(secret, {
    id: req.headers.get("webhook-id"),
    timestamp: req.headers.get("webhook-timestamp"),
    signature: req.headers.get("webhook-signature"),
  }, body);
  if (!ok) return hookError(401, "Invalid hook signature");

  let payload: HookPayload;
  try {
    payload = JSON.parse(body) as HookPayload;
  } catch {
    return hookError(400, "Malformed hook payload");
  }

  let emails: OutgoingEmail[];
  try {
    emails = buildEmails(payload);
  } catch (e) {
    return hookError(400, (e as Error).message);
  }

  try {
    for (const email of emails) {
      await sendViaNevarMail(
        {
          apiKey,
          useCaseId,
          baseUrl: Deno.env.get("NEVARMAIL_BASE_URL") ?? undefined,
        },
        email,
      );
    }
  } catch (e) {
    console.error(
      `[auth-email-hook] ${payload.email_data?.email_action_type} for ${payload.user?.id}: ${
        (e as Error).message
      }`,
    );
    return hookError(500, "Error sending email");
  }

  return new Response("{}", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
