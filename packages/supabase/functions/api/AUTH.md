# REST API Authentication

Use the **Supabase JWT** (`access_token`) for Bearer authentication. Do **not** use the OAuth provider token (e.g. `provider_token` from Google).

## Token to use

- **Use:** `session.access_token` — the Supabase-issued JWT (starts with `eyJ...`). The auth middleware validates it via `supabase.auth.getUser(token)`.
- **Do not use:** `session.provider_token` — the third-party OAuth token (e.g. `ya29....` from Google). The Edge function does not validate it.

Apps should pass the session like this: `Authorization: Bearer <session.access_token>` (e.g. via `supabaseToken` in the Scaffald SDK).

## Route auth matrix

| Auth type | Behavior | Example routes |
|-----------|----------|----------------|
| **None** | Only global auth middleware; anon key or JWT both pass. No user required. | `/health`, `GET /v1/jobs`, `GET /v1/profiles/:username`, `GET /v1/industries`, `GET /v1/onet/*`, public OAuth endpoints |
| **requireAuth** | User JWT **or** API key required. Missing/invalid token → 401. | `/v1/auth/roles`, `/v1/auth/session`, `/v1/api-keys`, `/v1/applications`, `/v1/feedback`, `/v1/account-deletion`, success-fees (status, create, confirm), id-verification (pricing, request, confirm, status, current), resume, profile-wizard, documents-storage, etc. |
| **requireRole('office', 'platform')** | Authenticated user **and** office role with platform scope. Valid JWT without role → 403. | All `/v1/office/*` (jobs, organizations, storage, users, universities, certifications), `/v1/notifications/admin`, `/v1/stripe-settings`, `/v1/legal-agreements`, `/v1/background-checks/admin`, id-verification list/revoke, oauth-management admin routes, cms office routes |

## Common causes of 401

1. **Wrong token** — Using `provider_token` or omitting the header on requireAuth routes.
2. **Expired token** — JWTs have limited lifetime; refresh the session or re-sign-in to get a new `access_token`.
3. **Issuer mismatch** — Local JWT issuer is `http://127.0.0.1:54321/auth/v1`. Ensure the API runs with the same `SUPABASE_URL` as the Supabase instance used for sign-in.
4. **No Bearer header** — Sending the anon key instead of a user token on requireAuth routes yields 401 (anon does not identify a user).

## "Invalid JWT" from the gateway

If you see `{"msg":"Invalid JWT"}` when calling the API:

- **Cause:** The Supabase gateway requires a valid `Authorization: Bearer <token>` header. No header or invalid token → gateway returns 401 before the request reaches the Edge Function.
- **Fix:**
  1. Always send a Bearer token: use the **anon key** for public routes, or a **user session `access_token`** for routes that require auth (e.g. `/v1/prerequisites/check`).
  2. For user-specific routes like `/v1/prerequisites/check`: sign in first and send `session.access_token`, not the anon key.
  3. **Restart the functions server** after API changes (e.g. lockfile/config): stop and run again `pnpm supa:functions`. You do **not** need to restart Supabase (`pnpm supa start`).

## Quick check

```bash
# Replace <access_token> with session.access_token from your app
curl -s -H "Authorization: Bearer <access_token>" \
  http://127.0.0.1:54321/functions/v1/api/v1/auth/session
```

A 200 response with session data means the token and environment are correct.

## Seeded test user and E2E verification

A fixed API test user is seeded for automation (see `packages/supabase/seeds/002a_seed-api-test-user.sql`):

- **Email:** `test@example.com`
- **Password:** `test123456`

After `pnpm supa db reset` (or any run that applies seeds), this user exists. The endpoint test script and SDK integration tests log in with these credentials to obtain a JWT and hit endpoints.

**Run E2E verification:**

1. Start Supabase and serve the API:
   ```bash
   pnpm supa start
   # In another terminal:
   pnpm supa functions serve api --env-file .env
   ```
2. From the repo root (with `.env` containing `SUPABASE_URL` / `SUPABASE_ANON_KEY` for local):
   ```bash
   # Endpoint script only (login with test user + hit all endpoints)
   pnpm verify:api:e2e

   # Endpoint script + SDK integration tests
   pnpm verify:api:e2e:full
   ```

If the test user is missing, run `pnpm supa db reset` to re-apply migrations and seeds.
