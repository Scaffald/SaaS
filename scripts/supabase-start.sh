#!/bin/bash
# Supabase Start Script with Conditional Mailpit
#
# Conditionally enables Mailpit based on:
# 1. Development mode (apps use magic links)
# 2. Tests running (any app)
#
# Usage: ./scripts/supabase-start.sh

set -e

# Load environment variables from .env if it exists
if [ -f .env ]; then
  # Use a safer method to load env vars (handles values with spaces/special chars)
  set -a
  source .env
  set +a
fi

# Also load .env.test if we're in test mode or if .env.test exists and NODE_ENV is test
if [ "$NODE_ENV" = "test" ] || [ -n "$CI" ] || [ -n "$PLAYWRIGHT" ]; then
  if [ -f .env.test ]; then
    echo "📋 Loading .env.test for test environment..."
    set -a
    source .env.test
    set +a
  fi
fi

# Determine if Mailpit should be enabled
ENABLE_MAILPIT=false

# Case 1: Development mode — apps use magic links, always need Mailpit
if [ "$NODE_ENV" = "development" ]; then
  ENABLE_MAILPIT=true
  echo "✓ Mailpit enabled: Development mode (apps use magic links)"
fi

# Case 2: Tests running (any app) - Mailpit needed for email testing
if [ -n "$CI" ] || [ "$NODE_ENV" = "test" ] || [ -n "$PLAYWRIGHT" ] || [ -n "$TEST" ] || [ -n "$RUNNING_TESTS" ]; then
  ENABLE_MAILPIT=true
  echo "✓ Mailpit enabled: Tests running"
fi

# Override with explicit ENABLE_MAILPIT env var if set
if [ -n "$ENABLE_MAILPIT_OVERRIDE" ]; then
  ENABLE_MAILPIT="$ENABLE_MAILPIT_OVERRIDE"
  echo "✓ Mailpit override: $ENABLE_MAILPIT"
fi

# Update config.toml to enable/disable Mailpit
CONFIG_FILE="packages/supabase/config.toml"
BACKUP_FILE="${CONFIG_FILE}.bak"

# Create backup
cp "$CONFIG_FILE" "$BACKUP_FILE" 2>/dev/null || true

if [ "$ENABLE_MAILPIT" = "true" ]; then
  TARGET_VAL="true"
else
  TARGET_VAL="false"
fi

# Update enabled in [inbucket] section only, using python for reliable TOML section scoping
python3 -c "
import sys
target = '$TARGET_VAL'
lines = open('$CONFIG_FILE').readlines()
in_inbucket = False
found = False
out = []
for line in lines:
    s = line.strip()
    if s.startswith('['):
        in_inbucket = (s == '[inbucket]')
    if in_inbucket and s.startswith('enabled ='):
        found = True
        line = 'enabled = ' + target + '\n'
    out.append(line)
open('$CONFIG_FILE', 'w').writelines(out)
sys.exit(0 if found else 1)
" && echo "✓ Set Mailpit enabled=$TARGET_VAL in config.toml" || {
    # No enabled key found in [inbucket] section at all — insert one
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "/^\[inbucket\]/a\\
enabled = $TARGET_VAL
" "$CONFIG_FILE"
    else
      sed -i "/^\[inbucket\]/a enabled = $TARGET_VAL" "$CONFIG_FILE"
    fi
    echo "✓ Added enabled=$TARGET_VAL to [inbucket] in config.toml"
  }

# Start Supabase with explicit GOTRUE_SITE_URL to override defaults
# This ensures magic links use the correct redirect URL
# Read from environment variables (can be set in .env or .env.test)
# Priority: GOTRUE_SITE_URL > APP_URL > default
if [ -z "$GOTRUE_SITE_URL" ]; then
  if [ -n "$APP_URL" ]; then
    export GOTRUE_SITE_URL="$APP_URL"
  else
    export GOTRUE_SITE_URL="http://localhost:5173"
  fi
fi

# Build allow list from site URL if not explicitly set
if [ -z "$GOTRUE_URI_ALLOW_LIST" ]; then
  BASE_URL=$(echo "$GOTRUE_SITE_URL" | sed 's|\(https\?://[^/]*\).*|\1|')
  export GOTRUE_URI_ALLOW_LIST="${BASE_URL},${BASE_URL}/auth/callback,http://127.0.0.1:5173,http://127.0.0.1:5173/auth/callback,http://127.0.0.1:8081"
fi

# Raise file watcher limit so Edge Functions don't stop with "too many files" in the monorepo
export SUPABASE_FUNCTIONS_WATCH_LIMIT="${SUPABASE_FUNCTIONS_WATCH_LIMIT:-4000}"

echo "Starting Supabase with:"
echo "  GOTRUE_SITE_URL=$GOTRUE_SITE_URL"
echo "  GOTRUE_URI_ALLOW_LIST=$GOTRUE_URI_ALLOW_LIST"

# Export environment variables so Docker Compose can read them
# The docker-compose.override.yml will use env_file to load .env.test when it exists
# We also export them here as a fallback in case env_file doesn't work
if [ "$NODE_ENV" = "test" ] || [ -n "$CI" ] || [ -n "$PLAYWRIGHT" ] || [ -n "$TEST" ] || [ -n "$RUNNING_TESTS" ]; then
  if [ -f .env.test ]; then
    echo "📋 Environment variables from .env.test are loaded and will be passed to Docker containers"
    echo "   Docker Compose will also read .env.test via env_file directive in docker-compose.override.yml"
  fi
fi

# Check if Supabase is in a bad state (thinks it's running but containers are dead)
# If so, stop it first to clean up the state
echo "🔍 Checking Supabase status..."
if pnpm env-local pnpx supabase --workdir packages status > /dev/null 2>&1; then
  # Supabase reports it's running - check if containers are actually running
  if ! curl -s --max-time 2 http://127.0.0.1:54321/rest/v1/ > /dev/null 2>&1; then
    echo "⚠️  Supabase reports running but API is not responding"
    echo "   Stopping Supabase to clean up state..."
    pnpm env-local pnpx supabase --workdir packages stop > /dev/null 2>&1 || true
    sleep 2
  fi
fi

# Start Supabase - Docker Compose will automatically read .env.test via env_file in override file
# Environment variables are already exported above, so they're available to Docker Compose
pnpm env-local pnpx supabase --workdir packages start "$@"
