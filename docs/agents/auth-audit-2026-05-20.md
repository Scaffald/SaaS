# Auth audit — 2026-05-20

**Trigger:** [SC-60](https://linear.app/scaffald/issue/SC-60) — "Google and Apple OAuth sign-in flows on the Login screen are failing. After completing the Google/Apple consent screen, the user is returned to Scaffald and shown the error toast 'Google sign-in failed, please try again.'"

**Scope (per session agreement):** Diagnose-only. Reproduce SC-60, audit every auth flow (Google web + native, Apple, email+password, magic link, logout, session refresh), survey anti-bot options (SC-32). No code changes this session; the deliverable is this report + a proposed PR shape.

**Method:** Static analysis of mobile auth surface (`packages/scf-core/features/auth`, `packages/scf-core/utils/auth`, `packages/scf-core/provider/auth`, `apps/scaffald/app/(auth)`), env file diff across `.env*` files, curl probe of Supabase OAuth `/auth/v1/authorize` on dev + prod (both 302 cleanly), JWT decode of the embedded Apple client secret. Live browser repro was attempted but Chrome MCP disconnected mid-session; static evidence is sufficient.

---

## 1. SC-60 root cause

### Apple side — **CONFIRMED**: Apple client secret JWT is expired

The Apple client secret stored in every root `.env*` file (`.env`, `.env.dev`, `.env.dev-local`, `.env.preview`, `.env.production`) is a single ES256 JWT whose `exp` claim decodes to:

- `iat` = `1762931550` → **2025-11-12T07:12:30Z**
- `exp` = `1778483550` → **2026-05-11T07:12:30Z**
- Today = **2026-05-20T16:48:09Z** → **expired 9 days before SC-60 was filed**

Apple recommends max 180-day client secret lifetime; this one hit the wall on schedule and was never rotated. The rotation script exists at [scripts/supabase-apple-auth-generate.js](../../scripts/supabase-apple-auth-generate.js) but is run manually with no calendar reminder or CI guard.

**Behavior** when the secret is expired: after the user completes Apple's consent screen, Apple POSTs the authorization code back to Supabase (`https://<project>.supabase.co/auth/v1/callback`). Supabase calls `https://appleid.apple.com/auth/token` with the expired `client_secret` JWT. Apple returns `400 invalid_client`. Supabase redirects to `redirect_to` with `?error=server_error&error_description=Unable+to+exchange+external+code` — but [apps/scaffald/app/(auth)/auth/callback.tsx](../../apps/scaffald/app/(auth)/auth/callback.tsx) only handles `SIGNED_IN` and `SIGNED_OUT`; it never parses `?error=` and just routes back to login. The user re-clicks Apple, the *initial* `signInWithOAuth` call still succeeds at the authorize step (which I confirmed via curl on both dev cloud `pmtdqrfpumqwkdhpgwcz.supabase.co` and prod `auth.scaffald.com` — both return HTTP 302 to `appleid.apple.com/auth/authorize`), so there is no immediate sync error to the app. The user ends up reclicking until they give up. The toast in the bug report ("Apple sign-in failed") only fires from [`useSocialAuthHandlers.native.ts:97`](../../packages/scf-core/features/auth/hooks/useSocialAuthHandlers.native.ts#L97) on iOS native — which uses the ID-token flow and does not touch the expired JWT — so on iOS the failure mode differs (see below). The web flow's "Apple sign-in failed" toast can only fire from [`useSocialAuthHandlers.ts:55`](../../packages/scf-core/features/auth/hooks/useSocialAuthHandlers.ts#L55) on the *first* call; the post-round-trip silent failure is real and currently invisible to users beyond the screen flicker.

Note: iOS native goes through `supabase.auth.signInWithIdToken({ provider: 'apple', token, nonce })` (see [`useSocialAuthHandlers.native.ts:74-81`](../../packages/scf-core/features/auth/hooks/useSocialAuthHandlers.native.ts#L74-L81)). This path **does not exchange the Apple client secret with Apple** — Supabase only verifies the ID token signature against Apple's public keys. So iOS native Apple should not be broken by the expired secret. Boris's screenshot is from the macOS web build (filename pattern `Screenshot 2026-05-20 at 08.58.45.png`), which is consistent: web is where the expired secret bites.

### Google side — **HIGH-LIKELIHOOD** root cause: configuration drift in Supabase project or Google Cloud Console, NOT in our code

Evidence:

- All required env vars are present in every `.env*` file with consistent values: `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_SCHEME`, `GOOGLE_SECRET`.
- Local Supabase [`packages/supabase/config.toml:129-139`](../../packages/supabase/config.toml#L129-L139) sets `auth.external.google.enabled = true` with `client_id = env(EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID)`, and `additional_redirect_urls` (lines 54-69) includes `http://localhost:8081/auth/callback`, `https://dev.scaffald.com/auth/callback`, `https://preview.scaffald.com/auth/callback`, `https://app.scaffald.com/auth/callback`.
- `/auth/v1/authorize?provider=google` returns **302 → `accounts.google.com/o/oauth2/v2/auth?client_id=163454683152-gudal3itet70djlo5iv5a9fg51cvald3.apps.googleusercontent.com&...`** on both dev cloud (`pmtdqrfpumqwkdhpgwcz.supabase.co`) and production (`auth.scaffald.com`). So step 1 of the OAuth flow is healthy on both projects.
- Google client secrets do not expire.

That leaves these candidate causes for the post-round-trip failure (none verifiable without a real Google account I can drive through consent):

1. **Most likely — Google Cloud Console "Authorized redirect URIs" missing entries.** If the Web OAuth client `163454683152-gudal3itet70djlo5iv5a9fg51cvald3` does not list `https://pmtdqrfpumqwkdhpgwcz.supabase.co/auth/v1/callback` (dev) or `https://auth.scaffald.com/auth/v1/callback` (prod, *which is on a custom auth domain*) Google rejects with `redirect_uri_mismatch`. **The custom auth subdomain is the most suspicious item** — `auth.scaffald.com` was set up as a Supabase custom domain at some point and it's plausible that the Google Cloud Console redirect-URI list was never updated when that switch happened.
2. **Supabase Dashboard "Site URL" / "Redirect URLs" drift.** The cloud-hosted Supabase projects ignore `config.toml` (which is for local CLI only) — those settings are dashboard-managed and have to be edited by a human. If a project's Site URL is stale (e.g. still `http://localhost:3000` from initial setup) Supabase rejects the redirect after the round-trip.
3. **Cookie / CF `__cf_bm` interaction.** Supabase sits behind Cloudflare; the `__cf_bm` bot-management cookie is set on `.supabase.co` and `.auth.scaffald.com`. If third-party-cookie blocking is on in the user's browser (Chrome's incoming default), the post-redirect session-exchange cookies can be dropped silently. Less likely as the root cause but worth checking.

### What the user actually sees (and why the toast text is misleading)

The toast string "Google sign-in failed, please try again" comes from [`packages/scf-core/locales/en/auth.json:4`](../../packages/scf-core/locales/en/auth.json#L4). It is emitted in *exactly* four places:

| File | Line | Fires on |
|---|---|---|
| [useSocialAuthHandlers.ts](../../packages/scf-core/features/auth/hooks/useSocialAuthHandlers.ts#L32) | 32 | Web: `supabase.auth.signInWithOAuth` returns sync error (does NOT fire after round-trip) |
| [useSocialAuthHandlers.native.ts](../../packages/scf-core/features/auth/hooks/useSocialAuthHandlers.native.ts#L62) | 62 | Native: any error in the GoogleSignin + signInWithIdToken chain |
| [components/GoogleSignIn.tsx](../../packages/scf-core/features/auth/components/GoogleSignIn.tsx#L29) | 29 | **Dead code** — not imported anywhere (see §3.1) |
| [components/AppleSignIn.tsx](../../packages/scf-core/features/auth/components/AppleSignIn.tsx#L29) | 29 | **Dead code** — Apple variant of above |

So the user only sees the toast after the *first synchronous error*. The post-round-trip silent failure (Apple expired-secret case) drops them on the login page with **no visible error at all** — the toast they keep reporting is from a subsequent click attempt when Supabase is somehow already in a bad state, or it's a misremembering. Either way, the callback's lack of `?error_description=` parsing is a separate bug masking the real symptom.

---

## 2. Per-flow audit (fragility findings, severity tagged)

### 2.1 Google native iOS — `useSocialAuthHandlers.native.onGooglePress`
[Source](../../packages/scf-core/features/auth/hooks/useSocialAuthHandlers.native.ts#L24-L68)

| Sev | Finding |
|---|---|
| P2 | `GoogleSignin.configure({...})` runs on every button press (line 27-30). Should be a one-time init at app bootstrap. Re-configuring is fast but produces redundant log noise and races if the user double-taps. |
| P2 | Catch block masks all non-`SIGN_IN_CANCELLED` errors behind one generic toast. `DEVELOPER_ERROR` (10), `PLAY_SERVICES_NOT_AVAILABLE` (12), and `idToken: null` cases are indistinguishable to the user *and* to whoever reads the PostHog event. |
| P3 | `error_code` extraction is correct but `message` is dropped to PostHog when the error isn't an `Error` instance (line 50). Loses signal for SDK enum errors that come as `{ code: number }`. |
| P3 | No consent check before triggering OAuth — SC-51's `hasAgreed` gate (login-screen.tsx) only covers password + magic link. A worker can sign in via Google without ticking Terms/Privacy. Compliance gap. |

### 2.2 Google web — `useSocialAuthHandlers.onGooglePress`
[Source](../../packages/scf-core/features/auth/hooks/useSocialAuthHandlers.ts#L16-L37)

| Sev | Finding |
|---|---|
| P1 | Same consent-gate gap as 2.1. |
| P2 | `redirectTo: ${process.env.EXPO_PUBLIC_URL}/auth/callback` produces broken URLs (`//auth/callback` or `undefined/auth/callback`) if `EXPO_PUBLIC_URL` is unset at build time or has a trailing slash. No URL normalization. |
| P2 | `supabase.auth.signInWithOAuth` returns `{ data: { url, provider }, error }` — the code only checks `error`. On Expo Web `data.url` *should* be auto-navigated by supabase-js (`skipBrowserRedirect: false` default), but if the build target ever flips to React Native (not RN-Web) we'd silently no-op. Safer: explicitly check `data?.url` and navigate if present, log if absent. |

### 2.3 Apple iOS — `useSocialAuthHandlers.native.onApplePress`
[Source](../../packages/scf-core/features/auth/hooks/useSocialAuthHandlers.native.ts#L70-L104) + [`initiateAppleSignIn`](../../packages/scf-core/utils/auth/initiateAppleSignIn.ts)

| Sev | Finding |
|---|---|
| P2 | Same generic-toast masking as Google native. `ERR_REQUEST_CANCELED` is the only special-cased code; everything else (network failure, signature verification fail, missing identity token) gets the generic message. |
| P3 | `initiateAppleSignIn` throws `"Apple Sign In failed: No identity token received"` if `credential.identityToken` is null. Caught by the handler but the toast is still the generic one — the upstream-friendly message is wasted. |

### 2.4 Apple web — `useSocialAuthHandlers.onApplePress`
[Source](../../packages/scf-core/features/auth/hooks/useSocialAuthHandlers.ts#L39-L60)

| Sev | Finding |
|---|---|
| **P0** | Affected by the expired-secret root cause. Until APPLE_SECRET is rotated on the Supabase project, this flow is broken end-to-end. |
| P1 | Same consent gap as 2.1. |

### 2.5 OAuth callback page — `/auth/callback`
[Source](../../apps/scaffald/app/(auth)/auth/callback.tsx)

| Sev | Finding |
|---|---|
| **P0** | Does not parse `?error=` / `?error_description=` from the callback URL. When Supabase redirects back with a post-round-trip error (expired Apple secret, redirect-URI mismatch, etc.), the user lands on login with no signal. This is the silent-failure surface for SC-60. |
| P2 | Subscribes to `onAuthStateChange` *only* — does not also race-handle `INITIAL_SESSION` properly. The current `INITIAL_SESSION && !session` branch (line 21) routes to login, but if a session arrived 10ms before mount the listener might miss `SIGNED_IN` (it's idempotent because supabase-js replays the last state, but worth a test). |
| P3 | No timeout: if neither `SIGNED_IN` nor `SIGNED_OUT` fires within N seconds, the user is stuck on a blank `/auth/callback` (the component renders `null`). Bad UX. |

### 2.6 Email + password sign-in
[`login-screen.tsx:99-140`](../../packages/scf-core/features/auth/login-screen.tsx#L99-L140)

| Sev | Finding |
|---|---|
| P2 | `signInWithPassword` is gated on `hasAgreed` — good. Error path uses `translateError(error)` and surfaces the upstream message. Fine. |
| P3 | `email_domain = email.split('@')[1] ?? 'unknown'` — fine as-is, but worth a regex sanity check before split if we ever lower validation strictness. |
| P3 | `setError('password', { ... translateError(error) })` shows the Supabase raw message (`"Invalid login credentials"`) to the user. Acceptable but not localized. |

### 2.7 Magic link request + OTP verify
[`login-screen.tsx:142-185`](../../packages/scf-core/features/auth/login-screen.tsx#L142-L185), [`MagicLinkPending.tsx:33-81`](../../packages/scf-core/features/auth/components/MagicLinkPending.tsx#L33-L81)

| Sev | Finding |
|---|---|
| P2 | `redirectTo` is inconsistent: login-screen uses `process.env.EXPO_PUBLIC_URL`, MagicLinkPending uses `getBaseUrl()`. Pick one — `getBaseUrl()` already wraps `EXPO_PUBLIC_URL` with sensible fallbacks. |
| P3 | OTP error detection in [`MagicLinkPending.tsx:53-62`](../../packages/scf-core/features/auth/components/MagicLinkPending.tsx#L53-L62) matches Supabase error messages by `.includes('otp_expired')` etc. Brittle to upstream error string changes. Prefer error code matching (`error.code === 'otp_expired'`). |

### 2.8 Logout
[`AuthProvider.signOut`](../../packages/scf-core/provider/auth/AuthProvider.tsx#L74-L94), [`AuthProvider.clearAuth`](../../packages/scf-core/provider/auth/AuthProvider.tsx#L98-L117), [`clearAllAuthStorage`](../../packages/scf-core/utils/auth/clearAuthStorage.ts)

| Sev | Finding |
|---|---|
| P2 | Two paths (`signOut` vs `clearAuth`) with overlapping responsibility. `signOut` only calls `supabase.auth.signOut()`; `clearAuth` wipes storage too. Callers must know which to use. Worth consolidating. |
| P3 | `clearWebStorage` iterates `localStorage` keys looking for `auth`/`session` substrings — this is overly broad and will sometimes clear non-auth keys with `session` in the name (e.g. analytics session ids). Tighten to `sb-` and `supabase` prefixes. |
| P3 | Cookie deletion silently warns once if `cookieStore` API is unavailable (Safari, older Chrome). Acceptable for MVP but means logout on those browsers leaves Supabase cookies behind. |

### 2.9 Session restore on cold start + refresh
[`AuthProvider` init effect](../../packages/scf-core/provider/auth/AuthProvider.tsx#L152-L186), [`AuthStateChangeHandler.useProactiveSessionValidation`](../../packages/scf-core/provider/auth/AuthStateChangeHandler.ts#L25-L85)

| Sev | Finding |
|---|---|
| **P1** | `useProactiveSessionValidation` hard-signs-out (`clearAllAuthStorage`) on every focus/visibility-change if `expires_at - now < 60s` (line 34). This **bypasses Supabase's `autoRefreshToken: true` silent-refresh path** ([`supabase/client.ts:60`](../../packages/scf-core/utils/supabase/client.ts#L60)). A user who happens to focus the app within 60 seconds of expiry gets bounced to login instead of refreshed. Should attempt `refreshSession` first and only sign out if that fails. |
| P2 | Four separate `onAuthStateChange` subscriptions across the codebase ([AuthProvider:373](../../packages/scf-core/provider/auth/AuthProvider.tsx#L373), [AuthStateChangeHandler:13](../../packages/scf-core/provider/auth/AuthStateChangeHandler.ts#L13), [login-screen:364](../../packages/scf-core/features/auth/login-screen.tsx#L364), [callback.tsx:17](../../apps/scaffald/app/(auth)/auth/callback.tsx#L17)). They don't conflict, but consolidation would simplify reasoning and reduce listener leak risk. |
| P2 | Two `isSessionExpired` implementations with different thresholds: [`clearAuthStorage.ts:277`](../../packages/scf-core/utils/auth/clearAuthStorage.ts#L277) uses 60s buffer; [`useAuth.tsx:85`](../../packages/scf-core/provider/auth/useAuth.tsx#L85) uses 0s. Pick one. |
| P3 | `AuthProvider.refreshSession` exposed on context (line 119-137) but no consumer in the entire workspace. Dead code — Supabase handles it via `autoRefreshToken`. Either remove or actually wire it into the proactive-validation flow. |

### 2.10 Vestigial duplicate components
[`packages/scf-core/features/auth/components/GoogleSignIn.tsx`](../../packages/scf-core/features/auth/components/GoogleSignIn.tsx), [`GoogleSignIn.native.tsx`](../../packages/scf-core/features/auth/components/GoogleSignIn.native.tsx), [`AppleSignIn.tsx`](../../packages/scf-core/features/auth/components/AppleSignIn.tsx), [`AppleSignIn.native.tsx`](../../packages/scf-core/features/auth/components/AppleSignIn.native.tsx)

| Sev | Finding |
|---|---|
| P2 | All four files are dead code — confirmed via grep across `packages/` and `apps/`. The native variant uses `process.env.GOOGLE_IOS_CLIENT_ID` (no `EXPO_PUBLIC_` prefix → will not be bundled). If anyone reintroduces these by accident, they will silently fail. Delete. |
| P2 | [`packages/scf-core/utils/auth/initiateGoogleSignIn.ts`](../../packages/scf-core/utils/auth/initiateGoogleSignIn.ts) — also unused; superseded by `@react-native-google-signin/google-signin` directly. The test [`initiateGoogleSignIn.test.ts`](../../packages/scf-core/utils/auth/__tests__/initiateGoogleSignIn.test.ts) is testing dead code. |
| P3 | [`apps/scaffald/environment.d.ts:11-12`](../../apps/scaffald/environment.d.ts#L11-L12) declares `EXPO_PUBLIC_GOOGLE_SIGN_IN_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_URL_SCHEME` — neither name is used anywhere; the real env vars are `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_SCHEME`. Stale typings. |
| P3 | [`README.md:798`](../../README.md#L798) — typo: `EXPO_PUBLIC_GOOGLE_IOS_SCHEMEGOOGLE_IOS_SCHEME=YOUR_IOS_SCHEME` (concatenated identifier). |
| P3 | [`packages/scf-core/features/auth/__tests__/login-screen.test.tsx`](../../packages/scf-core/features/auth/__tests__/login-screen.test.tsx) is in the vitest exclusion list per the recent SDK migration. Either revive or delete. |

---

## 3. Session refresh + anti-bot (SC-32) survey

### 3.1 Session refresh hardening — proposal

The "proactive validation hard-signs-out 60s before expiry" behavior (§2.9 P1) is the single most defensible improvement here. Concrete patch sketch (for a later PR):

```ts
// AuthStateChangeHandler.ts (proposed)
if (expired) {
  const { data, error } = await supabase.auth.refreshSession()
  if (error || !data.session) {
    await clearAllAuthStorage(queryClient)
  }
  // else: silent refresh succeeded, session stays valid
}
```

Plus: collapse the two `isSessionExpired` implementations into one shared helper, remove the dead `AuthProvider.refreshSession` (or wire it into the proactive path above), and consolidate the four `onAuthStateChange` subscriptions where they overlap.

### 3.2 Anti-bot (SC-32) — recommendation

**Cloudflare Turnstile** is the right MVP pick:
- Native Supabase Dashboard integration under Auth → Settings → Bot Protection. Set provider to Turnstile, paste site key + secret, done.
- Invisible/managed challenge — no UX cost for legitimate users.
- Free at our expected sign-up volume.
- Works for both magic-link signup and password signup. OAuth flows are inherently captcha-protected by Google/Apple themselves (the bot-account risk there is "real account, malicious use" which is a different problem).

Alternative: **hCaptcha** — also supported natively by Supabase, similar privacy posture, very slightly worse free-tier limits. Equivalent for our purposes.

**Not recommended:** reCAPTCHA v3 (requires custom integration, no Supabase native path), or DIY rate limiting (Supabase already rate-limits per IP on auth endpoints).

**Estimated effort:** 1 PR, ~1-2 hours, mostly Dashboard config + adding `captchaToken` to the magic-link request. Suggest doing this *after* the SC-60 fix and the hardening PR — it touches similar code surface.

---

## 4. Remediation list (ordered by user impact × change size)

| # | Item | Sev | Labels | Estimated effort |
|---|---|---|---|---|
| 1 | **Rotate APPLE_SECRET** via [scripts/supabase-apple-auth-generate.js](../../scripts/supabase-apple-auth-generate.js) (180-day JWT). Update on Supabase dashboards (dev, preview, prod), EAS secrets, and `.env*` files. Verify Apple web sign-in end-to-end. | **P0** | SC-60 fix | 30 min |
| 2 | **Verify Google OAuth in Supabase dashboards + Google Cloud Console**. Confirm `https://pmtdqrfpumqwkdhpgwcz.supabase.co/auth/v1/callback`, `https://auth.scaffald.com/auth/v1/callback`, and any preview-domain equivalent are in the Web OAuth client's Authorized redirect URIs. Confirm Supabase Site URL matches `EXPO_PUBLIC_URL` per env. Verify Google sign-in end-to-end. | **P0** | SC-60 fix | 30-60 min |
| 3 | **Surface upstream error in `/auth/callback`** — parse `?error=` / `?error_description=` and propagate to login as a toast or query-param-driven banner. Closes the silent-failure gap that masked SC-60 for 9+ days. | **P0** | SC-60 fix / hardening | 1-2 hours + test |
| 4 | **Stop hard-signing-out on focus** — `useProactiveSessionValidation` should attempt `supabase.auth.refreshSession()` before falling back to `clearAllAuthStorage`. | **P1** | hardening | 1 hour + test |
| 5 | **Add consent gate to OAuth handlers** — extend SC-51's `hasAgreed` enforcement to `onGooglePress` / `onApplePress`. | **P1** | hardening | 30 min + test |
| 6 | **Improve OAuth error toasts** — show the upstream error code or a short reason (cancelled / network / config / "try again later"). Stop masking everything as the same string. | **P2** | hardening | 1-2 hours |
| 7 | **Consolidate auth duplicates** — delete `GoogleSignIn{.native,}.tsx`, `AppleSignIn{.native,}.tsx`, `initiateGoogleSignIn.ts` + its test. Fix `environment.d.ts` stale typings. Fix README typo. | **P2** | cleanup | 30 min |
| 8 | **Consolidate session-expiry helpers** — single `isSessionExpired()` with documented buffer. Remove dead `AuthProvider.refreshSession` or wire it in. | **P2** | hardening | 30 min + test |
| 9 | **Unit tests** — `useSocialAuthHandlers{,native}.test.ts` covering: success path, cancel codes, missing idToken (native), Supabase 4xx, missing env. Resurrect `login-screen.test.tsx`. `AuthProvider.test.tsx` for cold-start + refresh race. Callback parse-`?error=` test. Reuse [`tests/infrastructure/vitest/helpers/supabase-mock.ts`](../../tests/infrastructure/vitest/helpers/supabase-mock.ts). | **P2** | test-only | 4-6 hours |
| 10 | **E2E** — new Playwright spec `test-oauth-google-web.spec.ts` mocking Supabase OAuth via MSW; expand `test-supabase-hardening-regression.spec.ts` with session-expiry + multi-tab logout. | **P2** | test-only | 3-4 hours |
| 11 | **Apple secret rotation reminder/automation** — at minimum a calendar gate; ideally a CI job that decodes `APPLE_SECRET`'s `exp` and fails the build/PR if it's within 14 days. | **P2** | hardening | 2 hours |
| 12 | **Cloudflare Turnstile (SC-32)** — Dashboard config + add `captchaToken` to magic-link/signup. | **P3** | SC-32 | 1-2 hours + test |

---

## 5. Smoke matrix

I could not execute this interactively (no real Google/Apple credentials available to drive consent screens; Chrome MCP failed to maintain a connection mid-session). This is the user-executable checklist for after item 1 + 2 + 3 land:

| # | Flow | Surface | Expected | Status |
|---|---|---|---|---|
| 1 | Google sign-in (new account) | Web | Lands on /home | TBD |
| 2 | Google sign-in (existing account) | Web | Lands on /home | TBD |
| 3 | Google sign-in cancel | Web | No toast, stays on login | TBD |
| 4 | Google sign-in (new) | iOS sim | Lands on /home | TBD |
| 5 | Google sign-in cancel | iOS sim | No toast | TBD |
| 6 | Apple sign-in (new) | Web | Lands on /home | TBD |
| 7 | Apple sign-in (new) | iOS sim | Lands on /home | TBD |
| 8 | Apple sign-in cancel | iOS sim | No toast | TBD |
| 9 | Email + password (correct) | Web + iOS | Lands on /home | TBD |
| 10 | Email + password (wrong pwd) | Web + iOS | Inline error, no toast loop | TBD |
| 11 | Magic link request → verify | Web + iOS | OTP success → /home | TBD |
| 12 | Magic link expired OTP | Web + iOS | Inline error, resend works | TBD |
| 13 | Logout from /home | Web + iOS | Back to login, storage cleared | TBD |
| 14 | Cold-start with stored session | Web + iOS | Auto-routes to /home | TBD |
| 15 | Refresh near expiry (after item 4 lands) | Web + iOS | Silent refresh, no bounce to login | TBD |
| 16 | Server-side error in callback URL (synthetic `?error=server_error`) | Web | Login screen shows the error (after item 3 lands) | TBD |

---

## 6. Recommended PR shape

Three sequential PRs, each independently shippable:

### PR-A — SC-60 P0 hotfix (this week)
- Item 1: rotate APPLE_SECRET (deploy-only — no code change, but document the rotation in a short PR note)
- Item 2: verify + correct Google OAuth dashboard configs (no code change, but capture the diff in the PR description for the record)
- Item 3: parse `?error=` in `/auth/callback` and surface to login
- Minimal test: one Playwright/vitest spec that simulates `?error=server_error` on the callback and asserts the user sees the message on login

**Why bundle:** items 1 + 2 are pure ops/config that need to land for SC-60 to close; item 3 prevents the same class of silent-failure from happening again and is a small focused diff that pairs naturally.

### PR-B — Auth hardening (next sprint)
- Items 4, 5, 6, 7, 8 — all the per-flow audit fixes
- Items 9 + 10 (test coverage) — the unit/integration/e2e expansion. Can split into PR-B1 (code) and PR-B2 (tests) if size requires.

### PR-C — Anti-bot + key rotation tooling
- Item 11 — CI gate for Apple secret expiry (prevents recurrence of SC-60 Apple half)
- Item 12 — Turnstile (SC-32)

This gives us three issues to track in Linear (link SC-60 to PR-A, file a new "Auth hardening" issue for PR-B, link SC-32 to PR-C).

---

## 7. Open questions for the user

1. **Apple secret rotation cadence** — every 180 days is fine if it's automated. Want me to put the CI expiry check (item 11) in PR-A instead of PR-C so we catch the *next* rotation before it bites prod?
2. **Custom Supabase auth domain `auth.scaffald.com`** — was this set up recently, and do you have access to confirm the Google Cloud Console redirect-URI allowlist for the prod Web OAuth client? (I'd rather you check than guess.)
3. **PR-A scope** — happy to bundle items 1+2+3 in one PR, or do you want item 3 as a separate diagnostic-improvements PR while items 1+2 ship purely as ops actions?

These are not blocking next-step work — they refine PR-A's exact shape.
