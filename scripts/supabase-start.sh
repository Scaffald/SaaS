#!/bin/bash
# Supabase Start Script with Conditional Mailpit
#
# Conditionally enables Mailpit based on:
# 1. Development + VITE_FORSURED_USE_OAUTH=false (Forsured magic links)
# 2. Tests running (any app)
# 3. Scaffald app running (always uses magic links)
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

# Determine if Mailpit should be enabled
ENABLE_MAILPIT=false

# Case 1: Development + Forsured magic link mode
if [ "$NODE_ENV" = "development" ]; then
  # Check if Forsured is using magic links (VITE_FORSURED_USE_OAUTH=false or unset)
  if [ -z "$VITE_FORSURED_USE_OAUTH" ] || [ "$VITE_FORSURED_USE_OAUTH" = "false" ]; then
    ENABLE_MAILPIT=true
    echo "✓ Mailpit enabled: Development mode + Forsured magic link mode (VITE_FORSURED_USE_OAUTH=false)"
  fi
  
  # Case 3: Scaffald app always uses magic links
  # Scaffald always needs Mailpit because it uses magic links
  # We detect this by checking if we're running Scaffald-related commands
  # For Scaffald, Mailpit is always needed, so we enable it in development
  # (unless explicitly disabled)
  if [ "$ENABLE_MAILPIT" = "false" ]; then
    # If we're in development and not using Forsured OAuth, assume Scaffald needs Mailpit
    # This is a safe default since Scaffald always uses magic links
    ENABLE_MAILPIT=true
    echo "✓ Mailpit enabled: Development mode (Scaffald always uses magic links)"
  fi
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
  # Enable Mailpit in config
  if grep -q "^enabled = false" "$CONFIG_FILE" 2>/dev/null; then
    # macOS and Linux compatible sed
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' 's/^enabled = false/enabled = true/' "$CONFIG_FILE"
    else
      sed -i 's/^enabled = false/enabled = true/' "$CONFIG_FILE"
    fi
    echo "✓ Enabled Mailpit in config.toml"
  elif ! grep -q "^enabled = true" "$CONFIG_FILE" 2>/dev/null; then
    # Add enabled = true if not present (after [inbucket] line)
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' '/^\[inbucket\]/a\
enabled = true
' "$CONFIG_FILE"
    else
      sed -i '/^\[inbucket\]/a enabled = true' "$CONFIG_FILE"
    fi
    echo "✓ Added enabled = true to config.toml"
  fi
else
  # Disable Mailpit in config
  if grep -q "^enabled = true" "$CONFIG_FILE" 2>/dev/null; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' 's/^enabled = true/enabled = false/' "$CONFIG_FILE"
    else
      sed -i 's/^enabled = true/enabled = false/' "$CONFIG_FILE"
    fi
    echo "✓ Disabled Mailpit in config.toml"
  elif ! grep -q "^enabled = false" "$CONFIG_FILE" 2>/dev/null; then
    # Add enabled = false if not present
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' '/^\[inbucket\]/a\
enabled = false
' "$CONFIG_FILE"
    else
      sed -i '/^\[inbucket\]/a enabled = false' "$CONFIG_FILE"
    fi
    echo "✓ Added enabled = false to config.toml"
  fi
fi

# Start Supabase with explicit GOTRUE_SITE_URL to override defaults
# This ensures magic links use the correct redirect URL
# Export environment variables so Supabase CLI can use them when generating docker-compose
export GOTRUE_SITE_URL="http://localhost:5173"
export GOTRUE_URI_ALLOW_LIST="http://localhost:5173,http://localhost:5173/auth/callback,http://127.0.0.1:5173,http://127.0.0.1:5173/auth/callback,http://127.0.0.1:8081"

echo "Starting Supabase with GOTRUE_SITE_URL=$GOTRUE_SITE_URL"
echo "GOTRUE_URI_ALLOW_LIST=$GOTRUE_URI_ALLOW_LIST"

pnpm env-local pnpx supabase --workdir packages/scf-supabase start "$@"

# Fix GoTrue environment variables after Supabase starts
# This ensures magic links use the correct redirect URL
echo ""
echo "🔧 Applying GoTrue environment variable fixes..."
bash "$(dirname "$0")/fix-gotrue-env.sh" || {
  echo "⚠️  Warning: Could not apply GoTrue environment variable fixes"
  echo "   Magic links may still use the default redirect URL"
}

