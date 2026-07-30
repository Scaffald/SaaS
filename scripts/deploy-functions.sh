#!/usr/bin/env bash
#
# scripts/deploy-functions.sh — manually deploy Supabase edge functions to
# dev/preview/prod when CI is down. Bakes the current git commit into the
# function's GIT_COMMIT secret so GET /v1/api/v1/health can report deployment
# skew. Mirrors the deploy step in .github/workflows/deploy-web.yml.
#
# Usage:
#   ./scripts/deploy-functions.sh dev
#   ./scripts/deploy-functions.sh preview
#   ./scripts/deploy-functions.sh prod
#
# Or via pnpm: `pnpm deploy:functions:dev` etc.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

ENV="${1:-}"
case "$ENV" in
  dev)     PROJECT_REF="pmtdqrfpumqwkdhpgwcz" ;;
  preview) PROJECT_REF="uhjkipdwayqfihkanabk" ;;
  prod)    PROJECT_REF="qmfmpcyxsihhfttvqpbw" ;;
  *)
    echo "usage: $0 {dev|preview|prod}" >&2
    exit 2
    ;;
esac

GIT_COMMIT=$(git rev-parse --short HEAD)
DEPLOYED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "  env:         $ENV ($PROJECT_REF)"
echo "  GIT_COMMIT:  $GIT_COMMIT"
echo "  DEPLOYED_AT: $DEPLOYED_AT"
echo

cd packages/supabase

# 1. Bake commit + timestamp into the project's secrets so /v1/health can
#    return them. These are project-level — re-setting overwrites.
echo "→ Setting GIT_COMMIT + DEPLOYED_AT secrets…"
pnpx supabase secrets set --project-ref "$PROJECT_REF" \
  "GIT_COMMIT=$GIT_COMMIT" \
  "DEPLOYED_AT=$DEPLOYED_AT"

# 2. Deploy the edge functions in lockstep — matches deploy-web.yml.
#    The notify-* set is the notification pipeline (issue #436): notify-publish
#    fans events out, notify-send-worker drains core.notification_deliveries on
#    a pg_cron minute tick, the rest are cron-driven scanners and digests.
#    webhooks-email receives Resend delivery events (Svix-signed).
#    All notify functions self-authenticate against the service role key —
#    see functions/_shared/notifications/auth.ts.
echo
echo "→ Deploying edge functions…"
pnpx supabase functions deploy \
  api job-import news \
  notify-publish notify-send-worker notify-check-receipts \
  notify-digest-daily notify-digest-weekly \
  notify-background-check-expiration notify-id-verification-expiration \
  send-team-invitation webhooks-email \
  --project-ref "$PROJECT_REF" \
  --use-api

# 3. Run the full smoke suite (scripts/smoke-remote.sh) so a broken deploy
#    can't print a green "complete". This replaces the old bare /v1/health
#    curl: health-only smoke passed while authz, route registration, and the
#    PostGIS functions were broken (migration 341 era). The suite checks the
#    health commit against the GIT_COMMIT baked above, so skew fails here too.
echo
echo "→ Running smoke suite against $ENV…"
cd "$(git rev-parse --show-toplevel)"
if ! ./scripts/smoke-remote.sh "$ENV" "$GIT_COMMIT"; then
  echo "✗ smoke suite failed on $ENV. The functions deployed, but the environment is not healthy." >&2
  exit 1
fi
echo
echo "✓ $ENV deploy complete."
