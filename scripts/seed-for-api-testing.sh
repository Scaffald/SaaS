#!/usr/bin/env bash
# Seed database for API testing: reset DB (migrations + seeds/*.sql), optionally run TypeScript seed.
# Run from repo root: ./scripts/seed-for-api-testing.sh
# Use FULL_SEED=1 to also run pnpm supa:seed (CSI, jobs, etc.).

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

echo "Seeding database for API testing..."
echo ""

# Check if Supabase is running
if ! curl -sf http://127.0.0.1:54321/rest/v1/ > /dev/null 2>&1; then
  echo "Supabase is not running. Start it first:"
  echo "  pnpm supa start"
  exit 1
fi
echo "Supabase is running."

# Reset DB (migrations + all seeds/*.sql)
echo "Running: pnpm supa db reset"
pnpm supa db reset

if [ "${FULL_SEED}" = "1" ]; then
  echo "Running: pnpm supa:seed (FULL_SEED=1)"
  pnpm supa:seed
fi

echo ""
echo "Done. Next: serve the API in a separate terminal:"
echo "  pnpm supa functions serve api"
echo ""
echo "Then run API tests: pnpm test:api:all"
