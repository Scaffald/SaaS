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

# 6. Literal styling ratchet (per-directory ceilings, #819)
echo -n "Checking literal styling ratchet... "
if LITERALS=$(node "$(dirname "$0")/lint/check-literal-ratchet.mjs" 2>&1); then
  echo -e "${GREEN}OK${NC}"
  echo "$LITERALS" | sed 's/^/    /'
else
  echo -e "${RED}FAIL${NC}"
  echo "$LITERALS" | sed 's/^/    /'
  ERRORS=$((ERRORS + 1))
fi

echo ""
# 7. Tamagui token strings as colours (#1038). Nothing resolves "$gray11" any
#    more: the Typography resolver passes it through as a custom CSS colour,
#    which is invalid, so the text silently inherits — dark-on-dark in dark
#    mode. Use a semantic name (color="secondary") or colors.*[theme].
echo -n "Checking Tamagui colour strings... "
HITS=$(git ls-files 'apps/*.tsx' 'packages/scf-core/*.tsx' 2>/dev/null | xargs grep -nE '(color|fill|stroke)="\$[a-z]+[0-9]+"' 2>/dev/null || true)
if [ -n "$HITS" ]; then
  echo -e "${RED}FAIL${NC}"
  echo '  Tamagui $tokens do not theme — use color="secondary" or colors.*[theme]:'
  echo "$HITS" | head -10 | sed 's/^/    /'
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}OK${NC}"
fi
echo ""

# 8. Light-only palette references in ui components (#1027). A reference to
#    colors.{bg,text,icon,border,fg}.light.* renders light in dark mode (the
#    InputAddon white box, SkeletonCard's white card) unless a .dark.
#    counterpart sits beside it. Theme branches are fine and not counted, on
#    one line (`isLight ? colors.text.light.x : colors.text.dark.x`) or, since
#    the count first overstated the problem by about half, across the three
#    lines on either side of a multi-line ternary. This is a ceiling: it may
#    only come down. Lower it when you fix some; never raise it.
LIGHT_ONLY_CEILING=49
echo -n "Checking light-only palette refs in packages/ui... "
LIGHT_ONLY=$(node -e '
const { readFileSync } = require("node:fs")
const { execSync } = require("node:child_process")
const files = execSync("git -C packages/ui ls-files src/components", { encoding: "utf8" })
  .split("\n").filter((f) => /\.(ts|tsx)$/.test(f) && !/(stories|__tests__|\.test\.)/.test(f))
const light = /colors\.(bg|text|icon|border|fg)\.light\./
const dark = /colors\.(bg|text|icon|border|fg)\.dark\./
for (const f of files) {
  const lines = readFileSync("packages/ui/" + f, "utf8").split("\n")
  lines.forEach((line, i) => {
    if (!light.test(line)) return
    if (lines.slice(Math.max(0, i - 3), i + 4).some((l) => dark.test(l))) return
    console.log(`packages/ui/${f}:${i + 1}:${line.trim()}`)
  })
}' 2>/dev/null || true)
LIGHT_ONLY_COUNT=$(printf '%s' "$LIGHT_ONLY" | grep -c . || true)
if [ "$LIGHT_ONLY_COUNT" -gt "$LIGHT_ONLY_CEILING" ]; then
  echo -e "${RED}FAIL${NC} ($LIGHT_ONLY_COUNT > $LIGHT_ONLY_CEILING)"
  echo "  New light-only palette reference(s) — read the theme (colors.*[theme]) instead:"
  echo "$LIGHT_ONLY" | tail -10 | sed 's/^/    /'
  ERRORS=$((ERRORS + 1))
elif [ "$LIGHT_ONLY_COUNT" -lt "$LIGHT_ONLY_CEILING" ]; then
  echo -e "${YELLOW}OK${NC} ($LIGHT_ONLY_COUNT, below the ceiling of $LIGHT_ONLY_CEILING — lower LIGHT_ONLY_CEILING)"
else
  echo -e "${GREEN}OK${NC} ($LIGHT_ONLY_COUNT)"
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
