#!/bin/bash
# Seed App Store reviewer demo accounts into production.
#
# Creates:
#   reviewer-worker@scaffald.com   (worker persona — Alex Martinez, welder, Detroit MI)
#   reviewer-employer@scaffald.com (employer persona — Jamie Chen, Apex Mechanical Inc.)
#
# Password for both accounts: Scaffald2026!
#
# What this seeds:
#   - Two auth users with email/password credentials
#   - Profiles, preferences, prerequisites completed (skip onboarding)
#   - Apex Mechanical Inc. organization owned by the employer account
#   - 3 open trade jobs at Apex (Pipe Welder, HVAC Tech, Scaffold Foreman)
#   - A pre-submitted application from the worker to Pipe Welder
#
# Safe to re-run: all inserts use ON CONFLICT DO NOTHING / idempotent UPDATEs.
#
# Usage (from repo root):
#   ./scripts/seed-app-review-prod.sh
#
# Requires: psql, .env.production at repo root

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$REPO_ROOT/.env.production"
SEED_FILE="$REPO_ROOT/packages/supabase/seeds/010_seed-app-review-accounts.sql"

# ── Preflight ──────────────────────────────────────────────────────────────────

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ .env.production not found at $ENV_FILE${NC}"
  exit 1
fi

if [ ! -f "$SEED_FILE" ]; then
  echo -e "${RED}❌ Seed file not found: $SEED_FILE${NC}"
  exit 1
fi

PSQL="$(command -v psql 2>/dev/null || echo /opt/homebrew/opt/libpq/bin/psql)"
if [ ! -x "$PSQL" ]; then
  echo -e "${RED}❌ psql not found — install it with: brew install libpq && brew link --force libpq${NC}"
  exit 1
fi

set -a; source "$ENV_FILE"; set +a

if [ -z "${DATABASE_URL:-}" ]; then
  echo -e "${RED}❌ DATABASE_URL not set in $ENV_FILE${NC}"
  exit 1
fi

# ── Confirmation prompt ────────────────────────────────────────────────────────

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  App Store Review Accounts — PRODUCTION Seed             ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  This will create the following in PRODUCTION:"
echo ""
echo "  👷 reviewer-worker@scaffald.com     (Alex Martinez, welder)"
echo "  🏢 reviewer-employer@scaffald.com   (Jamie Chen, Apex Mechanical Inc.)"
echo "  🏗  Apex Mechanical Inc. organization + 3 open jobs"
echo "  📋 Pre-submitted application (worker → Pipe Welder job)"
echo ""
echo "  Password for both accounts: Scaffald2026!"
echo ""
echo -e "${YELLOW}  ⚠️  This runs against your PRODUCTION database.${NC}"
echo ""

if [ "${CI:-}" != "true" ]; then
  read -p "  Proceed? (y/n): " CONFIRM
  [[ "$CONFIRM" =~ ^[Yy]$ ]] || { echo "  Cancelled."; exit 0; }
fi

# ── Run seed ───────────────────────────────────────────────────────────────────

echo ""
echo -e "${BLUE}Running seed...${NC}"
echo ""

"$PSQL" "$DATABASE_URL" -f "$SEED_FILE" \
  --set ON_ERROR_STOP=1 \
  --quiet

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  ✅ App Review accounts seeded successfully!             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "  Accounts ready:"
echo "  👷 reviewer-worker@scaffald.com     / Scaffald2026!"
echo "  🏢 reviewer-employer@scaffald.com   / Scaffald2026!"
echo ""
echo "  Verify by signing into the app on a fresh device with each account."
echo "  Worker:   Jobs tab → map should show Apex Mechanical jobs in Detroit"
echo "  Employer: Dashboard → Jobs → Pipe Welder → Applications → Alex Martinez"
echo ""
echo "  Copy the reviewer notes from:"
echo "  app-store-assets/snippets/app-review-notes.md"
echo "  and paste into App Store Connect → App Review Information → Notes."
echo ""
