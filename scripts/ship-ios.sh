#!/usr/bin/env bash
#
# scripts/ship-ios.sh — validate env, kick off production iOS build, auto-submit to TestFlight.
#
# Usage:
#   pnpm ship:ios            # validates env, asks for confirmation, then builds + auto-submits
#   pnpm ship:ios --yes      # skip the confirmation prompt
#   pnpm ship:ios --no-build # just validate; don't actually run eas build
#
# Why this script exists:
# - `eas build --profile production` is a long, fragile command. Easy to forget --no-wait,
#   --auto-submit, or to run it from the wrong directory with the wrong env.
# - The eas.json production profile only sets a handful of env vars. The rest
#   (Mapbox, Google OAuth, redirect URIs) come from .env.production at build time
#   and are easy to miss — a 20-minute EAS build that silently fails because a key
#   is empty is a bad day.
#
# What this script checks before kicking off the build:
# - You're on main (warns if not).
# - .env.production exists.
# - Every required EXPO_PUBLIC_* env var is present and non-empty.
# - Mapbox token looks structurally valid AND succeeds on a live geocoding ping.
# - Supabase URL is https.
# - EAS POSTHOG_KEY_PROD secret is registered on the server.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# --- args -----------------------------------------------------------------
SKIP_CONFIRM=0
NO_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --yes|-y)    SKIP_CONFIRM=1 ;;
    --no-build)  NO_BUILD=1 ;;
    *) echo "usage: pnpm ship:ios [--yes] [--no-build]" >&2; exit 2 ;;
  esac
done

ENV_FILE=".env.production"
PROJECT_DIR="apps/scaffald"

# EXPO_PUBLIC_* vars that the app actually reads from process.env *and* aren't
# already set by eas.json's production profile. Only list things grep
# confirms are referenced in apps/ or packages/. Cruft env keys (style URLs,
# Google Maps key, Supabase redirect URI) live in .env files but no code
# reads them — don't block builds on those.
REQUIRED_VARS=(
  EXPO_PUBLIC_MAPBOX_TOKEN
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
  EXPO_PUBLIC_GOOGLE_IOS_SCHEME
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
)

# Recommended but not strictly required — app.config.ts has fallbacks.
# Warn if missing, don't block the build.
RECOMMENDED_VARS=(
  MAPBOX_DOWNLOADS_TOKEN
)

# --- branch check ---------------------------------------------------------
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "⚠  Not on main (currently: $BRANCH). The build will compile this branch."
  if [ "$SKIP_CONFIRM" = "0" ]; then
    read -r -p "  Continue anyway? [y/N] " ANSWER
    case "$ANSWER" in y|Y) ;; *) echo aborted.; exit 0 ;; esac
  fi
fi

# --- .env.production exists -----------------------------------------------
if [ ! -f "$ENV_FILE" ]; then
  echo "✗ $ENV_FILE not found at $(pwd)"
  echo "  Copy .env.template to .env.production and fill in production values."
  exit 1
fi

# Extract a value from $ENV_FILE without sourcing it (sourcing can leak side effects).
get_env() {
  grep -E "^${1}=" "$ENV_FILE" | head -1 | sed "s/^${1}=//" | sed 's/^"\(.*\)"$/\1/' | sed "s/^'\(.*\)'$/\1/"
}

# --- required vars present + non-empty ------------------------------------
missing=()
todo=()
for var in "${REQUIRED_VARS[@]}"; do
  val=$(get_env "$var" || true)
  if [ -z "$val" ]; then
    missing+=("$var")
  elif [ "$val" = "TODO" ] || [[ "$val" =~ ^pk\.your_ ]] || [[ "$val" =~ your_.*_here$ ]]; then
    todo+=("$var=$val")
  fi
done

