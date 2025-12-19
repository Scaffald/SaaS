#!/bin/bash
# Fix GoTrue Environment Variables After Supabase Start
# This script patches the GoTrue container to use the correct site URL
# Run this after starting Supabase to ensure magic links work correctly

set -e

echo "🔧 Fixing GoTrue environment variables..."

# Wait for Supabase to be ready
MAX_ATTEMPTS=30
ATTEMPT=0
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if docker ps | grep -q "supabase_auth_supabase"; then
    echo "✅ Supabase auth container is running"
    break
  fi
  ATTEMPT=$((ATTEMPT + 1))
  echo "⏳ Waiting for Supabase to start... (attempt $ATTEMPT/$MAX_ATTEMPTS)"
  sleep 2
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo "❌ Supabase auth container did not start in time"
  exit 1
fi

# Get container configuration and recreate with correct environment variables
echo "📝 Recreating auth container with correct environment variables..."

# Get the existing container's configuration BEFORE stopping it
CONTAINER_ID=$(docker ps --filter "name=supabase_auth_supabase" --format "{{.ID}}" | head -1)

if [ -z "$CONTAINER_ID" ]; then
  echo "❌ Auth container not found or not running"
  exit 1
fi

# Get the image and other configuration from the original container BEFORE stopping
echo "📋 Getting container configuration..."
IMAGE=$(docker inspect "$CONTAINER_ID" --format '{{.Config.Image}}' 2>/dev/null)
NETWORK=$(docker inspect "$CONTAINER_ID" --format '{{range $net, $conf := .NetworkSettings.Networks}}{{$net}}{{end}}' 2>/dev/null | head -1)
ALL_ENV=$(docker inspect "$CONTAINER_ID" --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null)

# Stop and remove the container
echo "🛑 Stopping and removing auth container..."
docker stop "$CONTAINER_ID" 2>/dev/null || true
docker rm "$CONTAINER_ID" 2>/dev/null || true

# Set environment variables
GOTRUE_SITE_URL="http://localhost:5173"
GOTRUE_URI_ALLOW_LIST="http://localhost:5173,http://localhost:5173/auth/callback,http://127.0.0.1:5173,http://127.0.0.1:5173/auth/callback,http://127.0.0.1:8081"

# Build environment variable arguments, filtering out the ones we're overriding
ENV_ARGS=""
while IFS= read -r line; do
  if [[ -n "$line" && "$line" != *"GOTRUE_SITE_URL"* && "$line" != *"GOTRUE_URI_ALLOW_LIST"* ]]; then
    ENV_ARGS="$ENV_ARGS -e \"$line\""
  fi
done <<< "$ALL_ENV"

# Recreate the container with the correct environment variables
echo "🔄 Creating new auth container with correct environment..."
echo "   Image: $IMAGE"
echo "   Network: $NETWORK"
echo "   GOTRUE_SITE_URL: $GOTRUE_SITE_URL"

# Use eval to properly handle the environment variables
eval docker run -d \
  --name supabase_auth_supabase \
  --network "$NETWORK" \
  -e "GOTRUE_SITE_URL=$GOTRUE_SITE_URL" \
  -e "GOTRUE_URI_ALLOW_LIST=$GOTRUE_URI_ALLOW_LIST" \
  $ENV_ARGS \
  "$IMAGE" \
  auth > /dev/null 2>&1

if [ $? -eq 0 ]; then
  echo "✅ Container recreated successfully"
else
  echo "❌ Failed to recreate container. Trying Supabase CLI restart..."
  # Fallback: restart Supabase
  cd packages/supabase || exit 1
  pnpx supabase stop > /dev/null 2>&1
  GOTRUE_SITE_URL="$GOTRUE_SITE_URL" \
  GOTRUE_URI_ALLOW_LIST="$GOTRUE_URI_ALLOW_LIST" \
  pnpx supabase start 2>&1 | tail -5
fi

# Wait for auth to be ready
echo "⏳ Waiting for auth service to be ready..."
sleep 5

# Verify the environment variables
if docker exec supabase_auth_supabase env 2>/dev/null | grep -q "GOTRUE_SITE_URL=http://localhost:5173"; then
  echo "✅ SUCCESS: GOTRUE_SITE_URL is set correctly!"
  docker exec supabase_auth_supabase env 2>/dev/null | grep "GOTRUE_SITE_URL"
  docker exec supabase_auth_supabase env 2>/dev/null | grep "GOTRUE_URI_ALLOW_LIST"
else
  echo "❌ WARNING: Environment variables may not be set correctly"
  echo "Current GOTRUE_SITE_URL:"
  docker exec supabase_auth_supabase env 2>/dev/null | grep "GOTRUE_SITE_URL" || echo "Not found"
fi

