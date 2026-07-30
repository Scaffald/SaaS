#!/usr/bin/env bash
#
# Publish RESEND_API_KEY from .env into the EAS environments that need it.
#
#   ./scripts/set-resend-eas-env.sh                 # all three environments
#   ./scripts/set-resend-eas-env.sh production      # just one
#
# Exists because the equivalent one-liner is easy to get wrong in ways that
# fail quietly:
#
#   - `--visibility secret` is only decryptable inside the EAS *build*
#     environment, so the EAS Hosting worker receives nothing and the API route
#     returns 503 while the deploy reports success. Server-side config must be
#     `sensitive`.
#   - a `$(grep …)` substitution that finds nothing yields an empty --value,
#     and the variable gets created empty rather than erroring.
#   - the path to .env depends on the working directory, so a copy-pasted
#     command works from the repo root and silently does something else from
#     apps/scaffald.
#
# This resolves the repo root itself, refuses to continue on an empty value,
# and lists the result back.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env"
APP_DIR="$REPO_ROOT/apps/scaffald"
EAS="npx eas-cli@latest"

ENVIRONMENTS=("$@")
if [ ${#ENVIRONMENTS[@]} -eq 0 ]; then
  ENVIRONMENTS=(production preview development)
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ $ENV_FILE not found." >&2
  exit 1
fi

# `cut -d= -f2-` keeps everything after the first =, so a value containing an
# equals sign survives.
KEY="$(grep -m1 '^RESEND_API_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '"'"'"' \r\n')"

if [ -z "$KEY" ]; then
  echo "❌ RESEND_API_KEY is missing or empty in $ENV_FILE." >&2
  echo "   Create one at https://resend.com/api-keys and add it there first." >&2
  exit 1
fi

if [[ "$KEY" != re_* ]]; then
  echo "❌ RESEND_API_KEY does not start with 're_' — that is not a Resend key." >&2
  exit 1
fi

echo "Read a ${#KEY}-character key from .env (prefix ${KEY:0:3}…)"
echo

cd "$APP_DIR"

for env_name in "${ENVIRONMENTS[@]}"; do
  echo "── $env_name ──"
  $EAS env:set \
    --name RESEND_API_KEY \
    --value "$KEY" \
    --type string \
    --visibility sensitive \
    --scope project \
    --environment "$env_name" \
    --non-interactive
done

echo
echo "Verifying:"
for env_name in "${ENVIRONMENTS[@]}"; do
  found=$($EAS env:list --environment "$env_name" 2>/dev/null | grep -c '^RESEND_API_KEY=' || true)
  if [ "$found" -ge 1 ]; then
    echo "  ✅ $env_name"
  else
    echo "  ❌ $env_name — not present after set"
    exit 1
  fi
done

echo
echo "Now deploy. --prod picks the URL; --environment picks the variables:"
echo "  cd apps/scaffald && npx eas-cli@latest deploy --prod --environment production --non-interactive"
