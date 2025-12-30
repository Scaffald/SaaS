#!/bin/bash
# Development script for Forsured that checks Supabase status before starting
# 
# This script:
# 1. Checks if Supabase is running
# 2. If not, attempts to start it automatically
# 3. Waits for Supabase to be ready
# 4. Starts the Forsured development server

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║              Forsured Development Server                  ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Supabase is running
echo -e "${YELLOW}🔍 Checking Supabase status...${NC}"
if ! bash "$SCRIPT_DIR/check-supabase.sh" > /dev/null 2>&1; then
  echo -e "${RED}❌ Supabase is not running!${NC}"
  echo ""
  echo -e "${YELLOW}   Starting Supabase automatically...${NC}"
  echo ""
  
  # Change to project root to run Supabase commands
  cd "$PROJECT_ROOT"
  
  # Start Supabase in the background
  # Use the existing supabase-start.sh script if it exists, otherwise use pnpm supa start
  if [ -f "$SCRIPT_DIR/supabase-start.sh" ]; then
    bash "$SCRIPT_DIR/supabase-start.sh" > /dev/null 2>&1 &
    SUPABASE_PID=$!
  else
    pnpm supa start > /dev/null 2>&1 &
    SUPABASE_PID=$!
  fi
  
  # Wait for Supabase to be ready
  echo -e "${YELLOW}   Waiting for Supabase to start (this may take 10-30 seconds)...${NC}"
  MAX_RETRIES=60  # Increased to 60 seconds for slower systems
  RETRY_COUNT=0
  
  while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if bash "$SCRIPT_DIR/check-supabase.sh" > /dev/null 2>&1; then
      echo -e "${GREEN}✅ Supabase is now running${NC}"
      echo ""
      break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    sleep 1
    
    # Show progress every 5 seconds
    if [ $((RETRY_COUNT % 5)) -eq 0 ]; then
      echo -e "${YELLOW}   Still waiting... (${RETRY_COUNT}s)${NC}"
    fi
  done
  
  if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo ""
    echo -e "${RED}❌ Supabase failed to start within ${MAX_RETRIES} seconds${NC}"
    echo -e "${YELLOW}   Please start Supabase manually in another terminal:${NC}"
    echo -e "   ${BLUE}pnpm supa start${NC}"
    echo ""
    echo -e "${YELLOW}   Then run this command again:${NC}"
    echo -e "   ${BLUE}pnpm dev:forsured${NC}"
    echo ""
    exit 1
  fi
else
  echo -e "${GREEN}✅ Supabase is running${NC}"
  echo ""
fi

# Start the dev server
echo -e "${BLUE}🚀 Starting Forsured development server...${NC}"
echo ""

# Run the actual dev command
cd "$PROJECT_ROOT"
pnpm --filter @unicornlove/forsured-app dev

