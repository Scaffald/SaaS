/**
 * _shared/nevarmail.ts — the NevarMail client every sender uses.
 *
 * NevarMail is a third-party service from these functions' point of view, so
 * HTTP is a recording fake fetch; the request shapes asserted here are the
 * ones NVS-Mail docs/api-reference.md documents.
 */
import {
  assert,
  assertEquals,
  assertRejects,
  assertStringIncludes,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  createNevarMailClient,
  NEVARMAIL_BATCH_LIMIT,
  NevarMailError,
  nevarMailFromEnv,
  nevarMailUseCase,
  nevarMailWebhookHeaders,
  verifyNevarMailWebhook,
} from "../../../_shared/nevarmail.ts";
import { verifyStandardWebhook } from "../../../_shared/webhook-signature.ts";

type Call = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: unknown;
};

function recorder(
  respond: (call: Call) => Response = () =>
    new Response(JSON.stringify({ data: { ok: true }, requestId: "req_1" }), {
      status: 200,
    }),
) {
  const calls: Call[] = [];
  const fetchImpl = ((url: string, init: RequestInit = {}) => {
    const call: Call = {
      url,
      method: init.method ?? "GET",
      headers: (init.headers ?? {}) as Record<string, string>,
      body: init.body ? JSON.parse(init.body as string) : undefined,
    };
    calls.push(call);
    return Promise.resolve(respond(call));
  }) as unknown as typeof fetch;
  return { calls, fetchImpl };
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status });

Deno.test("send: posts to /api/v1/email/send with the key, the use case and the type, and unwraps data", async () => {
  const { calls, fetchImpl } = recorder(() =>
    json(200, {
      data: {
        id: "em_1",
        messageId: "m_1",
        status: "sent",
        provider: "sendgrid",
        sentAt: "2026-11-23T00:00:00Z",
      },
      requestId: "req_1",
    })
  );
  const client = createNevarMailClient({
    apiKey: "nvm_api_test_x",
    fetch: fetchImpl,
  });
  const result = await client.send({
    to: "worker@example.test",
    useCaseId: "uc-1",
    subject: "Hello",
    html: "<p>Hi</p>",
    emailType: "marketing",
    metadata: { invitationId: "inv-1" },
  });

  assertEquals(result.id, "em_1");
  assertEquals(calls.length, 1);
  assertEquals(calls[0].url, "https://app.nevarmail.com/api/v1/email/send");
  assertEquals(calls[0].method, "POST");
  assertEquals(calls[0].headers.Authorization, "Bearer nvm_api_test_x");
  assertEquals(calls[0].body, {
    to: "worker@example.test",
    use_case_id: "uc-1",
    emailType: "marketing",
    subject: "Hello",
    html: "<p>Hi</p>",
    metadata: { invitationId: "inv-1" },
  });
});

Deno.test("send: defaults to transactional, honours a base URL, and allows a template without a subject", async () => {
  const { calls, fetchImpl } = recorder();
  const client = createNevarMailClient({
    apiKey: "k",
    baseUrl: "https://nevarmail.local/",
    fetch: fetchImpl,
  });
  await client.send({
    to: "a@example.test",
    useCaseId: "uc",
    templateId: "tpl",
    variables: { name: "Jo" },
  });
  assertEquals(calls[0].url, "https://nevarmail.local/api/v1/email/send");
  const body = calls[0].body as Record<string, unknown>;
  assertEquals(body.emailType, "transactional");
  assertEquals(body.templateId, "tpl");
  assertEquals(body.variables, { name: "Jo" });
  assert(!("subject" in body));
});

Deno.test("send: refuses a body-less or subject-less send before any request", async () => {
  const { calls, fetchImpl } = recorder();
  const client = createNevarMailClient({ apiKey: "k", fetch: fetchImpl });
  await assertRejects(() =>
    client.send({ to: "a@example.test", useCaseId: "uc", subject: "S" })
  );
  await assertRejects(() =>
    client.send({ to: "a@example.test", useCaseId: "uc", html: "<p/>" })
  );
  assertEquals(calls.length, 0);
});

