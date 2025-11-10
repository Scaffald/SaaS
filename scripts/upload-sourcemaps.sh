#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RELEASE_VERSION="${1:-${SENTRY_RELEASE:-}}"

if [[ -z "${RELEASE_VERSION}" ]]; then
  echo "❌  Missing release version. Pass it as an argument or set SENTRY_RELEASE." >&2
  exit 1
fi

cd "${ROOT_DIR}"

echo "📦  Uploading source maps for release: ${RELEASE_VERSION}"

if [[ -d "${ROOT_DIR}/apps/expo/dist" ]]; then
  echo "→ Uploading Expo web source maps..."
  pnpm exec -- sentry-cli sourcemaps upload \
    --release "${RELEASE_VERSION}" \
    --dist web \
    "${ROOT_DIR}/apps/expo/dist"
else
  echo "⚠️  Web build artifacts not found at apps/expo/dist. Skipping web upload."
fi

if [[ -d "${ROOT_DIR}/packages/supabase/functions/.build" ]]; then
  echo "→ Uploading Supabase Edge Functions source maps..."
  pnpm exec -- sentry-cli sourcemaps upload \
    --release "${RELEASE_VERSION}" \
    --dist deno \
    "${ROOT_DIR}/packages/supabase/functions/.build"
else
  echo "ℹ️  Supabase build directory not found. Skipping Edge Functions upload."
fi

echo "✅  Source map upload complete."

