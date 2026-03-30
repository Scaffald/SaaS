# Deployment Infrastructure

Reference for all deployment environments, DNS, AWS, Supabase, and CI/CD configuration.

## Environments

| Environment | Git branch | Web URL | Status |
|-------------|-----------|---------|--------|
| Production  | `prod`    | https://app.scaffald.com | ✅ Live |
| Preview     | `preview` | https://preview.scaffald.com | ✅ Live |
| Dev         | `main`    | https://dev.scaffald.com | ✅ Live |

---

## AWS

### CloudFront distributions

| Environment | Distribution ID    | Domain alias |
|-------------|-------------------|--------------|
| Production  | `E22499AF1OBX1Y`  | app.scaffald.com |
| Preview     | `E1YYVZYC1XER5O`  | preview.scaffald.com |
| Dev         | `E3J4DOM99FE5N`   | dev.scaffald.com |

### S3 buckets

Bucket names are stored in GitHub secrets:
- `SCAFFALD_AWS_S3_BUCKET_PROD`
- `SCAFFALD_AWS_S3_BUCKET_PREVIEW`
- `SCAFFALD_AWS_S3_BUCKET_DEV`

### Route 53

Hosted zone: `scaffald.com` — `Z03807932GT9W30LQ0T67`

Current active records:
- `dev.scaffald.com` → ALIAS to `E3J4DOM99FE5N` CloudFront domain
- `preview.scaffald.com` → ALIAS to `E1YYVZYC1XER5O` CloudFront domain
- `app.scaffald.com` → ALIAS to `E22499AF1OBX1Y` CloudFront domain
- `auth.scaffald.com` → CNAME to Supabase custom domain (production project)

### IAM / credentials

AWS credentials in GitHub secrets:
- `SCAFFALD_AWS_ACCESS_KEY_ID`
- `SCAFFALD_AWS_SECRET_ACCESS_KEY`
- `SCAFFALD_AWS_REGION` (defaults to `us-east-1`)

Local deployments use the `scaffald` AWS CLI profile.

---

## Supabase

### Project structure

All environments run on a **single Supabase Pro project** (`qmfmpcyxsihhfttvqpbw`) using
Supabase branching. This keeps auth settings, OAuth providers, custom domain, and storage
buckets centrally managed.

| Environment | Branch name | Branch project ref       |
|-------------|-------------|--------------------------|
| Production  | `main`      | `qmfmpcyxsihhfttvqpbw`  |
| Preview     | `preview`   | `uhjkipdwayqfihkanabk`  |
| Dev         | `dev`       | `pmtdqrfpumqwkdhpgwcz`  |

### Custom domain

`auth.scaffald.com` is configured as a custom domain on the **production** branch only.
Dev/preview branches use their default Supabase URLs (`<ref>.supabase.co`).

### Auth redirect URLs

All of the following are allowlisted in `packages/supabase/config.toml` and pushed to the
remote project via `pnpm supa config push --project-ref <ref>`:

- `https://dev.scaffald.com` + `/auth/callback`
- `https://preview.scaffald.com` + `/auth/callback`
- `https://app.scaffald.com` + `/auth/callback`
- `http://localhost:5173` + callback (web dev)
- `http://localhost:8081` + callback (Expo dev)

### Migration note

Migration files use a numeric naming convention (`001_schema.sql`) rather than the Supabase
CLI's standard timestamp format. This means `supabase db push` cannot be used to deploy new
migrations to branches — the CLI does not recognise the file names. New migrations should
either adopt timestamp naming (`20260322000000_name.sql`) or be applied via direct DB
connection using `supabase db query --file`.

### Pushing config changes

After editing `packages/supabase/config.toml`, push to all three environments:

```bash
# Production
pnpm supa config push --project-ref qmfmpcyxsihhfttvqpbw

# Preview branch
pnpm supa config push --project-ref uhjkipdwayqfihkanabk

# Dev branch
pnpm supa config push --project-ref pmtdqrfpumqwkdhpgwcz
```

> **Note:** `supabase config push` rewrites the local `config.toml` after each run (reformats
> TOML and may drop comments). Always commit `config.toml` before running this command.

---

## Google OAuth

A single GCP OAuth client is shared across all environments. The same client ID and secret
apply to prod, preview, and dev.

**Authorised JavaScript origins** (must be set in Google Cloud Console):
- `https://app.scaffald.com`
- `https://preview.scaffald.com`
- `https://dev.scaffald.com`