Deno.test("errors: NevarMail's code, status and requestId survive, with helpers for the codes callers act on", async () => {
  const cases: Array<[number, string, keyof NevarMailError]> = [
    [429, "DAILY_RAMP_CAP", "isDailyCap"],
    [422, "RECIPIENT_SUPPRESSED", "isSuppressed"],
    [422, "TEST_MODE_RECIPIENT_NOT_ALLOWED", "isTestModeBlocked"],
  ];
  for (const [status, code, flag] of cases) {
    const { fetchImpl } = recorder(() =>
      json(status, { error: `nope: ${code}`, code, requestId: "req_9" })
    );
    const client = createNevarMailClient({ apiKey: "k", fetch: fetchImpl });
    const err = await assertRejects(
      () =>
        client.send({
          to: "a@example.test",
          useCaseId: "uc",
          subject: "S",
          text: "t",
        }),
      NevarMailError,
    );
    assertEquals(err.status, status);
    assertEquals(err.code, code);
    assertEquals(err.requestId, "req_9");
    assertEquals(err[flag], true);
    assertStringIncludes(err.message, String(status));
  }

  const { fetchImpl } = recorder(() =>
    new Response("upstream exploded", { status: 502 })
  );
  const client = createNevarMailClient({ apiKey: "k", fetch: fetchImpl });
  const err = await assertRejects(
    () =>
      client.send({
        to: "a@example.test",
        useCaseId: "uc",
        subject: "S",
        text: "t",
      }),
    NevarMailError,
  );
  assertEquals(err.code, null);
  assertStringIncludes(err.message, "upstream exploded");
});

Deno.test("sendToList: posts the list send as documented", async () => {
  const { calls, fetchImpl } = recorder(() =>
    json(200, {
      data: { id: "s1", status: "sent", sentCount: 3, listId: "l1" },
      requestId: "r",
    })
  );
  const client = createNevarMailClient({ apiKey: "k", fetch: fetchImpl });
  const result = await client.sendToList({
    listId: "l1",
    subject: "Issue 1",
    htmlContent: "<h1>Hi</h1>",
  });
  assertEquals(result.sentCount, 3);
  assertEquals(
    calls[0].url,
    "https://app.nevarmail.com/api/v1/email/send-to-list",
  );
  assertEquals(calls[0].body, {
    listId: "l1",
    subject: "Issue 1",
    htmlContent: "<h1>Hi</h1>",
  });
});

Deno.test("contacts and lists: batches over 1000 are split into separate calls", async () => {
  const { calls, fetchImpl } = recorder();
  const client = createNevarMailClient({ apiKey: "k", fetch: fetchImpl });
  const people = Array.from(
    { length: NEVARMAIL_BATCH_LIMIT + 5 },
    (_, i) => ({ email: `p${i}@example.test` }),
  );

  const added = await client.addToList("list/1", people);
  assertEquals(added.length, 2);
  assertEquals(
    calls[0].url,
    "https://app.nevarmail.com/api/v1/lists/list%2F1/contacts",
  );
  assertEquals((calls[0].body as unknown[]).length, NEVARMAIL_BATCH_LIMIT);
  assertEquals((calls[1].body as unknown[]).length, 5);

  await client.upsertContacts([{ email: "x@example.test", listIds: ["l1"] }]);
  assertEquals(calls[2].url, "https://app.nevarmail.com/api/v1/contacts");
  assertEquals(calls[2].body, [{ email: "x@example.test", listIds: ["l1"] }]);
});

