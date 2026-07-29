# SSR deploy & apex cutover runbook

The web app moved from a client-only SPA export to Expo Router **server
rendering** (`web.output: 'server'`). Marketing, legal, and public
profile/job pages now render on the server so they are crawlable and unfurl
correctly on social platforms.

> **STATUS: the cutover is DONE (2026-07-28).** `scaffald.com` and
> `www.scaffald.com` serve the SSR app; Wix is out of DNS. This document is now
> a record of how it was done plus the remaining follow-ups — see
> "As-built" below, which supersedes the "Hosting target" and "Why not EAS
> Hosting" sections.

## As-built

| | |
| --- | --- |
| SSR server | **EAS Hosting**, production URL `https://scf-scaffald.expo.app` |
| Apex/CDN | **CloudFront `E1JU35IZ18YNEL`** (`d2i8qcnbvmj1ap.cloudfront.net`), aliases `scaffald.com` + `www.scaffald.com` |
| Cert | existing wildcard — it **does** cover the bare apex (`scaffald.com` is a SAN) |
| Route53 zone | **`Z03807932GT9W30LQ0T67`** (the ID in `infra/aws/route53/DNS-MIGRATION-SUMMARY.md` is wrong and does not exist) |

CloudFront config that matters:
- Origin is the EAS URL over **https-only**, keepalive/read timeouts **60s**.
- Origin request policy **must** be `Managed-AllViewerExceptHostHeader` — if
  `Host` is forwarded, EAS cannot route the request.
- Default behaviour uses custom cache policy **`scaffald-ssr-html`**
  (min 0 / default 60s / max 3600s, query strings in the key, no cookies or
  headers). Safe because **SSR output is anonymous by design** — the server
  always renders the logged-out view and the client hydrates from localStorage.
  This is not just a perf win: with `CachingDisabled` every request hit the
  origin and **~10% returned 504 through CloudFront while 0% failed
  direct-to-origin**.
- `/_expo/*` uses `Managed-CachingOptimized`; `/api/*` uses
  `Managed-CachingDisabled` so POSTs are never cached.
- Viewer-request function `scaffald-redirect-to-apex` on every behaviour.

**After any distribution update, expect transient 500/504 for a minute or two**
while config propagates. Wait for status `Deployed`, then re-test before
treating a failure as real.

**Why CloudFront in front of EAS rather than EAS custom domains:** there is no
`eas domain` CLI command — custom domains are dashboard-only and gated behind a
paid plan. This keeps DNS and TLS in the AWS account and needed no new compute.

The Express server + Dockerfile below are still valid and tested (72 MB image,
verified serving), but are **not** what production runs. They remain the escape
hatch if EAS is ever unsuitable.

Deploy a change:

```bash
cd apps/scaffald
APP_ENV=production NODE_ENV=production \
  pnpm exec dotenv -e ../../.env.production -- pnpm exec expo export --platform web
npx eas-cli@latest deploy --prod --non-interactive
# HTML is edge-cached for 60s, so a release is visible within a minute.
# To publish immediately: aws cloudfront create-invalidation --distribution-id E1JU35IZ18YNEL --paths '/*'
```

---

## What changed

| Before | After |
| --- | --- |
| `web.output` unset → SPA (`single`) | `web.output: 'server'` |
| Static export synced to S3 + CloudFront | Node runtime serving `dist/server`, static assets from `dist/client` |
| Marketing on Wix at `scaffald.com` | Marketing is `/` in the Expo app, logged-out |
| Product at `app.scaffald.com` | Product moves to the apex; `app.` 301s there |
| No metadata for crawlers | `generateMetadata` + route loaders + JSON-LD |

Route loaders and `generateMetadata` are **alpha** Expo features
(`unstable_useServerRendering`, `unstable_useServerDataLoaders`). Pin
`expo-router` and re-verify SSR output after any bump.

## Build

```bash
pnpm tsx --version >/dev/null && ./scripts/deploy-ssr.sh production
```

The script wipes the Metro cache (it does **not** key on `EXPO_PUBLIC_*`, so a
stale cache silently ships the wrong environment), builds the export, boots the
server, and asserts that `/` server-renders its hero copy and a `<title>`. It
deploys nothing.

Add `BUILD_IMAGE=1` to also build the runtime container:

```bash
BUILD_IMAGE=1 ./scripts/deploy-ssr.sh production
```

## Runtime

