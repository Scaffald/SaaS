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

# 2. Deploy the three edge functions in lockstep — matches deploy-web.yml.
echo
echo "→ Deploying api, job-import, news functions…"
pnpx supabase functions deploy api job-import news \
  --project-ref "$PROJECT_REF" \
  --use-api

# 3. Smoke the health endpoint to confirm the deploy + secrets took effect.
echo
echo "→ Smoking /v1/health on $ENV…"
HEALTH_URL="https://$PROJECT_REF.supabase.co/functions/v1/api/v1/health"
sleep 2  # give the new function instance a moment to cold-start
curl -s "$HEALTH_URL" | head -c 500
echo
echo
echo "✓ $ENV deploy complete."
