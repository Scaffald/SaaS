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
# - A 20-minute EAS build that silently ships without a key is a bad day.
#
# CORRECTION (found by inspecting the shipped 1.17.0 / 11700 binary):
# this script used to say the rest of the vars "come from .env.production at
# build time". They do not. .env.production is gitignored and never reaches the
# EAS worker, so `dotenv.config()` there finds nothing. Only two sources reach a
# cloud build:
#
#   1. the `env` block of the profile in eas.json
#   2. EAS environment variables (`eas env:create --environment production`)
#
# The old check validated .env.production, live-pinged the Mapbox token in it,
# printed a row of ticks, and then shipped a build with no Mapbox token at all.
# Confident and wrong is worse than no check, so the required-var check now asks
# EAS what the BUILD will see.
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

# --- required vars: ask EAS what the BUILD will actually see --------------
#
# This is the check that matters. eas.json's `env` block plus EAS environment
# variables are the only two things a cloud build sees; a value that exists
# only in .env.production ships as undefined.
EAS_ENV_NAMES=$( (cd "$PROJECT_DIR" && pnpm exec eas env:list --environment production --format short 2>/dev/null) | sed 's/=.*//' )
EAS_JSON_NAMES=$(node -e "
  const p=require('./$PROJECT_DIR/eas.json');
  console.log(Object.keys(p.build?.production?.env||{}).join('\n'));
" 2>/dev/null)

missing=()
for var in "${REQUIRED_VARS[@]}"; do
  if ! printf '%s\n' "$EAS_ENV_NAMES" | grep -qx "$var" \
     && ! printf '%s\n' "$EAS_JSON_NAMES" | grep -qx "$var"; then
    missing+=("$var")
  fi
done

if [ ${#missing[@]} -ne 0 ]; then
  echo "✗ These vars will NOT reach the build — the binary ships without them:"
  printf '    - %s\n' "${missing[@]}"
  echo
  echo "  Having them in $ENV_FILE is not enough. That file is gitignored and"
  echo "  never reaches the EAS worker. Register each one with:"
  echo
  for var in "${missing[@]}"; do
    echo "    (cd $PROJECT_DIR && pnpm exec eas env:create --environment production \\"
    echo "        --name $var --value '<value>' --visibility sensitive)"
  done
  echo
  echo "  This is exactly how 1.17.0 / 11700 shipped to TestFlight with no"
  echo "  Mapbox token: the old check looked in $ENV_FILE and said OK."
  exit 1
fi
echo "✓ All ${#REQUIRED_VARS[@]} required vars are registered where the build can see them"



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
# NOTE: this pings the token in .env.production — your LOCAL value. It says the
# token is alive; it does NOT say the build will carry it. The check above is
# the one that answers that.
echo -n "  Pinging Mapbox geocoding API to verify the local token… "
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
# EAS holds POSTHOG_KEY_PROD as a project env var because eas.json references
# ${POSTHOG_KEY_PROD}. Warn (don't block) if missing — the build will still
# complete; PostHog analytics just won't fire. Remove the
# ${POSTHOG_KEY_PROD} reference from eas.json if you don't want PostHog.
#
# Uses `eas env:list` (the post-secret:list-deprecation command). The output
# prints one VAR=value (or VAR=***** for secrets) per line per environment.
echo -n "  Verifying EAS env var POSTHOG_KEY_PROD is registered (production)… "
if (cd "$PROJECT_DIR" && pnpm exec eas env:list --environment production --format short 2>/dev/null \
      | grep -q '^POSTHOG_KEY_PROD='); then
  echo "ok"
else
  echo "MISSING"
  echo "⚠  EAS env var POSTHOG_KEY_PROD is not registered for the production"
  echo "   environment. PostHog analytics won't fire in this build. To set it:"
  echo "     cd $PROJECT_DIR && pnpm exec eas env:create production --name POSTHOG_KEY_PROD --value <value> --visibility secret"
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
