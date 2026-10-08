#!/bin/bash
#
# Local web deploy to EAS Hosting — the same end state as
# .github/workflows/deploy-web.yml, run from the operator's shell for when
# Actions minutes are exhausted or a hotfix can't wait for CI.
#
# All environments run the SSR app on EAS Hosting (as-built 2026-07-28, see
# docs/agents/SSR-DEPLOY.md):
#   dev      → alias scf-scaffald--dev.expo.app      ← CloudFront E3J4DOM99FE5N (dev.scaffald.com)
#   preview  → alias scf-scaffald--preview.expo.app  ← CloudFront E1YYVZYC1XER5O (preview.scaffald.com)
#   prod     → production scf-scaffald.expo.app      ← CloudFront E1JU35IZ18YNEL (scaffald.com)
#
# The old S3 + CloudFront sync (deploy-aws.sh / deploy-web.sh, removed 2026-08)
# must never come back for the web app: the SSR export has no static
# index.html, so a bucket sync produces an unservable site — and the prod
# bucket (app-scaffald-com / E22499AF1OBX1Y) now serves the 301 that redirects
# app.scaffald.com to the apex. Syncing anything there breaks the redirect.
#
# Usage:
#   bash scripts/deploy-web-eas.sh dev
#   bash scripts/deploy-web-eas.sh preview
#   bash scripts/deploy-web-eas.sh prod          # asks for confirmation
#   bash scripts/deploy-web-eas.sh prod --skip-build   # reuse apps/scaffald/dist
set -euo pipefail

TARGET="${1:-dev}"
SKIP_BUILD=""
for arg in "$@"; do
  [ "$arg" = "--skip-build" ] && SKIP_BUILD=1
done

# Mirrors the DEPLOY_ALIAS / DEPLOY_ENVIRONMENT mapping in deploy-web.yml.
# `--prod`/`--alias` pick the URL; `--environment` picks which EAS
# environment's variables the worker loads. Without --environment the worker
# starts with NO env vars — server routes (Resend contact form) fail at
# runtime while the deploy reports success.
case "$TARGET" in
  dev)
    ENV_FILE=".env.dev"
    APP_ENV="dev"
    EAS_ENVIRONMENT="development"
    DEPLOY_ARGS=(--alias dev)
    APP_URL="https://dev.scaffald.com"
    ;;
  preview)
    ENV_FILE=".env.preview"
    APP_ENV="preview"
    EAS_ENVIRONMENT="preview"
    DEPLOY_ARGS=(--alias preview)
    APP_URL="https://preview.scaffald.com"
    ;;
  prod|production)
    ENV_FILE=".env.production"
    APP_ENV="production"
    EAS_ENVIRONMENT="production"
    DEPLOY_ARGS=(--prod)
    APP_URL="https://scaffald.com"
    echo "⚠️  About to deploy to PRODUCTION (scaffald.com)."
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

# ===== CLEAN TREE =====
# The build is the working tree, not the commit. On 2026-10-07 an uncommitted
# codemod edit shipped to prod this way (#1073). Refuse unless the tree matches
# HEAD, so what is deployed is a commit someone can name.
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "error: the working tree has uncommitted changes; the build would include them:" >&2
  git status --short --untracked-files=no >&2
  echo "Commit or discard them, or set ALLOW_DIRTY=1 to deploy them anyway." >&2
  [ "${ALLOW_DIRTY:-}" = "1" ] || exit 2
fi
DEPLOY_COMMIT="$(git rev-parse HEAD)"

# ===== BUILD =====
if [ -z "${SKIP_BUILD}" ]; then
  if [ ! -f "${ENV_FILE}" ]; then
    echo "error: ${ENV_FILE} not found; can't build without it" >&2
    exit 2
  fi

  echo "🏗️  Exporting apps/scaffald for ${APP_ENV} (env file: ${ENV_FILE})"

  # Purge Metro caches. Metro keys its persistent cache on source file
  # content, not env vars — a stale cache silently bakes the previous
  # environment's EXPO_PUBLIC_* values into the bundle. (Incident 2026-05-21.)
  rm -rf apps/scaffald/dist apps/scaffald/.expo/web \
    "${TMPDIR:-/tmp}/metro-cache" "${TMPDIR:-/tmp}"/metro-file-map-* \
    "${TMPDIR:-/tmp}"/haste-map-* 2>/dev/null || true

  (
    cd apps/scaffald
    APP_ENV="${APP_ENV}" NODE_ENV=production \
      pnpm exec dotenv -e "../../${ENV_FILE}" -- pnpm exec expo export --platform web
  )
  # Commit stamp, served at /build.json (#1051): which build is live, which
  # neither an HTTP 200 nor the entry-*.js hash can say.
  printf '{"commit":"%s","ref":"%s","target":"%s","builtAt":"%s"}\n' \
    "${DEPLOY_COMMIT}" "$(git rev-parse --abbrev-ref HEAD)" "${APP_ENV}" \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" > apps/scaffald/dist/client/build.json
  echo "✅ Export complete: $(du -sh apps/scaffald/dist | cut -f1) — stamped ${DEPLOY_COMMIT}"
