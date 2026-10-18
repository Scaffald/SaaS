# Edge functions — what is deployed, and why the rest is not

`scripts/deploy-functions.sh` is the single list of functions that ship to
dev, preview and prod. It warns when a project carries a function that is not
in it. Every directory here is in one of the tables below; a new function goes
into one of them in the same PR that adds it.

Audited 2026-10-16 against the Management API listing of all three projects
(#1155). Before that, `trpc` and four forsured `auth-*` functions were still
deployed months after the code stopped being maintained, and `news-import` —
which the nightly cron calls — had not been redeployed since 2025-11.

## Deployed (in `deploy-functions.sh`)

| Function | Called by |
|---|---|
| `api` | The app and SDK — the REST API (`/v1/...`) |
| `job-import`, `news` | Job and news feeds |
| `news-import` | pg_cron `import-news-articles`, nightly, via `core.import_news_articles()` (migration 377). Service-role Bearer only. |
| `notify-publish`, `notify-send-worker`, `notify-check-receipts`, `notify-digest-daily`, `notify-digest-weekly`, `notify-background-check-expiration`, `notify-id-verification-expiration` | pg_cron (migration 337, Vault secrets) and internal callers. Service-role Bearer only (`_shared/notifications/auth.ts`). |
| `send-team-invitation` | Team invitation email |
| `webhooks-email` | Resend delivery events (Svix-signed). Entry point for `webhooks/email/index.ts`. |
| `stripe-webhook`, `payments-reconcile` | Stripe events; pg_cron reconcile backstop (migration 362) |
| `account-deletion-process` | pg_cron `account-deletion-process`, daily, via `core.run_account_deletion_processor()` (migration 391). Carries out deletion requests past their grace period (#1313). Service-role Bearer only. |

## In the repo, deliberately not deployed

| Function | Status | Deploy when |
|---|---|---|
| `persona-webhook` | Receiver for Persona ID-verification events. No `PERSONA_*` secret on any project — the integration is not live. | Persona is configured. Add it to the script and register the URL in Persona. |
| `background-check-webhook` | Receiver for NationSearch background-check events (`x-nationsearch-signature`). No provider secret on any project. | The background-check provider is configured. |
| `webhooks/push`, `webhooks/sms` | Delivery callbacks for push and Twilio SMS. Neither channel has credentials on any project. They need a top-level wrapper (like `webhooks-email`) before they can be deployed at all. | Push / SMS sending is turned on. |
| `ccpa-deadline-check` | Daily CCPA deadline alerts. Never deployed and no cron schedules it, though users can submit CCPA requests in the app — #1238. | Before the first CCPA request needs answering. |
| `community-moderate`, `community-ai-summary` | Phase 3 of community. The post submit endpoint currently auto-approves (`community-posts.ts`, "moderation service pending"). | Phase 3 moderation is built. |
| `trpc` | Legacy. The app talks to `api`. Undeployed everywhere 2026-10-16 (#1233). The code is still referenced by the app's tsconfig/babel aliases, `scf-core/utils/api.ts`, the contracts workflow and older suites under `tests/routers`, so removing it is its own change. | Never — delete once those references are gone. |

## Removed

- `auth-session`, `auth-token-exchange`, `auth-refresh`, `auth-logout`, `_shared/auth/` — forsured session store (#1150, #1236).
- `email-inbound-parse`, `inbound-conversation-email` — forsured no-ops, undeployed and deleted 2026-10-16.