**Authorised redirect URIs** (two sets — app-to-Supabase and Google-to-Supabase):

App callback (handled by the web app):
- `https://app.scaffald.com/auth/callback`
- `https://preview.scaffald.com/auth/callback`
- `https://dev.scaffald.com/auth/callback`

Supabase callback (Google redirects here after OAuth):
- `https://auth.scaffald.com/auth/v1/callback` (prod — custom domain)
- `https://uhjkipdwayqfihkanabk.supabase.co/auth/v1/callback` (preview branch)
- `https://pmtdqrfpumqwkdhpgwcz.supabase.co/auth/v1/callback` (dev branch)

---

## CI/CD — GitHub Actions

Workflow: `.github/workflows/deploy-web.yml`

Triggers on push to `prod`, `preview`, or `main` branches. Also supports `workflow_dispatch`
for manual deploys.

### GitHub secrets required

| Secret | Description |
|--------|-------------|
| `SCAFFALD_AWS_ACCESS_KEY_ID` | AWS deploy credentials |
| `SCAFFALD_AWS_SECRET_ACCESS_KEY` | AWS deploy credentials |
| `SCAFFALD_AWS_REGION` | AWS region (default `us-east-1`) |
| `SCAFFALD_AWS_S3_BUCKET_PROD` | S3 bucket for production |
| `SCAFFALD_AWS_S3_BUCKET_PREVIEW` | S3 bucket for preview |
| `SCAFFALD_AWS_S3_BUCKET_DEV` | S3 bucket for dev |
| `SCAFFALD_AWS_CLOUDFRONT_DISTRIBUTION_ID_PROD` | Overrides default `E22499AF1OBX1Y` |
| `SCAFFALD_AWS_CLOUDFRONT_DISTRIBUTION_ID_PREVIEW` | Overrides default `E1YYVZYC1XER5O` |
| `SCAFFALD_AWS_CLOUDFRONT_DISTRIBUTION_ID_DEV` | Overrides default `E3J4DOM99FE5N` |
| `EXPO_PUBLIC_SUPABASE_URL` | Prod Supabase URL (`https://auth.scaffald.com`) |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Prod Supabase anon key |
| `PREVIEW_EXPO_PUBLIC_SUPABASE_URL` | Preview branch URL |
| `PREVIEW_EXPO_PUBLIC_SUPABASE_ANON_KEY` | Preview branch anon key |
| `DEV_EXPO_PUBLIC_SUPABASE_URL` | Dev branch URL |
| `DEV_EXPO_PUBLIC_SUPABASE_ANON_KEY` | Dev branch anon key |
| `SUPABASE_ACCESS_TOKEN` | Supabase personal access token (for edge function deploys) |
| `SUPABASE_PROJECT_ID` | Prod Supabase project ref (`qmfmpcyxsihhfttvqpbw`) |
| `PREVIEW_SUPABASE_BRANCH_ID` | Preview branch ref (`uhjkipdwayqfihkanabk`) |
| `DEV_SUPABASE_BRANCH_ID` | Dev branch ref (`pmtdqrfpumqwkdhpgwcz`) |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Shared Google OAuth web client ID |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Shared Google OAuth iOS client ID |
| `EXPO_PUBLIC_GOOGLE_IOS_SCHEME` | Shared Google OAuth iOS URL scheme |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | Mapbox access token |
| `EXPO_PUBLIC_MAPBOX_API_URL` | Mapbox API base URL |
| `EXPO_PUBLIC_POSTHOG_API_KEY` | PostHog analytics key |

### Deploy flow

1. Build workspace packages (`@scaffald/ui`, `scf-core`, `scf-schemas`)
2. Run affected typecheck + lint (non-blocking)
3. Build web app with environment-specific vars
4. Upload artifact
5. Deploy edge functions to the appropriate Supabase project/branch
6. Sync to S3, invalidate CloudFront
7. Smoke test against CloudFront domain

---

## Local deployment scripts

```bash
# Deploy to a specific environment
pnpm deploy:aws:dev
pnpm deploy:aws:preview
pnpm deploy:aws:prod

# Attach a CloudFront alias (once canonical domains are released)
pnpm deploy:aws:attach-alias <distribution-id> <domain>

# Push Supabase config to a project/branch
pnpm supa config push --project-ref <ref>
```