else
  echo "⏭️  Skipping build (--skip-build); using existing apps/scaffald/dist"
  STAMPED=$(sed -n 's/.*"commit":"\([0-9a-f]*\)".*/\1/p' apps/scaffald/dist/client/build.json 2>/dev/null || true)
  echo "   dist is stamped ${STAMPED:-<no stamp>}"
  if [ -n "${STAMPED}" ] && [ "${STAMPED}" != "${DEPLOY_COMMIT}" ]; then
    echo "error: dist was built from ${STAMPED}, but HEAD is ${DEPLOY_COMMIT}; rebuild without --skip-build" >&2
    [ "${ALLOW_DIRTY:-}" = "1" ] || exit 2
  fi
  if [ ! -d apps/scaffald/dist ]; then
    echo "error: apps/scaffald/dist does not exist; can't skip build" >&2
    exit 2
  fi
fi

# ===== DEPLOY =====
echo ""
echo "🚀 Deploying to EAS Hosting (${TARGET}, environment: ${EAS_ENVIRONMENT})"
EAS_LOG="$(mktemp)"
(
  cd apps/scaffald
  npx eas-cli@latest deploy "${DEPLOY_ARGS[@]}" \
    --environment "${EAS_ENVIRONMENT}" --non-interactive
) 2>&1 | tee "${EAS_LOG}"
[ "${PIPESTATUS[0]}" -eq 0 ] || exit 1
DEPLOYMENT_URL=$(grep -oE 'https://[a-z0-9-]+--[a-z0-9]+\.expo\.app' "${EAS_LOG}" | head -1 || true)

# ===== CLOUDFRONT INVALIDATE (prod only) =====
# Prod HTML is edge-cached for 60s by the scaffald-ssr-html cache policy, so
# a release is visible within a minute regardless. Invalidate to publish
# immediately when AWS creds are on hand; skipping is not an error.
if [ "${APP_ENV}" = "production" ]; then
  if [ -f .env ]; then
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
  fi
  if [ -n "${AWS_KEY:-}" ] && [ -n "${AWS_SECRET:-}" ]; then
    echo ""
    echo "🌐 Invalidating CloudFront E1JU35IZ18YNEL"
    AWS_ACCESS_KEY_ID="${AWS_KEY}" AWS_SECRET_ACCESS_KEY="${AWS_SECRET}" \
      AWS_DEFAULT_REGION="${AWS_REGION:-us-east-1}" \
      aws cloudfront create-invalidation \
        --distribution-id E1JU35IZ18YNEL --paths '/*' \
        --query 'Invalidation.Id' --output text
  else
    echo "ℹ️  AWS_KEY/AWS_SECRET not set — skipping CloudFront invalidation;"
    echo "   the edge cache expires within 60s on its own."
  fi
fi

# ===== SMOKE =====
echo ""
echo "⏳ Waiting 30s for the deploy to become reachable, then smoke-testing"
sleep 30
FAILED=0
for path in / /robots.txt; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 20 "${APP_URL}${path}" || echo "000")
  echo "${APP_URL}${path} → HTTP ${STATUS}"
  [ "${STATUS}" = "200" ] || FAILED=1
done
# Cache headers are set by CloudFront, not by the deploy, so a console edit can
# silently undo them (#788). Assert the two that matter on every deploy: the
# content-hashed bundle is immutable for a year, and the HTML is not.
ENTRY=$(curl -s --max-time 20 "${APP_URL}/" | grep -oE '/_expo/static/js/web/entry-[a-f0-9]+\.js' | head -1 || true)
if [ -n "${ENTRY}" ]; then
  ENTRY_CC=$(curl -sI --max-time 20 "${APP_URL}${ENTRY}" | tr -d '\r' | grep -i '^cache-control:' || true)
  HTML_CC=$(curl -sI --max-time 20 "${APP_URL}/" | tr -d '\r' | grep -i '^cache-control:' || true)
  echo "${ENTRY} → ${ENTRY_CC:-<no cache-control>}"
  echo "/ → ${HTML_CC:-<no cache-control>}"
  case "${ENTRY_CC}" in *immutable*) ;; *) echo "❌ entry bundle is not immutable — check the /_expo/static/* behaviour on CloudFront (docs/agents/SSR-DEPLOY.md)"; FAILED=1;; esac
  case "${HTML_CC}" in *immutable*) echo "❌ the HTML is immutable — a behaviour is matching too much"; FAILED=1;; esac
else
  echo "⚠️  could not find the entry bundle in ${APP_URL}/ — skipping the cache-header check"
fi
# Which build is live (#1051). The per-deploy URL is the deployment itself, so
# CloudFront cannot answer for it; the public URL is checked too and may lag by
# its edge TTL when no invalidation ran.
for url in ${DEPLOYMENT_URL} ${APP_URL}; do
  SERVED=$(curl -s --max-time 20 "${url}/build.json" | sed -n 's/.*"commit":"\([0-9a-f]*\)".*/\1/p' || true)
  if [ "${SERVED}" = "${DEPLOY_COMMIT}" ]; then
    echo "${url}/build.json → ${SERVED} ✓"
  else
    echo "${url}/build.json → ${SERVED:-<none>} (want ${DEPLOY_COMMIT})"
    [ "${url}" = "${DEPLOYMENT_URL}" ] && FAILED=1
  fi
done
if [ "${FAILED}" = "0" ]; then
  echo "✅ Smoke test passed"
else
  echo "⚠️  Smoke test failed — CDN may still be propagating; retry: curl -I ${APP_URL}/"
fi
