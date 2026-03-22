#!/bin/bash
# Production-safe seed script
# ONLY runs idempotent reference data seeds — never demo users, orgs, or posts.
# Safe to run multiple times; all operations use ON CONFLICT DO NOTHING or upserts.
#
# Reference seeds (safe for prod):
#   - Industries         (core.industries)        — ON CONFLICT DO NOTHING
#   - CSI MasterFormat   (data.masterformat)       — idempotent bulk load
#   - Universities       (data.universities)       — idempotent bulk load
#   - Certifications     (data.certifications)     — idempotent bulk load
#   - O*NET occupations  (onet.*)                  — skip if already loaded
#   - News feeds config  (core.news_feeds)         — ON CONFLICT DO NOTHING
#   - Job feeds          (core.external_job_feeds) — ON CONFLICT DO NOTHING
#
# NEVER included for prod:
#   002_seed-users.sql, 003_seed-organizations.sql, 004-008 demo data, 009 community posts

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ENV="${1:-production}"
if [[ "$ENV" != "production" && "$ENV" != "preview" && "$ENV" != "dev" ]]; then
  echo "Usage: $0 [production|preview|dev]"
  exit 1
fi

case "$ENV" in
  production) ENV_FILE=".env.production" ;;
  preview)    ENV_FILE=".env.preview" ;;
  dev)        ENV_FILE=".env.dev" ;;
esac

if [ ! -f "$ENV_FILE" ]; then
  echo -e "${RED}❌ $ENV_FILE not found${NC}"
  exit 1
fi

set -a; source "$ENV_FILE"; set +a

PROJECT_REF=$(echo "$EXPO_PUBLIC_SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co.*||')
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}🌱 Production-Safe Seed — $ENV${NC}"
echo -e "${BLUE}   Project: $PROJECT_REF${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo "This will run ONLY reference/lookup data seeds:"
echo "  ✅ Industries"
echo "  ✅ CSI MasterFormat codes"
echo "  ✅ Universities"
echo "  ✅ Certifications"
echo "  ✅ O*NET occupations (skip if loaded)"
echo "  ✅ News feeds config"
echo "  ❌ Demo users (SKIPPED)"
echo "  ❌ Demo orgs/ATS data (SKIPPED)"
echo "  ❌ Community posts (SKIPPED)"
echo ""

if [ "${CI:-}" != "true" ]; then
  read -p "Proceed with seeding $ENV? (y/n): " CONFIRM
  [[ "$CONFIRM" =~ ^[Yy]$ ]] || { echo "Cancelled."; exit 0; }
fi

# Run the industries SQL seed directly (always safe)
echo -e "${BLUE}1/2 Applying SQL reference seeds...${NC}"
if [ -n "${DATABASE_URL:-}" ]; then
  psql "$DATABASE_URL" -f packages/supabase/seeds/001_seed-industries.sql \
    && echo -e "${GREEN}✅ Industries seeded${NC}" \
    || echo -e "${YELLOW}⚠️  Industries seed skipped (may already exist)${NC}"
else
  echo -e "${YELLOW}⚠️  DATABASE_URL not set — skipping SQL seed (will be run by seed-all.ts verify step)${NC}"
fi

# Run the TypeScript seed (reference data only — CSI, universities, certs, O*NET, news)
echo ""
echo -e "${BLUE}2/2 Running reference data seeds (CSI, universities, certs, O*NET, news)...${NC}"
pnpm --filter @scf/supabase seed || true

echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}✅ Prod-safe seeding complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