`apps/scaffald/server/index.js` — Express + `expo-server/adapter/express`.
Serves `/_expo/*` immutably for a year, the rest of `dist/client` for an hour,
then hands everything else to the SSR handler. `/healthz` returns `{ok:true}`
for load-balancer checks. Handles `SIGTERM`/`SIGINT` for graceful draining.

`apps/scaffald/Dockerfile` builds a runtime-only image (~`node:22-alpine` plus
three npm packages and `dist/`). It expects `dist/` to already exist, so the
Metro toolchain, submodules, and workspace `node_modules` stay out of the image.

Required runtime env:

| Variable | Purpose |
| --- | --- |
| `PORT` | Listen port (default 3000) |
| `EXPO_PUBLIC_SUPABASE_URL` | Baked in at build; also read by loaders at runtime |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Anon key for loader/sitemap fetches |
| `EXPO_PUBLIC_URL` | Canonical origin used in metadata + sitemaps |
| `RESEND_API_KEY` | Contact form delivery |
| `CONTACT_FORM_TO` | Optional; defaults to `hello@scaffald.com` |

`EXPO_PUBLIC_*` values are inlined into the client bundle at build time — set
them for the **build**, not just the container.

## Cutover sequence — completed 2026-07-28

1. ✅ **Provisioned** CloudFront `E1JU35IZ18YNEL` over the EAS production URL and
   smoke-tested every route on `d2i8qcnbvmj1ap.cloudfront.net` before touching DNS.
2. ✅ **Pre-authorized the apex** in Supabase `uri_allow_list` (apex, www and app
   origins plus their `/auth/callback`) while `app.scaffald.com` still served.
   **Google/Apple consoles needed no change** — providers redirect to Supabase's
   own callback on `auth.scaffald.com`, which never moved; only the app's
   `redirectTo` matters and Supabase validates that against the allow-list.
3. ✅ **Flipped DNS**: apex `A` and `www` are now CloudFront aliases. MX, SPF,
   DKIM and DMARC untouched — email is Google Workspace and unaffected.
4. ✅ **Verified on the apex**: all public routes 200, SSR content, metadata,
   JSON-LD, sitemaps (75 users / 3 jobs), the contact endpoint, and the auth
   page with its intent banner. No console errors.
5. ✅ **Canonical origin flipped** to `https://scaffald.com` in `.env.production`
   and `deploy-web.yml`. The workflow's auth step now *appends* the legacy
   origins rather than clobbering the allow-list on every prod deploy.

### Remaining follow-ups

6. ✅ **Old host redirected.** CloudFront Function `scaffald-redirect-to-apex`
   is attached as a viewer-request on both distributions and 301s
   `app.scaffald.com` *and* `www.scaffald.com` to the apex, preserving path and
   query. It is **host-aware** — apex requests pass straight through; without
   that check the apex distribution (which also serves `www`) would redirect to
   itself forever.
7. ⬜ **Cancel Wix.** Note `s1/s2/sel1._domainkey` and `sg.scaffald.com` still
   point at `ascendbywix.com` (Wix email marketing); remove them at the same time.
8. ⬜ **Search Console**: add the apex property, submit
   `https://scaffald.com/sitemap.xml`.

## Rollback

The previous static pipeline is untouched: `scripts/deploy-aws.sh` and
`.github/workflows/deploy-web.yml` still build and sync the SPA to
`app-scaffald-com`. To roll back, point DNS at the old distribution and revert
`web.output` in `app.config.ts`. Do not delete the S3 buckets or distributions
until the SSR host has been stable for a full release cycle.

## Known gaps

- **Missing profiles/jobs return HTTP 200** with `robots: noindex` rather than a
  real 404. The renderer has no route-level status override yet; a
  `+middleware.ts` that fetches and returns a 404 `Response` is the fix, at the
  cost of a duplicate lookup.
- **`getProfileBySlug` in `@scaffald/sdk` targets a nonexistent API path**
  (`/v1/profiles/slug/{slug}`); the real route is `/v1/profiles/{username}`.
  Public profile pages are broken in production today. The SSR loader works
  around it by calling the correct path directly. Filed as a Task in the
  Unicorn org's *Dogfood Bugs (Open)* punchlist.
- **Sitemaps query PostgREST directly** (`core.users`, `core.jobs`) because the
  REST API exposes no bulk slug listing. Capped at 40k URLs each; split further
  before crossing 50k.
- Legal pages render nav but no footer; the landing and contact pages have both.
