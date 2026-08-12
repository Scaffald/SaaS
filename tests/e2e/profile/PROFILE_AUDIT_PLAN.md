# Profile pages audit – magic link + Mailpit

## What was added

1. **Mailpit helper** ([tests/infrastructure/playwright/playwright-helpers/playwright-helpers/mailpit.ts](tests/infrastructure/playwright/playwright-helpers/playwright-helpers/mailpit.ts))
   - `getLatestEmailFromMailpit(recipient, timeoutMs)` – polls Mailpit API for the latest message to that recipient.
   - `extractMagicLinkFromEmailHtml(html)` – parses Supabase magic link from email HTML.

2. **Profile audit spec** ([tests/e2e/profile/profile-audit-magiclink.spec.ts](tests/e2e/profile/profile-audit-magiclink.spec.ts))
   - Signs in via magic link: open `/auth`, enter email, click “Send magic link”, poll Mailpit, open link, wait for dashboard (or onboarding then dashboard).
   - Visits each profile and settings route and records:
     - HTTP status and final URL
     - Console errors
     - Load time and a short body text snippet
   - Prints a summary and fails the test if any route has issues.

3. **Playwright config**
   - `**/profile-audit-magiclink.spec.ts` added to `testMatch` so this spec is included in the default run.

## Prerequisites

- **App (Expo web)** on `http://localhost:8081` (e.g. `pnpm web`).
- **Supabase** local: `pnpm supa start` (Kong, Auth, Mailpit, etc.).
- **API function**: `pnpm supa functions serve api`.
- **Test user** that can receive magic link emails (e.g. `test@example.com` from seed `002a_seed-api-test-user.sql`). Set `PROFILE_AUDIT_EMAIL` if you use a different address.

## How to run the audit

```bash
# From repo root, with app + Supabase + Mailpit + API running:
pnpm exec playwright test tests/e2e/profile/profile-audit-magiclink.spec.ts --project=chromium
```

The test has a 2‑minute timeout. For a slow or cold run, increase it:

```bash
pnpm exec playwright test tests/e2e/profile/profile-audit-magiclink.spec.ts --project=chromium --timeout=180000
```

Optional: use a dedicated email for the run:

```bash
PROFILE_AUDIT_EMAIL=your-test-user@example.com pnpm exec playwright test tests/e2e/profile/profile-audit-magiclink.spec.ts --project=chromium
```

## Routes covered

The profile IA was consolidated from nine screens to four; six old paths are now
redirect stubs. These are the live routes, and the ones this audit visits:

- `/profile` (overview)
- `/profile/resume` — General Information, Employment Preferences, Resume Import
- `/profile/skills` — Skills, Certifications
- `/profile/experience` — Work Experience, Education
- `/profile/verification` — ID Verification, Background Check
- `/profile/resume/review` — resume import wizard
- `/profile/background-check`, `/profile/background-check/initiate`
- `/dashboard/settings`, `/dashboard/settings/general`,
  `/dashboard/settings/security`, `/dashboard/settings/notifications`

Redirect stubs, kept working for old links but not worth auditing directly —
they resolve to the routes above:

| stub | resolves to |
|---|---|
| `/profile/general` | `/profile/resume` |
| `/profile/employment` | `/profile/resume` |
| `/profile/import-review` | `/profile/resume` |
| `/profile/education` | `/profile/experience` |
| `/profile/certifications` | `/profile/skills` |
| `/profile/id-verification` | `/profile/verification` |

This list previously named `/dashboard/profile/*`, a URL space the app has never
served under that prefix, and half its entries were screens that no longer exist
(#592).

## Using the results to fix issues

1. **Run the audit** with the app and backend up; note the “Profile audit summary” in the test output (and any failure message).

2. **Interpret the summary**
   - **OK** – Route loaded with no recorded console errors.
   - **Issues** – For each path you get `status`, `statusCode`, and a count of console errors (with up to 3 error lines). Use these to decide what to fix.

3. **Common fixes**
   - **status = redirect** – Route may be protected and redirect to login or onboarding. Confirm auth and prerequisites (e.g. `ensureProfileComplete`) in the test or in the app.
   - **statusCode 4xx/5xx** – Check API or data for that screen (tRPC/REST, permissions, missing data).
   - **Console errors** – Fix the reported errors in the relevant profile/settings components or their hooks (e.g. bad keys, missing null checks, failed requests).

4. **Plan template for “resolve profile page issues”**
   - List each route that had `status !== 'ok'` or `consoleErrors.length > 0`.
   - For each route: (a) reproduce locally (magic link → dashboard → that route), (b) fix the underlying bug (network, auth, or component), (c) re-run the audit to confirm the route is OK.
   - Optionally extend the spec (e.g. more assertions, a11y, or saving the summary to a file) once the baseline is green.

## If the test times out

- Confirm the app is reachable at `http://localhost:8081` and the auth page loads.
- Confirm Supabase (and Mailpit) are running and that the test user exists; check Mailpit at `http://127.0.0.1:54324` for the magic link email after submitting the form.
- Confirm the magic link in the email points to your local Supabase (or correct redirect URL) so that after verification the app lands on `/dashboard` (or completes onboarding then dashboard).
- Increase the test timeout if the run is slow (e.g. `--timeout=180000`).