if [ ${#missing[@]} -ne 0 ] || [ ${#todo[@]} -ne 0 ]; then
  echo "✗ $ENV_FILE has problems:"
  if [ ${#missing[@]} -ne 0 ]; then
    echo "  Missing or empty:"
    printf '    - %s\n' "${missing[@]}"
  fi
  if [ ${#todo[@]} -ne 0 ]; then
    echo "  Placeholder values that look unset:"
    printf '    - %s\n' "${todo[@]}"
  fi
  exit 1
fi
echo "✓ All ${#REQUIRED_VARS[@]} required env vars present in $ENV_FILE"

# Soft check on recommended vars — warn only, don't block.
soft_missing=()
for var in "${RECOMMENDED_VARS[@]}"; do
  val=$(get_env "$var" || true)
  if [ -z "$val" ]; then
    soft_missing+=("$var")
  fi
done
if [ ${#soft_missing[@]} -ne 0 ]; then
  echo "⚠  Recommended vars missing in $ENV_FILE (app.config.ts has fallbacks, but consider setting):"
  printf '    - %s\n' "${soft_missing[@]}"
fi

# --- shape checks on critical values --------------------------------------
MAPBOX_TOKEN=$(get_env EXPO_PUBLIC_MAPBOX_TOKEN)
if [[ ! "$MAPBOX_TOKEN" =~ ^(pk|sk)\..+ ]]; then
  echo "✗ EXPO_PUBLIC_MAPBOX_TOKEN doesn't match Mapbox token shape (expected pk.* or sk.*)"
  exit 1
fi

SUPA_URL_FROM_EAS="https://auth.scaffald.com"   # the eas.json production profile hard-codes this
SUPA_URL_FROM_ENV=$(get_env EXPO_PUBLIC_SUPABASE_URL || true)
if [ -n "$SUPA_URL_FROM_ENV" ] && [[ ! "$SUPA_URL_FROM_ENV" =~ ^https:// ]]; then
  echo "✗ EXPO_PUBLIC_SUPABASE_URL in $ENV_FILE must be https://"
  exit 1
fi

# --- live ping the Mapbox token ------------------------------------------
echo -n "  Pinging Mapbox geocoding API to verify token… "
if curl -sS --max-time 6 -o /dev/null -w "%{http_code}" \
     "https://api.mapbox.com/geocoding/v5/mapbox.places/test.json?access_token=${MAPBOX_TOKEN}&limit=1" \
   | grep -q '^200$'; then
  echo "ok"
else
  echo "FAILED"
  echo "✗ Mapbox API returned non-200. Token may be revoked, scoped wrong, or network is down."
  exit 1
fi

# --- check EAS server-side secrets ----------------------------------------
# EAS holds POSTHOG_KEY_PROD as a secret because eas.json references ${POSTHOG_KEY_PROD}.
# Warn (don't block) if missing — the build will still complete; PostHog
# analytics just won't fire. Remove the ${POSTHOG_KEY_PROD} reference from
# eas.json if you genuinely don't want PostHog in production.
echo -n "  Verifying EAS secret POSTHOG_KEY_PROD is registered… "
if (cd "$PROJECT_DIR" && pnpm exec eas secret:list --json 2>/dev/null \
      | grep -q '"name": *"POSTHOG_KEY_PROD"'); then
  echo "ok"
else
  echo "MISSING"
  echo "⚠  EAS secret POSTHOG_KEY_PROD is not registered. PostHog analytics"
  echo "   won't fire in this build. To set it:"
  echo "     cd $PROJECT_DIR && pnpm exec eas secret:create --name POSTHOG_KEY_PROD --value <value>"
  echo "   Or remove the \${POSTHOG_KEY_PROD} reference from apps/scaffald/eas.json."
fi

echo
echo "  Branch:   $BRANCH"
echo "  Profile:  production (iOS, distribution=store)"
echo "  Submit:   --auto-submit (build will land on TestFlight automatically)"
echo

# --- confirm + build ------------------------------------------------------
if [ "$NO_BUILD" = "1" ]; then
  echo "  --no-build: env validated, exiting without kicking off EAS."
  exit 0
fi

if [ "$SKIP_CONFIRM" = "0" ]; then
  read -r -p "  Kick off EAS production iOS build + auto-submit to TestFlight? [y/N] " ANSWER
  case "$ANSWER" in y|Y) ;; *) echo aborted.; exit 0 ;; esac
fi

echo
echo "  Starting EAS build (this terminal returns immediately because of --no-wait)…"
echo
cd "$PROJECT_DIR"
APP_ENV=production NODE_ENV=production exec pnpm exec eas build \
  --profile production --platform ios --non-interactive --no-wait --auto-submit
