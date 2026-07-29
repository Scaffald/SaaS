#!/bin/bash
# Build + package the Expo SSR web app for deployment.
#
# Unlike scripts/deploy-aws.sh (which syncs a static SPA export to S3), the app
# now uses `web.output: 'server'` and needs a Node runtime for server-rendered
# HTML, generateMetadata, route loaders, and API routes.
#
# This script builds the export and, optionally, the runtime container image.
# It intentionally does NOT push or deploy anything — see docs/agents/SSR-DEPLOY.md
# for the cutover runbook.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="$REPO_ROOT/apps/scaffald"

ENV="${1:-production}"
BUILD_IMAGE="${BUILD_IMAGE:-0}"

if [[ ! "$ENV" =~ ^(dev|preview|production)$ ]]; then
    echo -e "${RED}❌ Invalid environment: $ENV${NC}"
    echo "Usage: $0 [dev|preview|production]"
    exit 1
fi

case "$ENV" in
    dev)         ENV_FILE=".env"            ;;
    preview)     ENV_FILE=".env.preview"    ;;
    production)  ENV_FILE=".env.production" ;;
esac

echo -e "${BLUE}▶ Building Expo SSR web bundle (${ENV})${NC}"

if [ ! -f "$REPO_ROOT/$ENV_FILE" ]; then
    echo -e "${RED}❌ Missing $ENV_FILE at repo root${NC}"
    exit 1
fi

# Metro inlines EXPO_PUBLIC_* at build time and its cache does NOT key on env
# vars — a stale cache silently ships the previous environment's config.
echo -e "${YELLOW}⚠ Wiping Metro cache so env changes take effect${NC}"
rm -rf "${TMPDIR:-/tmp}/metro-cache"

rm -rf "$APP_DIR/dist"

cd "$APP_DIR"
APP_ENV="$ENV" NODE_ENV=production \
    pnpm exec dotenv -e "$REPO_ROOT/$ENV_FILE" -- \
    pnpm exec expo export --platform web

if [ ! -f "$APP_DIR/dist/server/_expo/routes.json" ]; then
    echo -e "${RED}❌ Export did not produce a server build.${NC}"
    echo "   Check that app.config.ts still sets web.output: 'server'."
    exit 1
fi

echo -e "${GREEN}✓ Export complete${NC}"
echo "   client: $APP_DIR/dist/client"
echo "   server: $APP_DIR/dist/server"

# Smoke-check that SSR actually produced markup rather than an empty shell.
echo -e "${BLUE}▶ Verifying server-rendered output${NC}"
PORT=3999 node "$APP_DIR/server/index.js" &
SERVER_PID=$!
# shellcheck disable=SC2064
trap "kill $SERVER_PID 2>/dev/null || true" EXIT

for _ in $(seq 1 30); do
    if curl -sf -o /dev/null "http://127.0.0.1:3999/healthz"; then break; fi
    sleep 1
done

HOME_HTML=$(curl -s "http://127.0.0.1:3999/")
if ! grep -q "Connecting skilled trade workers" <<<"$HOME_HTML"; then
    echo -e "${RED}❌ Landing page did not server-render its hero copy.${NC}"
    exit 1
fi
if ! grep -q "<title>" <<<"$HOME_HTML"; then
    echo -e "${RED}❌ No <title> in server output — generateMetadata is not running.${NC}"
    exit 1
fi

kill $SERVER_PID 2>/dev/null || true
trap - EXIT
echo -e "${GREEN}✓ SSR output verified${NC}"

if [ "$BUILD_IMAGE" = "1" ]; then
    echo -e "${BLUE}▶ Building runtime container image${NC}"
    docker build -t "scaffald-web:$ENV" "$APP_DIR"
    echo -e "${GREEN}✓ Image built: scaffald-web:$ENV${NC}"
fi

echo
echo -e "${GREEN}Ready to deploy.${NC} Nothing has been pushed."
echo "Next steps are in docs/agents/SSR-DEPLOY.md"
