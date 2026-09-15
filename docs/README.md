# Documentation

Project context for agents lives in [AGENTINFO.md](../AGENTINFO.md) and the
per-pillar constraint docs under [.radium/](../.radium/README.md). Findings from
audits and investigations are GitHub Issues, not files here (see the root
[CLAUDE.md](../CLAUDE.md)).

## Guides

- [Testing guide](TESTING.md) — test commands, hooks, hand-run scripts, CI
- [API testing guide](API_TESTING_GUIDE.md) — REST API local testing with curl, health checks, auth

## Operations

- [Deployment infrastructure](setup/DEPLOYMENT.md) — DNS, AWS, Supabase branches, CI/CD, GitHub secrets
- [Resend](setup/RESEND.md) — outbound email transport
- [SendGrid inbound parse](setup/REQ-13-sendgrid-inbound-setup.md) — inbound email (outbound moved to Resend)
- [AWS CNAME reclaim](setup/AWS-CNAME-RECLAIM.md) — historical, resolved
- [SSR deploy and apex cutover](agents/SSR-DEPLOY.md) — how scaffald.com came to serve the SSR app, and the follow-ups
- [Release process](agents/RELEASE-PROCESS.md) — version tagging across git, the tracker, and TestFlight
- [Auth runbook](agents/auth-runbook.md) — Apple secret rotation, Google OAuth verification, common breakages
- [Tracking](agents/TRACKING.md) — GitHub Issues, labels, and the project board

## Plans and designs

Design specs and architecture proposals (intent, not findings):

- [ATS](plans/ATS/) — the 2026-09-10 redesign brief plus the March design docs and prototypes it builds on
- [Redesign](plans/redesign/) — prototype-parity plan and capture tooling
- [designs/](designs/) — one-off visual explorations

## Package docs

- **Scaffald SDK**: [packages/sdk/docs/](../packages/sdk/docs/) — getting started, API reference, hooks, OAuth, webhooks
- **@scaffald/ui**: [packages/ui/](../packages/ui/) — README, ARCHITECTURE, STYLING_GUIDE
- **Supabase**: [packages/supabase/docs/](../packages/supabase/docs/) — seeding, schema decisions, O*NET, remote reset