Deno.test("checkSuppression and preferences: query strings and the PUT body use NevarMail's snake_case", async () => {
  const { calls, fetchImpl } = recorder(() =>
    json(200, {
      data: { suppressed: true, canSend: false, reason: "unsubscribe" },
      requestId: "r",
    })
  );
  const client = createNevarMailClient({ apiKey: "k", fetch: fetchImpl });

  const check = await client.checkSuppression("a+b@example.test", {
    useCaseId: "uc",
  });
  assertEquals(check, {
    suppressed: true,
    canSend: false,
    reason: "unsubscribe",
  });
  assertEquals(
    calls[0].url,
    "https://app.nevarmail.com/api/v1/suppressions/check?email=a%2Bb%40example.test&use_case_id=uc",
  );
  assertEquals(calls[0].method, "GET");

  await client.getPreferences("a@example.test", "proj");
  assertEquals(
    calls[1].url,
    "https://app.nevarmail.com/api/v1/preferences?email=a%40example.test&project_id=proj",
  );

  await client.setPreferences({
    email: "a@example.test",
    subscribedListIds: ["l1"],
  });
  assertEquals(calls[2].method, "PUT");
  assertEquals(calls[2].body, {
    email: "a@example.test",
    subscribed_list_ids: ["l1"],
    unsubscribe_all: false,
  });
});

Deno.test("env: no key means no client; use cases come from NEVARMAIL_USE_CASE_<PURPOSE>", () => {
  const env = (vars: Record<string, string>) => (name: string) => vars[name];
  assertEquals(nevarMailFromEnv(env({})), null);
  assert(nevarMailFromEnv(env({ NEVARMAIL_API_KEY: "k" })) !== null);

  assertEquals(
    nevarMailUseCase(
      "notifications",
      env({ NEVARMAIL_USE_CASE_NOTIFICATIONS: "uc-n" }),
    ),
    "uc-n",
  );
  assertEquals(
    nevarMailUseCase(
      "referral_invites",
      env({ NEVARMAIL_USE_CASE_REFERRAL_INVITES: "uc-r" }),
    ),
    "uc-r",
  );
  assertEquals(nevarMailUseCase("newsletter", env({})), null);
  // The auth hook shipped reading NEVARMAIL_USE_CASE_ID; sign-in still accepts it.
  assertEquals(
    nevarMailUseCase("signin", env({ NEVARMAIL_USE_CASE_ID: "uc-s" })),
    "uc-s",
  );
  assertEquals(
    nevarMailUseCase("contact", env({ NEVARMAIL_USE_CASE_ID: "uc-s" })),
    null,
  );
});

// NevarMail signs with the secret's text after `whsec_` as the HMAC key
// (NVS-Mail src/lib/webhooks/sign.ts), not its base64-decoded bytes.
async function nevarMailSign(
  secret: string,
  id: string,
  ts: string,
  body: string,
) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret.replace(/^whsec_/, "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${id}.${ts}.${body}`),
  );
  return `v1,${btoa(String.fromCharCode(...new Uint8Array(mac)))}`;
}

Deno.test("webhooks: a NevarMail delivery verifies; tampered, stale, unsigned or wrong-secret ones do not", async () => {
  const secret = "whsec_Zm9vYmFyLWJhc2U2NHVybC1zZWNyZXQtMzItYnl0ZXM";
  const now = 1_800_000_000;
  const ts = String(now);
  const body = JSON.stringify({
    type: "email.delivered",
    email_id: "em_1",
    recipient: "a@example.test",
  });
  const sig = await nevarMailSign(secret, "wh_1", ts, body);

  const headers = nevarMailWebhookHeaders(
    new Headers({
      "X-Webhook-Id": "wh_1",
      "X-Webhook-Timestamp": ts,
      "X-Webhook-Signature": sig,
    }),
  );
  assert(await verifyNevarMailWebhook(secret, headers, body, now));
  assert(
    !(await verifyNevarMailWebhook(
      secret,
      headers,
      body.replace("em_1", "em_2"),
      now,
    )),
  );
  assert(!(await verifyNevarMailWebhook(secret, headers, body, now + 6 * 60)));
  assert(!(await verifyNevarMailWebhook("whsec_other", headers, body, now)));
  assert(
    !(await verifyNevarMailWebhook(
      secret,
      { ...headers, signature: null },
      body,
      now,
    )),
  );
  assert(!(await verifyNevarMailWebhook("", headers, body, now)));

  // The same signature must NOT pass as a Supabase-style (base64 key) webhook:
  // the two key encodings are not interchangeable.
  assert(
    !(await verifyStandardWebhook(secret, headers, body, {
      keyEncoding: "base64",
      nowSeconds: now,
    })),
  );
});
