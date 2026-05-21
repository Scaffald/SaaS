#!/bin/bash
#
# Local equivalent of .github/workflows/deploy-web.yml — builds apps/scaffald
# and syncs to S3 + CloudFront. Same end state, runs from the operator's
# shell so we're not blocked when GitHub Actions billing is exhausted.
#
# Reads AWS credentials from the AWS_KEY / AWS_SECRET pair in the root .env
# (same creds the workflow uses, just with the older variable names) and
# discovers the bucket + distribution ID at runtime so we don't have to
# duplicate the GH Actions secret config locally.
#
# Targets dev.scaffald.com / preview.scaffald.com / app.scaffald.com:
#   dev      → s3://dev-scaffald-com     + CF E3J4DOM99FE5N
#   preview  → s3://preview-scaffald-com + CF E1YYVZYC1XER5O
#   prod     → s3://app-scaffald-com     + CF E22499AF1OBX1Y
#
# Usage:
#   bash scripts/deploy-web.sh dev        # default; deploys current HEAD
#   bash scripts/deploy-web.sh preview
#   bash scripts/deploy-web.sh prod       # production — asks for confirmation
#   bash scripts/deploy-web.sh dev --skip-build  # reuse existing apps/scaffald/dist
set -euo pipefail

TARGET="${1:-dev}"
SKIP_BUILD=""
for arg in "$@"; do
  [ "$arg" = "--skip-build" ] && SKIP_BUILD=1
done

case "$TARGET" in
  dev)
    APP_ENV="dev"
    APP_URL="https://dev.scaffald.com"
    S3_BUCKET="dev-scaffald-com"
    CLOUDFRONT_ID="E3J4DOM99FE5N"
    ;;
  preview)
    APP_ENV="preview"
    APP_URL="https://preview.scaffald.com"
    S3_BUCKET="preview-scaffald-com"
    CLOUDFRONT_ID="E1YYVZYC1XER5O"
    ;;
  prod|production)
    APP_ENV="production"
    APP_URL="https://app.scaffald.com"
    S3_BUCKET="app-scaffald-com"
    CLOUDFRONT_ID="E22499AF1OBX1Y"
    echo "⚠️  About to deploy to PRODUCTION (app.scaffald.com)."
    read -r -p "Type 'deploy prod' to continue: " confirm
    if [ "$confirm" != "deploy prod" ]; then
      echo "Aborted."
      exit 1
    fi
    ;;
  *)
    echo "Usage: $0 [dev|preview|prod] [--skip-build]" >&2
    exit 2
    ;;
esac

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}"

# Load AWS creds from the root .env. The workflow uses
# SCAFFALD_AWS_ACCESS_KEY_ID + _SECRET_ACCESS_KEY in GH secrets; the .env
# names are AWS_KEY / AWS_SECRET for historical reasons.
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

export AWS_ACCESS_KEY_ID="${AWS_KEY:-}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET:-}"
export AWS_DEFAULT_REGION="${AWS_REGION:-us-east-1}"

if [ -z "${AWS_ACCESS_KEY_ID}" ] || [ -z "${AWS_SECRET_ACCESS_KEY}" ]; then
  echo "error: AWS_KEY / AWS_SECRET not set in .env" >&2
  exit 2
fi

echo "🔐 AWS identity:"
aws sts get-caller-identity --output text --query 'Arn'
echo ""

# ===== BUILD =====
if [ -z "${SKIP_BUILD}" ]; then
  ENV_FILE=".env.${APP_ENV}"
  [ "$APP_ENV" = "production" ] && ENV_FILE=".env.production"
  [ "$APP_ENV" = "dev" ] && ENV_FILE=".env.dev"
  if [ ! -f "${ENV_FILE}" ]; then
    echo "error: ${ENV_FILE} not found; can't build without it" >&2
    exit 2
  fi

  echo "🏗️  Building apps/scaffald for ${APP_ENV} (env file: ${ENV_FILE})"

  # Load build-time EXPO_PUBLIC_* env from the matching .env file so the
  # static bundle has the right Supabase URL / app URL / Google client IDs
  # baked in — same set the workflow exports from GH secrets.
  set -a
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
  set +a
  export NODE_ENV=production
  export APP_ENV
  # Force EXPO_PUBLIC_URL to the deployment URL in case the env file
  # overrides it (dev.env points to localhost during local dev).
  export EXPO_PUBLIC_URL="${APP_URL}"

  # Purge Metro/Haste caches. Metro keys its persistent cache on source
  # file content, not on env vars — so back-to-back `deploy-web.sh dev`
  # then `deploy-web.sh prod` would otherwise serve the dev-built bundle
  # (with dev Supabase URL + dev anon key) to prod. (Incident 2026-05-21.)
  rm -rf apps/scaffald/dist apps/scaffald/.expo/web \
    "${TMPDIR:-/tmp}/metro-cache" "${TMPDIR:-/tmp}"/metro-file-map-* \
    "${TMPDIR:-/tmp}"/haste-map-* 2>/dev/null || true

  pnpm web:build

  cd apps/scaffald
  echo "/* /index.html 200" > dist/_redirects
  echo "✅ Build complete: $(du -sh dist | cut -f1)"
  cd "${REPO_ROOT}"
else
  echo "⏭️  Skipping build (--skip-build); using existing apps/scaffald/dist"
  if [ ! -d apps/scaffald/dist ]; then
    echo "error: apps/scaffald/dist does not exist; can't skip build" >&2
    exit 2
  fi
fi

# ===== S3 SYNC =====
echo ""
echo "🚀 Syncing to s3://${S3_BUCKET}"

# Assets: long cache. Exclude HTML so we can re-sync those with different headers.
aws s3 sync apps/scaffald/dist "s3://${S3_BUCKET}" \
  --delete \
  --exclude "*.html" --exclude "_redirects" --exclude "_headers" --exclude "*.map" \
  --cache-control "public, max-age=31536000, immutable"

# HTML: no cache.
aws s3 sync apps/scaffald/dist "s3://${S3_BUCKET}" \
  --delete \
  --exclude "*" --include "*.html" \
  --cache-control "public, max-age=0, must-revalidate" \
  --content-type "text/html"

# Support files
for f in _redirects _headers; do
  if [ -f "apps/scaffald/dist/${f}" ]; then
    aws s3 cp "apps/scaffald/dist/${f}" "s3://${S3_BUCKET}/${f}"
  fi
done

# ===== CLOUDFRONT INVALIDATE =====
echo ""
echo "🌐 Invalidating CloudFront distribution ${CLOUDFRONT_ID}"
INV_ID=$(aws cloudfront create-invalidation \
  --distribution-id "${CLOUDFRONT_ID}" \
  --paths "/*" \
  --query 'Invalidation.Id' --output text)
echo "✅ Invalidation queued: ${INV_ID}"

# ===== SMOKE =====
echo ""
echo "⏳ Waiting 20s for CloudFront propagation, then smoke-testing ${APP_URL}"
sleep 20
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${APP_URL}/" || echo "000")
echo "${APP_URL}/ → HTTP ${STATUS}"
if [ "${STATUS}" = "200" ]; then
  echo "✅ Smoke test passed"
else
  echo "⚠️  Unexpected status ${STATUS} — CloudFront may still be propagating; retry in ~30s with: curl -I ${APP_URL}/"
fi

echo ""
echo "Deploy complete:"
echo "  env:   ${APP_ENV}"
echo "  url:   ${APP_URL}"
echo "  cf:    ${CLOUDFRONT_ID} (invalidation ${INV_ID})"
