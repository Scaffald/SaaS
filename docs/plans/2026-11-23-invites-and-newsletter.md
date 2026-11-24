# NevarMail everywhere, invite a friend, invite-led onboarding, and a newsletter

Status: proposal (2026-11-23). Epic #1399, milestone v1.29.0. Audience: Job Seekers (workers) first; employers later.

Two pieces of work, in order:

- **Part A** moves every outbound email from Resend (and prod's SendGrid SMTP for auth) to NevarMail, on local, dev, preview and prod.
- **Part B** builds invites, invite-aware onboarding, the newsletter and the list-import script on top of NevarMail.

## What exists today

| Piece | State | Evidence |
|---|---|---|
| Worker-to-friend invites | **None** | No route, screen or SDK hook |
| Team / org invitations | Live, org-scoped, emailed through Resend | `functions/send-team-invitation/index.ts:13` |
| Invitations to apply | Planned, employer → worker | #1221, #1262 |
| Generic invitation tables | Schema only, nothing reads or writes them | `migrations/221_generic_invitation_system.sql` |
| Newsletter / mailing list | **None** | — |
| Marketing consent | A type in `public.consent_records` only | `342_versioned_legal_documents.sql:119` |
| Notification email | Resend | `_shared/notifications/adapters/email.ts:13` |
| Contact form (web server route) | Resend, key from EAS env | `apps/scaffald/app/api/contact+api.ts:13`, `scripts/set-resend-eas-env.sh` |
| Delivery-event webhook | Resend / Svix | `functions/webhooks/email/index.ts:67`, shim `functions/webhooks-email` |
| Auth email | NevarMail hook live on **dev only**; preview is broken (#1360); prod still uses SendGrid SMTP | `functions/auth-email-hook`, `docs/agents/auth-email-hook.md` |
| Resend domain tooling | `scripts/setup-resend.ts` | — |
| SMS transport | Twilio adapter; needs `TWILIO_*` secrets | `_shared/notifications/adapters/sms.ts` |

## What NevarMail gives us (from `NVS-Mail/docs/api-reference.md`)

- `POST /api/v1/email/send`: a single send, `emailType: transactional | marketing`, `use_case_id`, `metadata`, or `templateId` + `variables`.
- `POST /api/v1/email/send-to-list`: list sends (the newsletter), checked as a whole against the warm-up daily cap (`429 DAILY_RAMP_CAP`).
- **Lists and contacts** (`/api/v1/lists`, `/lists/{id}/contacts`, `/contacts`, up to 1000 per call), with a hosted unsubscribe page per list.
- **Suppressions** for the whole org, **enforced on every send** (hard bounce, complaint, unsubscribe, manual), plus `GET /suppressions/check` and bulk add.
- **Preferences** (`GET|PUT /api/v1/preferences`): set a recipient's opt-in or opt-out per list, from our settings screen.
- **Marketing sends get the CAN-SPAM footer and RFC 8058 `List-Unsubscribe` headers** added by NevarMail; the project address comes from `PUT /projects/{id}/address`.
- **Webhook endpoints** (`/api/v1/webhook-endpoints`), signed the Standard Webhooks way (`X-Webhook-Id/Timestamp/Signature`, `v1,` HMAC-SHA256). One difference from Supabase's hook: NevarMail keys the HMAC with the secret's text after `whsec_`, not its base64-decoded bytes. Payloads carry `email_id` (the send's returned `id`), not our `metadata`. Events: `email.sent|delivered|deferred|bounced|dropped|opened|clicked|complained|unsubscribed`, `contact.suppressed`.
- **Use cases**: a typed sending purpose, each with its own sender, filed per send.
- **Test-mode keys** (`nvm_api_test_…`) deliver only to the org's test allow-list. Local runs and CI use one.
- **Not offered:** SMS, and campaign creation over the API (campaigns are read-only in v1; `send-to-list` covers the newsletter).

## Ground rules that shape the design

- **We don't text imported lists.** Under TCPA, an invite or marketing text sent by us needs the recipient's prior express written consent. Phone invites therefore go out **from the inviter's own phone** (share sheet or a prefilled `sms:` link). Scaffald generates the link and tracks the signup. NevarMail doesn't do SMS; Twilio remains only for numbers that opted in themselves.
- **Invites are sent as `emailType: "marketing"`.** A personal invite is still a commercial message, so it gets NevarMail's unsubscribe footer, `List-Unsubscribe` header and suppression check automatically. Notifications, sign-in and team invites stay `transactional`.
- **NevarMail owns suppression.** We don't keep our own suppressions table; every send is checked there, and the script calls `/suppressions/check` to show a preview.
- **An invite does not subscribe anyone to the newsletter.** That is a separate opt-in.
- **Recipients never get an account.** An invite is a link; the person becomes a user only by signing in themselves.

---

## Part A: Resend → NevarMail on every environment

### A0. NevarMail setup (dashboard, once)

- Unicorn org in **live** mode. Set the project postal address (CAN-SPAM footer).
- Sending domain: `mail.scaffald.com` is already verified. Senders: `signin@` (exists), `notifications@`, `invites@`, `hello@` (contact form and newsletter), all `@mail.scaffald.com`. Switching from `notifications@scaffald.com` changes the From address users see, so check whether the apex `scaffald.com` should be verified in NevarMail instead (decision below).
- Use cases, one per purpose: `scaffald-signin` (exists, `fc1f51bc-…`), `scaffald-notifications`, `scaffald-team-invites`, `scaffald-contact`, `scaffald-referral-invites` (marketing), `scaffald-newsletter` (marketing).
- One **live** org API key per deployed environment (dev / preview / prod) and one **test** key for local and CI. Keep them separate so each can be revoked on its own.
- One webhook endpoint per environment → `https://<ref>.supabase.co/functions/v1/webhooks-email` (events above).

### A1. Shared client: `functions/_shared/nevarmail.ts`

Move `sendViaNevarMail` out of `_shared/auth-email-hook.ts` and extend it into a small client: `send`, `sendToList`, `upsertContacts`, `addToList`, `checkSuppression`, `getPreferences`/`setPreferences`, and `verifyWebhook` (Standard Webhooks; reuse the hook's verifier). Configuration comes from env: `NEVARMAIL_API_KEY`, `NEVARMAIL_BASE_URL`, plus one `NEVARMAIL_USE_CASE_<PURPOSE>` variable per use case. Unit tests stub `fetch`, the way `auth-email-hook.test.ts` does.

### A2. Callers

- `_shared/notifications/adapters/email.ts` → `nevarmail.send` (transactional, `scaffald-notifications`). Store the `id` the send returns on the delivery row: NevarMail webhooks identify a message only by that `email_id`, not by our `metadata`.
- `send-team-invitation` → `nevarmail.send` (transactional, `scaffald-team-invites`).
- `apps/scaffald/app/api/contact+api.ts` → NevarMail over plain `fetch` (it runs in the EAS worker, not Deno). Replace `scripts/set-resend-eas-env.sh` with `set-nevarmail-eas-env.sh` (`NEVARMAIL_API_KEY`, `NEVARMAIL_USE_CASE_CONTACT`).
- `webhooks/email` → verify the NevarMail signature and map NevarMail events onto the same delivery-status updates the Resend handler made, matching the event's `email_id` to the stored id. The `webhooks-email` shim stays.

### A3. Auth email on every environment

Turn the `auth-email-hook` on for **preview** (this closes #1360) and **prod** (replacing SendGrid SMTP), following `docs/agents/auth-email-hook.md`. Then remove the SMTP settings so there is no silent fallback. For local, point `config.toml`'s `[auth.hook.send_email]` at the local function with the test key, so local sign-in mail also goes through NevarMail; Inbucket stays available as the fallback when the hook is off.

### A4. Remove Resend

Delete `scripts/setup-resend.ts`, `set-resend-eas-env.sh`, `RESEND_*` function secrets and EAS env vars, the Resend comment in `.github/workflows/deploy-web.yml`, and Resend's DNS records (`send.scaffald.com` MX/SPF, `resend._domainkey`) once nothing has used them for a week. Update AGENTINFO, the `.radium/supabase-backend.md` note on email transport, and `docs/agents/auth-email-hook.md` (now just "email through NevarMail").

Rollout order: A1+A2 deploy to dev → check notifications, team invites, contact form and webhooks on dev → preview → prod at the next release; A3 can go alongside; A4 only after prod has run on NevarMail for a week.

---

## Part B: invites, onboarding, newsletter

### B1. Data (migration, next free number at implementation time)

Reuse `core.generic_invitations`:

- `invitee_email` becomes nullable; add `invitee_phone TEXT` (E.164), `kind TEXT CHECK (kind IN ('targeted','link'))`, `channel TEXT CHECK (channel IN ('email','sms_self','share','import'))`, `source TEXT` (e.g. `app`, `script:crew.csv`), `nevarmail_email_id TEXT`, `reminder_sent_at`. Add `CHECK (invitee_email IS NOT NULL OR invitee_phone IS NOT NULL OR kind = 'link')`.
- Seed an `invitation_rules` row `worker → worker`, `relationship_type = 'referral'`.
- `core.users.referral_code TEXT UNIQUE`: one reusable personal link per user (`scaffald.com/i/<code>`), backfilled.
- `core.referral_attributions (user_id PK, invitation_id, referrer_id, landed_at, signed_up_at, onboarded_at)`.
- `core.newsletter_signups (email PK, user_id NULL, status pending|confirmed, confirm_token, source, requested_at, confirmed_at, ip)`: only the double opt-in step for anonymous signups. Confirmed members of the list live in NevarMail; members' opt-in is also written to `consent_records` (`marketing_communications`).
- No suppressions table; NevarMail owns that.
- RLS: inviters read their own invites; everything else is service-role only, with explicit grants.

### B2. API (`functions/api/routes/invites.ts`, `newsletter.ts`)

SDK-facing routes return bare bodies (no `{data}` wrapper):

- `POST /v1/invites`: `{ contacts: [{name?, email?, phone?}], message? }`. Email contacts are sent through `nevarmail.send` (marketing, `scaffald-referral-invites`, NevarMail `templateId` + variables: inviter name, avatar, personal message, link), storing the returned `id` in `nevarmail_email_id`. Phone-only contacts come back with `smsUrl` + `shareText`. Limits: 50 per request, 200 per user per day. Skips existing members and anyone this user invited in the last 14 days; NevarMail drops suppressed addresses (returned as `skipped: suppressed`).
- `GET /v1/invites`: my invites + counts (sent / joined / onboarded). `GET /v1/invites/link`: personal link + share text.
- `GET /v1/invites/:code/preview` (public): inviter first name + avatar only.
- `POST /v1/invites/claim`: after first sign-in; writes the attribution, marks the invite accepted, notifies the inviter.
- `POST /v1/newsletter/subscribe` (public, rate-limited): members are added to the NevarMail list straight away; anonymous emails get a `newsletter_signups` row and a confirm email. `GET /v1/newsletter/confirm?token=` adds them to the list. Unsubscribing uses NevarMail's hosted page and one-click header, so we build no unsubscribe route.
- `GET|PUT /v1/newsletter/preference` (signed in): proxies NevarMail preferences, so the settings toggle and the hosted page can't disagree.
- `webhooks-email` also handles invite events: `email.opened/clicked` → invite tracking columns, by matching `email_id` to `nevarmail_email_id`.
- A reminder cron sends one reminder after 5 days to pending targeted email invites, never more. (NevarMail sequences could do this later; a cron keeps it testable locally.)

### B3. App (scf-core + apps/scaffald, routes in `constants/routes.ts`)

- **Landing `/i/[code]`** (public, SSR): "Clay invited you to Scaffald", inviter avatar, a one-line value prop for job seekers, email field → magic link. The code is kept in `localStorage`/a cookie **and** added to `redirectTo`, so it survives a device or browser switch.
- **Claim on first session** in `AuthStateChangeHandler`, then the stored code is cleared.
- **Invite-aware onboarding**: the welcome step names the inviter. The final step, "Invite your crew" (skippable), offers contacts on native (`expo-contacts`, permission asked only on tap) or paste on web, plus Share link. The newsletter checkbox is on the same step, unticked.
- **Ongoing entry points**: "Invite your crew" in the account menu and on the worker home; a newsletter toggle in Settings → Notifications; an inviter status list (Invited / Joined / Set up profile).
- **Public footer**: newsletter email field (double opt-in).
- SDK: `invites` + `newsletter` resources and hooks (submodule PR + pointer bump).

### B4. Newsletter sending: `scripts/newsletter-send.ts`

`--issue path.md --env prod [--test you@…]`: renders Markdown into the shared email layout, then calls `nevarmail.sendToList` (marketing, `scaffald-newsletter`). NevarMail adds the footer and unsubscribe headers and enforces suppression. A `newsletter_sends` row per issue keeps re-runs idempotent. `--test` sends a single copy to one address with `send`. If the list is larger than the warm-up cap, the script reports the 429 and sends nothing.

### B5. Clay's list import: `scripts/invite-list.ts`

```bash
pnpm tsx scripts/invite-list.ts --file ~/lists/crew.csv --env dev
```

```bash
pnpm tsx scripts/invite-list.ts --file ~/lists/crew.csv --env prod --send --as clay@… --limit 50
```

- **Input**: CSV or a Google Contacts export. Columns are matched loosely: `name|first,last`, `email`, `phone`, `tags`, `note`.
- **Normalises**: emails lower-cased, phones → E.164 (`libphonenumber-js`, default US), deduped within the file.
- **Classifies** each row as new / already a member / already invited / suppressed (`nevarmail.checkSuppression`) / invalid. Prints a summary first.
- **Dry run by default**; `--send` sends. `--env prod` also asks you to type the count to confirm.
- **Sends through `POST /v1/invites`** as the named inviter (admin-minted session), so it uses the same template, limits and tracking as the app. `source = script:<file>`. Throttled; `--limit`; safe to stop and re-run. Stops cleanly on NevarMail's `DAILY_RAMP_CAP` and says how many are left for tomorrow.
- **Phone-only rows are never texted.** They're written to `out/<file>-links.csv` with name, phone, personal link and ready-to-send text, so you can text them yourself.
- **Output**: a results CSV + tally; `--report` later shows who joined.
- **Never** adds anyone to the newsletter list.

## Phases → issues

| # | Issue | Work | Depends on |
|---|---|---|---|
| A0 | #1387 | NevarMail setup: live mode, address, senders, use cases, keys, webhook endpoints | — (Clay, dashboard) |
| A1 | #1388 | `_shared/nevarmail.ts` client + tests | — |
| A2 | #1389 | Notifications adapter, team invites, contact form, webhook handler → NevarMail | A1 |
| A3 | #1390 | Auth email hook on preview + prod + local; SMTP removed | A0 |
| A4 | #1391 | Remove Resend (code, secrets, EAS env, DNS, docs) | A2, A3 live on prod for a week |
| B1 | #1392 | Invite / attribution / newsletter migration | — |
| B2 | #1393 | `invites` routes + invite template + webhook mapping + API tests | A1, B1 |
| B3 | #1394 | `scripts/invite-list.ts` | B2 |
| B4 | #1395 | `/i/[code]` landing + code through magic link + claim | B2 |
| B5 | #1398 | In-app inviting: onboarding step, menu entry, contacts, share, status list, SDK | B2, B4 |
| B6 | #1396 | Newsletter: subscribe/confirm/preference routes, footer form, settings toggle, `newsletter-send.ts` | A1, B1 |
| B7 | #1397 | Reminder cron + "your friend joined" notification | B2 |

Fastest route to your lists: A0 → A1 → B1 → B2 → B3 + B4. The in-app work (B5) and the newsletter (B6) follow.

## Decisions (Clay)

1. Sender domain: `@mail.scaffald.com` (already verified) or verify the apex `scaffald.com` in NevarMail so mail keeps `notifications@scaffald.com`?
2. Invite signature: personal ("Clay from Scaffald", `clay@mail.scaffald.com`) or brand?
3. Incentive for invites: none at launch, or a reward once the friend finishes onboarding?
4. List sizes, and any Canadian recipients (CASL)? This decides how long the warm-up cap takes to clear your lists.
