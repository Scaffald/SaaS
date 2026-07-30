# Resend — outbound email

Resend is the single transport for every email the product sends. Nothing
else sends mail as `scaffald.com`.

| Surface | Code | Runtime |
| --- | --- | --- |
| Notification emails (background checks, ID verification, policy renewals, digests) | `packages/supabase/functions/_shared/notifications/adapters/email.ts` | Supabase edge functions |
| Team invitations | `packages/supabase/functions/send-team-invitation/index.ts` | Supabase edge functions |
| Marketing contact form | `apps/scaffald/app/api/contact+api.ts` | EAS Hosting |
| Delivery status events | `packages/supabase/functions/webhooks/email/index.ts` | Supabase edge functions |

Human mail (`clay@unicorn.love` and friends) is Google Workspace and has
nothing to do with any of this.

## Domain

`scaffald.com` is verified in the `unicorn` Resend team, region `us-east-1`.
Sending address is `notifications@scaffald.com`.

Three DNS records in Route53 zone `Z03807932GT9W30LQ0T67`:

```
resend._domainkey.scaffald.com  TXT  p=MIGfMA0GCSqG…      DKIM
send.scaffald.com               TXT  v=spf1 include:amazonses.com ~all
send.scaffald.com               MX   10 feedback-smtp.us-east-1.amazonses.com
```

**The apex SPF record is not involved and must not be widened.** Resend sets
the envelope sender to the `send.scaffald.com` subdomain, so SPF is evaluated
there; DMARC aligns to the apex through the DKIM signature instead. Adding
`include:amazonses.com` to the apex would authorize a large shared pool for
no benefit and spend one of SPF's ten DNS lookups.

The apex TXT record set holds SPF, two `google-site-verification` values, and
the Resend ownership token. Route53 stores all TXT values for a name as one
record set, so **any change has to rewrite the whole set** — an `UPSERT` with
only the new value silently deletes SPF.

To rebuild the DNS from scratch, or to add another domain:

```bash
pnpm tsx scripts/setup-resend.ts --domain scaffald.com --dry-run
```

It is idempotent, and needs a `Full access` Resend key because it manages
domains rather than just sending.

## The API key

One key, set in three places. They are separate runtimes and share nothing.

```bash
# 1. Local development
echo 'RESEND_API_KEY=re_...' >> .env

# 2. Supabase edge functions — notifications, invitations, webhook
SUPABASE_ACCESS_TOKEN="$(grep -m1 '^SUPABASE_PAT=' .env | cut -d= -f2-)" \
npx supabase secrets set \
  RESEND_API_KEY="$(grep -m1 '^RESEND_API_KEY=' .env | cut -d= -f2-)" \
  --project-ref qmfmpcyxsihhfttvqpbw

# 3. EAS Hosting — the contact form. Repeat per environment.
cd apps/scaffald
npx eas-cli@latest env:set --name RESEND_API_KEY \
  --value "$(grep -m1 '^RESEND_API_KEY=' ../../.env | cut -d= -f2-)" \
  --type string --visibility sensitive --scope project \
  --environment production --non-interactive
```

**Use `--visibility sensitive`, not `secret`.** A `secret` variable is only
decryptable inside the EAS *build* environment, so the EAS Hosting worker
receives nothing and `process.env.RESEND_API_KEY` is undefined at runtime —
the deploy succeeds and the API route returns 503. `sensitive` is still
hidden from the UI and from logs. The mistake is not recoverable in place:
`env:update --visibility` on a secret variable fails with "type == SECRET
can't be decrypted", so the variable has to be deleted and re-set.

**Deploy with `--environment`.** `--prod` and `--alias` choose which URL the
deployment is promoted to; they do not load environment variables. Without
`--environment production` the worker starts with none:

```bash
npx eas-cli@latest deploy --prod --environment production --non-interactive
```

**`supabase secrets` needs `SUPABASE_ACCESS_TOKEN` set explicitly.** Unlike
`projects list` and `functions list`, which happily use the CLI's stored
login, the `secrets` subcommand fails with

```
Invalid access token format. Must be like `sbp_0102...1920`.
```

before it makes any network call. This repo keeps the token in `.env` as
`SUPABASE_PAT`, not `SUPABASE_ACCESS_TOKEN`, which is why the mapping above
is needed. The error names a format problem, so it reads like a corrupt
token — the token is fine, the CLI just is not finding one.

Pull values out of `.env` individually rather than `set -a; . ./.env`.
Sourcing the whole file exports several dozen variables into the command's
environment, and some of them collide with names the tooling reads.

**EAS Hosting reads environment variables at deploy time, not request time.**
Setting the variable changes nothing until the next `eas deploy`.

## Webhook

Resend delivery events (`email.delivered`, `email.bounced`, `email.opened`, …)
post to the `webhooks/email` function, which matches them to
`notification_deliveries` on `provider_msg_id` — the id Resend returns from
the send call.

The handler **rejects every event unless `RESEND_WEBHOOK_SECRET` is set** and
the Svix signature verifies. That is deliberate: the endpoint writes delivery
statuses, and the previous SendGrid version accepted them from anyone who
found the URL. Failing closed on a missing secret is the right default — the
cost is silence in delivery tracking, not lost email.

Get the secret when creating the endpoint at https://resend.com/webhooks
(it looks like `whsec_…`), then:

```bash
npx supabase secrets set RESEND_WEBHOOK_SECRET=whsec_... --project-ref qmfmpcyxsihhfttvqpbw
```

## Optional overrides

| Variable | Default |
| --- | --- |
| `RESEND_FROM_EMAIL` | `notifications@scaffald.com` |
| `RESEND_FROM_NAME` | `Scaffald` |
| `CONTACT_FORM_TO` | `hello@scaffald.com` |
| `CONTACT_FORM_FROM` | `notifications@scaffald.com` |

Any From address must be on a verified Resend domain.

## Testing without sending

Resend has fixed test recipients: `delivered@resend.dev`, `bounced@resend.dev`
and `complained@resend.dev`. Sending to those exercises the real API and the
real webhook path without touching a live inbox — worth using for delivery
tracking work, since the events flow through exactly as they would in
production.

## What this replaced

SendGrid, which was referenced in three separate senders but never had an API
key in any environment — so no notification email had ever been delivered in
production. See `docs/setup/REQ-13-sendgrid-inbound-setup.md` for the inbound
parse setup, which is a separate concern and still describes SendGrid.
