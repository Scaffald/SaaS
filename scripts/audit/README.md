# scripts/audit/

Audit tooling for the Scaffald mobile app.

## Reusable

| Script | Purpose |
|---|---|
| [`ui-sweep.mjs`](ui-sweep.mjs) | Playwright walk of every route in `apps/scaffald/app/` at a given viewport. Login via UI, save storageState, then capture each route. Output: `docs/agents/audits/<date>-ui-audit/` of screenshots + manifest. |

### Prerequisites (all four, or you capture the onboarding gate instead of real screens)

1. **A backend the seed creds exist in.** The sweep logs in as
   `clay@unicorn.love` / `password123` — those are the **local** seed creds.
   So bring up local Supabase first: `pnpm supa start` (needs Docker running)
   and confirm `http://localhost:54321/auth/v1/health` answers. Override the
   target with `AUDIT_EMAIL` / `AUDIT_PASSWORD` if pointing elsewhere.
1b. **The `api` edge function must be served** — `pnpm supa functions serve api`
   in a separate terminal. `pnpm supa start` brings up auth + db but **not**
   reliably the api function (the edge runtime container is often stopped).
   Login works without it (that's core auth), but every protected route's
   prerequisites check then fails and the guard redirects to `/onboarding` —
   so the sweep silently captures the onboarding gate on every route. The
   harness now preflights `…/functions/v1/api/v1/health` and aborts with this
   instruction if it's not 200.
2. **Dev server started from the app, not the repo root.** `expo` resolves its
   entrypoint from the cwd's `package.json`. The root has no `main`, so a bare
   `expo start` there bundles `expo/AppEntry.js` → fails on `../../App`. Start
   it from the app package: `pnpm web` (= `expo start --web` in `apps/scaffald`,
   `main: expo-router/entry`).
3. **The web bundle is warm OR you accept a slow first run.** The first request
   triggers a cold Metro compile (8k+ modules, 60-90s). The login `waitFor` now
   tolerates this (`AUDIT_LOGIN_TIMEOUT`, default 90s); to skip the wait, warm
   it first by loading `http://localhost:8081` once.

Then run the sweep from the repo root (where `node_modules` lives):

```bash
node scripts/audit/ui-sweep.mjs
# or, from a worktree:
node .claude/worktrees/<wt>/scripts/audit/ui-sweep.mjs
```

Env overrides: `AUDIT_BASE_URL`, `AUDIT_OUT`, `AUDIT_EMAIL`, `AUDIT_PASSWORD`,
`AUDIT_LOGIN_TIMEOUT`, `AUDIT_HEADFUL=1` (watch the browser).

A clean failure now tells you which prerequisite is missing — e.g. "auth
backend error visible on page. Is `pnpm supa start` running?" instead of a
bare 30s timeout.

## Dated subfolders — one per audit run

Each audit run gets a dated folder for the one-off filing scripts. They're
not parameterized — they encode the specific Task IDs / finding IDs from that
particular pass. Keep them around as the audit log.

```
audit/
  ui-sweep.mjs              # reusable
  2026-05-26/
    file-findings.ts        # filed 19 findings as in-product Tasks
    create-linear-tickets.mjs   # created SC-77 through SC-89
```

To kick off a new audit:

1. Run `ui-sweep.mjs` → produces screenshots.
2. Hand-write `findings.md` after walking each.
3. Copy a previous date's filing scripts to today's date, swap the finding
   list + Task ID mapping, and run.
