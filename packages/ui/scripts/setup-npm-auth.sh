#!/bin/bash
# Helper script to set up npm authentication token

set -e

echo "🔐 Setting up NPM Authentication Token"
echo ""

if [ -z "$1" ]; then
  echo "Usage: $0 <npm-token>"
  echo ""
  echo "To get a token:"
  echo "1. Go to: https://www.npmjs.com/settings/unicornlove/tokens"
  echo "2. Generate new Automation token"
  echo "3. Copy the token"
  echo "4. Run: $0 YOUR_TOKEN_HERE"
  exit 1
fi

TOKEN="$1"
NPMRC="$HOME/.npmrc"

# Backup existing .npmrc if it exists
if [ -f "$NPMRC" ]; then
  cp "$NPMRC" "$NPMRC.backup.$(date +%Y%m%d_%H%M%S)"
  echo "✅ Backed up existing ~/.npmrc"
fi

# Remove existing auth token if present
if grep -q "//registry.npmjs.org/:_authToken" "$NPMRC" 2>/dev/null; then
  sed -i.bak '/\/\/registry\.npmjs\.org\/:_authToken/d' "$NPMRC"
  echo "✅ Removed existing auth token"
fi

# Add new token
echo "//registry.npmjs.org/:_authToken=${TOKEN}" >> "$NPMRC"
chmod 600 "$NPMRC"

echo "✅ Added authentication token to ~/.npmrc"
echo ""

# Verify
echo "🔍 Verifying authentication..."
if npm whoami > /dev/null 2>&1; then
  USERNAME=$(npm whoami)
  echo "✅ Authenticated as: $USERNAME"
else
  echo "❌ Authentication failed. Please check your token."
  exit 1
fi

echo ""
echo "✅ NPM authentication set up successfully!"
echo "   Token cached in ~/.npmrc (secure permissions: 600)"

