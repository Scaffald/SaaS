#!/usr/bin/env bash
#
# Publish the contact form's NevarMail settings (NEVARMAIL_API_KEY and
# NEVARMAIL_USE_CASE_CONTACT) from .env into the EAS environments (#1389).
#
#   ./scripts/set-nevarmail-eas-env.sh                 # all three environments
#   ./scripts/set-nevarmail-eas-env.sh production      # just one
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

VARS=(NEVARMAIL_API_KEY NEVARMAIL_USE_CASE_CONTACT)

# `cut -d= -f2-` keeps everything after the first =, so a value containing an
# equals sign survives.
read_var() {
  grep -m1 "^$1=" "$ENV_FILE" | cut -d= -f2- | tr -d '"'"'"' \r\n' || true
}

for var in "${VARS[@]}"; do
  value="$(read_var "$var")"
  if [ -z "$value" ]; then
    echo "❌ $var is missing or empty in $ENV_FILE." >&2
    echo "   NEVARMAIL_API_KEY comes from the NevarMail project's API keys page;" >&2
    echo "   NEVARMAIL_USE_CASE_CONTACT is the id of its \"Scaffald contact\" use case." >&2
    exit 1
  fi
  # bash 3.2 (macOS) has no associative arrays; keep each in VALUE_<name>.
  printf -v "VALUE_$var" '%s' "$value"
  echo "Read $var from .env (${#value} characters)"
done
echo

cd "$APP_DIR"

for env_name in "${ENVIRONMENTS[@]}"; do
  echo "── $env_name ──"
  for var in "${VARS[@]}"; do
    ref="VALUE_$var"
    $EAS env:set \
      --name "$var" \
      --value "${!ref}" \
      --type string \
      --visibility sensitive \
      --scope project \
      --environment "$env_name" \
      --non-interactive
  done
done

echo
echo "Verifying:"
for env_name in "${ENVIRONMENTS[@]}"; do
  listing=$($EAS env:list --environment "$env_name" 2>/dev/null || true)
  for var in "${VARS[@]}"; do
    if grep -q "^$var=" <<<"$listing"; then
      echo "  ✅ $env_name $var"
    else
      echo "  ❌ $env_name $var — not present after set"
      exit 1
    fi
  done
done

echo
echo "RESEND_API_KEY is no longer read by the app; remove it from EAS once the"
echo "NevarMail contact form is verified (#1391)."
echo
echo "Now deploy. --prod picks the URL; --environment picks the variables:"
echo "  cd apps/scaffald && npx eas-cli@latest deploy --prod --environment production --non-interactive"
