/**
 * The Supabase "Send Email" hook → NevarMail (functions/auth-email-hook).
 *
 * NevarMail is a third-party service from this function's point of view, so
 * the send is checked against a fake fetch; everything else is the real code.
 */
import {
  assert,
  assertEquals,
  assertStringIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  buildEmails,
  type HookPayload,
  renderTemplate,
  sendViaNevarMail,
  verifyHookSignature,
} from "../../../_shared/auth-email-hook.ts";
import { AUTH_EMAIL_TEMPLATES } from "../../../_shared/auth-email-templates.ts";

const RAW_KEY = btoa("a-32-byte-secret-for-hook-tests!");
const SECRET = `v1,whsec_${RAW_KEY}`;

async function sign(id: string, ts: string, body: string, key = RAW_KEY) {
  const k = await crypto.subtle.importKey(
    "raw",
    Uint8Array.from(atob(key), (c) => c.charCodeAt(0)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    k,
    new TextEncoder().encode(`${id}.${ts}.${body}`),
  );
  return `v1,${btoa(String.fromCharCode(...new Uint8Array(mac)))}`;
}

const payload = (
  action: string,
  extra: Partial<HookPayload["email_data"]> = {},
  user: HookPayload["user"] = {
    id: "u1",
    email: "jodie@example.test",
  },
): HookPayload => ({
  user,
  email_data: {
    token: "123456",
    token_hash: "pkce_abc+/=",
    email_action_type: action,
    site_url: "https://dev.scaffald.com/",
    ...extra,
  },
});

Deno.test("signature: a correctly signed, fresh request verifies", async () => {
  const body = JSON.stringify(payload("magiclink"));
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = await sign("msg_1", ts, body);
  assert(
    await verifyHookSignature(SECRET, {
      id: "msg_1",
      timestamp: ts,
      signature: sig,
    }, body),
  );
  // Several signatures in one header: any valid one is enough.
  assert(
    await verifyHookSignature(SECRET, {
      id: "msg_1",
      timestamp: ts,
      signature: `v1,bogus ${sig}`,
    }, body),
  );
});

Deno.test("signature: tampered body, stale timestamp, wrong secret and missing headers all fail", async () => {
  const body = JSON.stringify(payload("magiclink"));
  const ts = String(Math.floor(Date.now() / 1000));
  const sig = await sign("msg_1", ts, body);
  assertEquals(
    await verifyHookSignature(SECRET, {
      id: "msg_1",
      timestamp: ts,
      signature: sig,
    }, body + " "),
    false,
  );
  const old = String(Math.floor(Date.now() / 1000) - 3600);
  assertEquals(
    await verifyHookSignature(SECRET, {
      id: "msg_1",
      timestamp: old,
      signature: await sign("msg_1", old, body),
    }, body),
    false,
  );
  assertEquals(
    await verifyHookSignature(
      `v1,whsec_${btoa("some-other-secret-32-bytes-long!!")}`,
      { id: "msg_1", timestamp: ts, signature: sig },
      body,
    ),
    false,
  );
  assertEquals(
    await verifyHookSignature(SECRET, {
      id: null,
      timestamp: ts,
      signature: sig,
    }, body),
    false,
  );
});

Deno.test("render: the branded template, with the site URL, token and URL-encoded token hash filled in", () => {
  const { subject, html } = renderTemplate("magic_link", {
    siteUrl: "https://dev.scaffald.com/",
    token: "123456",
    tokenHash: "pkce_abc+/=",
  });
  assertEquals(subject, AUTH_EMAIL_TEMPLATES.magic_link.subject);
  assertStringIncludes(
    html,
    "https://dev.scaffald.com/auth/confirm?token_hash=pkce_abc%2B%2F%3D&type=email",
  );
  assertStringIncludes(html, "123456");
  assert(!html.includes("{{"), "a template variable was left unrendered");
});

Deno.test("buildEmails: each action maps to its template and link type", () => {
  const cases: Array<[string, string]> = [
    ["magiclink", "type=email"],
    ["email", "type=email"],
    ["signup", "type=signup"],
    ["invite", "type=invite"],
    ["recovery", "type=recovery"],
  ];
  for (const [action, linkType] of cases) {
    const [mail, ...rest] = buildEmails(payload(action));
    assertEquals(rest.length, 0, action);
    assertEquals(mail.to, "jodie@example.test");
    assertStringIncludes(mail.html, linkType);
    assertStringIncludes(
      mail.text,
      `https://dev.scaffald.com/auth/confirm?token_hash=pkce_abc%2B%2F%3D&${linkType}`,
    );
  }
});

Deno.test("buildEmails: a secure email change mails both addresses with their own token; reauthentication is a code", () => {
  const change = buildEmails(payload(
    "email_change",
    { token_new: "654321", token_hash_new: "hash_current" },
    { id: "u1", email: "old@example.test", new_email: "new@example.test" },
  ));
  assertEquals(change.map((m) => m.to), [
    "new@example.test",
    "old@example.test",
  ]);
  assertStringIncludes(change[1].html, "token_hash=hash_current");

  const [reauth] = buildEmails(payload("reauthentication"));
  assertStringIncludes(reauth.text, "123456");

  let threw = false;
  try {
    buildEmails(payload("something_new"));
  } catch {
    threw = true;
  }
  assert(threw, "an unknown action must fail, not send a wrong email");
});

Deno.test("send: posts the email to NevarMail as the sign-in use case, and a non-2xx is an error", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const okFetch = ((url: string, init: RequestInit) => {
    calls.push({ url, init });
    return Promise.resolve(new Response("{}", { status: 200 }));
  }) as unknown as typeof fetch;
  const [mail] = buildEmails(payload("magiclink"));
  await sendViaNevarMail(
    { apiKey: "nvm_test", useCaseId: "fc1f51bc-25f3-4201-8cfa-57025af1bd92" },
    mail,
    okFetch,
  );
  assertEquals(calls[0].url, "https://app.nevarmail.com/api/v1/email/send");
  assertEquals(
    (calls[0].init.headers as Record<string, string>).Authorization,
    "Bearer nvm_test",
  );
  const sent = JSON.parse(calls[0].init.body as string);
  assertEquals(sent.to, "jodie@example.test");
  assertEquals(sent.use_case_id, "fc1f51bc-25f3-4201-8cfa-57025af1bd92");
  assertEquals(sent.emailType, "transactional");

  const failFetch = (() =>
    Promise.resolve(
      new Response("FROM_UNRESOLVABLE", { status: 409 }),
    )) as unknown as typeof fetch;
  let error = "";
  try {
    await sendViaNevarMail(
      { apiKey: "nvm_test", useCaseId: "x" },
      mail,
      failFetch,
    );
  } catch (e) {
    error = (e as Error).message;
  }
  assertStringIncludes(error, "409");
});

Deno.test("templates: the generated module matches email-templates/ and config.toml", async () => {
  const script = new URL(
    "../../../../../../scripts/generate-auth-email-templates.mjs",
    import.meta.url,
  ).pathname;
  const out = await new Deno.Command("node", { args: [script, "--check"] })
    .output();
  assert(out.success, new TextDecoder().decode(out.stderr));
});
