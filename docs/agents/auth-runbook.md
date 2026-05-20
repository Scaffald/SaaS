# Auth runbook

Operational steps for the auth surface — Apple secret rotation, Google
OAuth verification, common breakages and their fixes. Most of this is
dashboard-only work that can't be automated from the repo.

## Apple client secret rotation (180-day cadence)

Apple OAuth uses a JWT signed with our private `.p8` key as the
`client_secret`. The JWT has a max 180-day lifetime per Apple's guidance
and silently breaks Apple sign-in when it expires (this is the SC-60 root
cause). CI checks the expiry daily via
[`.github/workflows/apple-secret-expiry.yml`](../../.github/workflows/apple-secret-expiry.yml)
and fails when <21 days remain.

### Rotate

1. Generate a fresh 180-day JWT:
   ```bash
   pnpm node scripts/supabase-apple-auth-generate.js
   ```
   Output: a JWT string. Copy it.

2. Update **Supabase Dashboard** in every project that serves users:
   - Dev:        https://supabase.com/dashboard/project/pmtdqrfpumqwkdhpgwcz/auth/providers (Apple → Secret Key)
   - Preview:    https://supabase.com/dashboard/project/uhjkipdwayqfihkanabk/auth/providers
   - Production: https://supabase.com/dashboard/project/qmfmpcyxsihhfttvqpbw/auth/providers
   Click "Update" on each. The change takes effect immediately.

3. Update `.env` files (so local dev / contributors / CI stay in sync):
   - `.env`, `.env.dev`, `.env.dev-local`, `.env.preview`, `.env.production`
   - Replace `APPLE_SECRET="..."` with the new JWT.

4. Update the **GitHub Actions secret** `APPLE_SECRET` (used by the
   expiry-check workflow):
   - https://github.com/<org>/<repo>/settings/secrets/actions → edit `APPLE_SECRET`.

5. Verify locally:
   ```bash
   APPLE_SECRET="..."pnpm tsx scripts/check-apple-secret-expiry.ts
   # Expect "ok" with ~180 days remaining
   ```

6. Smoke test: Apple sign-in on https://app.scaffald.com and the iOS
   build. The previous secret is invalidated as soon as the dashboard
   value is replaced, so do this within minutes of rotating.

## Google OAuth verification (dashboard config)

Local [`packages/supabase/config.toml`](../../packages/supabase/config.toml)
documents the intent, but cloud projects are dashboard-managed and drift
quietly. When Google sign-in breaks, walk this checklist:

1. **Supabase Dashboard → Auth → Providers → Google** (per project):
   - Provider toggled **on**.
   - `Client ID` matches `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in the env
     file for that project.
   - `Client Secret` matches `GOOGLE_SECRET`.
   - `Skip nonce checks` enabled (required for native ID token flow).

2. **Supabase Dashboard → Auth → URL Configuration** (per project):
   - `Site URL` matches `EXPO_PUBLIC_URL` for that env.
   - `Redirect URLs` includes both the bare site URL and `/auth/callback`
     (e.g. `https://app.scaffald.com` and `https://app.scaffald.com/auth/callback`).

3. **Google Cloud Console → APIs & Services → Credentials**
   (https://console.cloud.google.com/apis/credentials):
   - The Web OAuth client (id `163454683152-gudal3itet70djlo5iv5a9fg51cvald3`)
     must include **all** Supabase callback URLs in **Authorized redirect
     URIs**:
     - `https://pmtdqrfpumqwkdhpgwcz.supabase.co/auth/v1/callback` (dev)
     - `https://uhjkipdwayqfihkanabk.supabase.co/auth/v1/callback` (preview)
     - `https://qmfmpcyxsihhfttvqpbw.supabase.co/auth/v1/callback` (production
       project) **and** `https://auth.scaffald.com/auth/v1/callback` (custom
       auth domain — easy to forget when adding the subdomain).
   - **Authorized JavaScript origins** should include each `EXPO_PUBLIC_URL`
     value.
   - The iOS OAuth client (id `163454683152-e4357cqnub2rg3vadkktap71i4nqea88`)
     should match `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and have the
     reverse-DNS URL scheme bound in
     [`apps/scaffald/app.config.ts`](../../apps/scaffald/app.config.ts) (the
     `@react-native-google-signin/google-signin` plugin block).

4. Verify the OAuth initiation step from a terminal (no browser needed):
   ```bash
   curl -sD - -o /dev/null --max-redirs 0 \
     "https://<supabase-project>.supabase.co/auth/v1/authorize?provider=google&redirect_to=<encoded-app-url>/auth/callback"
   ```
   A healthy response is `HTTP/2 302` with a `location:` header pointing
   at `accounts.google.com/o/oauth2/v2/auth?...`. If you get anything
   else, the Supabase project's Google provider is misconfigured.

## Common failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| "Sign-in didn't complete" toast after Apple consent | Apple JWT expired | Rotate per above |
| Google consent loads then errors `redirect_uri_mismatch` | Google Cloud Console missing the Supabase callback URL | Add it under Authorized redirect URIs |
| Returns to login with no toast | Old build before SC-60 fix (callback didn't parse `?error=`) | Ship the SC-60 fix |
| "Google sign-in failed" toast on first click (no round-trip) | Supabase provider toggled off or wrong client_id | Re-enable in dashboard |
| `DEVELOPER_ERROR` from native Google | iOS client_id mismatch with `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Re-check Google Cloud Console iOS client + URL scheme |
| User stuck on blank `/auth/callback` | `INITIAL_SESSION` never fired (cookie blocked or 3rd-party cookies off) | Try a different browser; for prod this points to a Site URL / cookie domain config issue |

## Monitoring

Three PostHog events to watch:

- `auth_social_sign_in_started` (provider) — denominator
- `auth_social_sign_in_succeeded` (provider) — numerator
- `auth_social_sign_in_failed` (provider, error_code, message) — fails
- `auth_callback_failed` (error, error_code, error_description) — silent
  failures the callback now surfaces (added in SC-60 fix)

Set up an alert on `auth_social_sign_in_failed` rate > 5% over 1h.
