#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-}"

# Interactive prompt if no flag
if [[ -z "$MODE" ]]; then
  echo ""
  echo "  Scaffald Dev Mode"
  echo ""
  echo "  1) Local   — Docker + local Supabase (full stack)"
  echo "  2) Remote  — Sandbox Supabase (frontend only, no Docker)"
  echo ""
  read -rp "  Choose [1/2]: " choice
  case "$choice" in
    1) MODE="--local" ;;
    2) MODE="--remote" ;;
    *) echo "Invalid choice"; exit 1 ;;
  esac
fi

case "$MODE" in
  --local)
    echo ""
    echo "  ━━━ LOCAL MODE ━━━"
    echo "  Supabase: http://127.0.0.1:54321"
    echo "  Starting Docker + local Supabase..."
    echo ""
    pnpm supa start
    echo ""
    echo "  Starting app..."
    pnpm dev
    ;;
  --remote)
    echo ""
    echo "  ━━━ REMOTE MODE (sandbox) ━━━"
    echo "  Supabase: https://pmtdqrfpumqwkdhpgwcz.supabase.co"
    echo "  Skipping Docker — using remote sandbox database"
    echo ""
    echo "  Starting app..."
    APP_ENV=dev dotenv -e .env.dev -- pnpm dev
    ;;
  *)
    echo "Usage: ./scripts/dev.sh [--local|--remote]"
    exit 1
    ;;
esac
