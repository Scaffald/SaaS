#!/usr/bin/env bash
# radium-check.sh — Grep-based constraint checker for known-bad patterns
# Run: pnpm radium:check
# This is informational, not a hard blocker.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

ERRORS=0

echo "Radium Constraint Check"
echo "======================"
echo ""

# 1. Wrong color token access (colors.background instead of colors.bg)
echo -n "Checking color tokens... "
HITS=$(grep -rn 'colors\.background\[' apps/ packages/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -n "$HITS" ]; then
  echo -e "${RED}FAIL${NC}"
  echo "  Use colors.bg[theme] instead of colors.background[theme]:"
  echo "$HITS" | head -10 | sed 's/^/    /'
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# 2. Missing theme dimension in color tokens
echo -n "Checking theme dimension... "
HITS=$(grep -rn 'colors\.text\.primary\|colors\.text\.secondary\|colors\.border\.default' apps/ packages/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v 'packages/scaffald-ui/src/' || true)
if [ -n "$HITS" ]; then
  echo -e "${RED}FAIL${NC}"
  echo "  Missing [theme] dimension — use colors.text[theme].primary:"
  echo "$HITS" | head -10 | sed 's/^/    /'
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# 3. useWindowDimensions in dashboard/drawer files
echo -n "Checking useWindowDimensions in layouts... "
HITS=$(grep -rn 'useWindowDimensions' apps/scaffald/app/dashboard/ packages/scf-core/components/layouts/ packages/scf-core/features/drawer/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)
if [ -n "$HITS" ]; then
  echo -e "${YELLOW}WARN${NC}"
  echo "  Use useResponsive from @scaffald/ui instead:"
  echo "$HITS" | head -10 | sed 's/^/    /'
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# 4. @hookform/resolvers version check
echo -n "Checking @hookform/resolvers version... "
HITS=$(grep -A1 '@hookform/resolvers' pnpm-workspace.yaml 2>/dev/null | grep -E '5\.' || true)
if [ -n "$HITS" ]; then
  echo -e "${RED}FAIL${NC}"
  echo "  @hookform/resolvers must be ~3.1.0, not 5.x (incompatible with react-hook-form@7)"
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

# 5. Vitest poolOptions (removed in Vitest 4)
echo -n "Checking Vitest pool config... "
HITS=$(grep -rn 'poolOptions' vitest.config.ts packages/*/vitest.config.ts apps/*/vitest.config.ts 2>/dev/null || true)
if [ -n "$HITS" ]; then
  echo -e "${YELLOW}WARN${NC}"
  echo "  poolOptions was removed in Vitest 4 — use top-level minThreads/maxThreads:"
  echo "$HITS" | head -10 | sed 's/^/    /'
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}Found $ERRORS constraint violation(s)${NC}"
  echo "See .radium/ docs for correct patterns."
  exit 1
else
  echo -e "${GREEN}All constraints passed${NC}"
  exit 0
fi
