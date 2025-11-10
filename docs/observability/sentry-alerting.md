# Sentry Alert Configuration Checklist

This checklist captures the alerting model defined in BrainGrid REQ-96. Follow these steps in [sentry.io](https://sentry.io/) once the DSNs and integrations are in place.

## 1. Connect Slack
- Navigate to **Settings → Integrations → Slack**.
- Add the workspace and grant Sentry access to the `#engineering` channel.
- Send a test message to confirm connectivity.

## 2. Standard Alert Rules
Create the following project-level alert rules (Environment: `production`):

| Rule | Conditions | Actions |
| ---- | ---------- | ------- |
| **Critical Application Errors** | Event type: Error<br/>Tag `procedure` contains `applications.submit` or `applications.update` | Slack `#engineering`, Email `engineering@scaffald.com`, 5‑minute rate limit |
| **Error Rate Spike** | Error count > 10 in 1 minute | Slack `#engineering`, Email `engineering@scaffald.com`, 15‑minute rate limit |
| **New Error Type Detected** | Issue is new AND level is error/fatal | Slack `#engineering`, no rate limit |
| **Performance Degradation** | Transaction P95 > 3000 ms for 5 minutes | Slack `#engineering`, Email `engineering@scaffald.com`, 30‑minute rate limit |
| **Database Errors** | Message contains `database`, `postgres`, or `supabase` | Slack `#engineering`, Email `engineering@scaffald.com`, 5‑minute rate limit |
| **Auth System Failures** | Tag `procedure` contains `auth`/`session` AND code `INTERNAL_SERVER_ERROR` | Slack `#engineering`, Email `engineering@scaffald.com`, 5‑minute rate limit |

## 3. Email Fallbacks
- In **Settings → Notifications**, add `engineering@scaffald.com`.
- Enable weekly digest emails for medium/low-priority issues.

## 4. Issue Ownership
Define ownership rules under **Project Settings → Issue Owners**:
```
path:packages/supabase/functions/* @backend-team
path:apps/expo/* @frontend-team
path:packages/core/* @frontend-team
tag:procedure:applications.* @applications-team
tag:procedure:auth.* @auth-team
```

## 5. Runbook
1. Trigger a synthetic failure (e.g., cause a controlled `applications.submit` error).
2. Verify Slack + email notifications arrive within one minute.
3. Acknowledge the alert in Sentry and document remediation in the linked ticket/PR.

> After completing the checklist, update BrainGrid REQ-96 with the alert configuration date and any deviations from the defaults above.

