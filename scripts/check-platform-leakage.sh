#!/usr/bin/env bash
# check-platform-leakage.sh
#
# Flags use of browser-only DOM/BOM APIs in source files that may be reached
# on React Native. The cross-platform primitives in
# `packages/scf-core/utils/platform/` own platform divergence — feature code
# should import those primitives instead of touching `window.*`, `document.*`,
# `localStorage`, `sessionStorage`, or `navigator.*` directly.
#
# Allow-list:
#   - `*.web.{ts,tsx}` — Metro resolves these only on web
#   - `packages/ui/src/platform/web/**` — explicit web-only hooks
#   - `packages/scf-core/utils/platform/**` — the primitives themselves
#   - test/setup files and `*.stories.*`
#   - Any line with the comment `// platform-allow` (with optional reason)
#
# Exits non-zero if violations are found. Run via `pnpm lint:platform`.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Specific DOM/BOM API surface — checks the *method/property* name after the
# global, not just the global itself, so `cert.document.id` (an object field
# named `document`) doesn't trip the check.
PATTERNS=(
  '(^|[^a-zA-Z0-9_$.])window\.(open|location|history|navigator|alert|confirm|prompt|addEventListener|removeEventListener|scrollTo|scrollBy|innerWidth|innerHeight|matchMedia|sessionStorage|localStorage|requestAnimationFrame|cancelAnimationFrame|setTimeout|clearTimeout|setInterval|clearInterval)'
  '(^|[^a-zA-Z0-9_$.])document\.(getElementById|querySelector|querySelectorAll|createElement|createTextNode|body|head|cookie|addEventListener|removeEventListener|hidden|visibilityState|title|location|documentElement|execCommand)'
  '(^|[^a-zA-Z0-9_$.])localStorage\.(getItem|setItem|removeItem|clear|key|length)'
  '(^|[^a-zA-Z0-9_$.])sessionStorage\.(getItem|setItem|removeItem|clear|key|length)'
  '(^|[^a-zA-Z0-9_$.])navigator\.(userAgent|clipboard|geolocation|language|languages|onLine|platform|vendor)'
)

INCLUDE_DIRS=(packages apps)

# Prune list for `find`.
PRUNE_PATHS=(
  '*/node_modules'
  '*/dist'
  '*/.next'
  '*/.expo'
  '*/.storybook'
  # UI primitives — own DOM access internally, guarded by Platform.OS.
  'packages/ui'
  # The platform-primitive module itself.
  'packages/scf-core/utils/platform'
  # Cross-platform utility shims that legitimately branch internally on
  # Platform.OS — these are the *correct* home for divergence. Feature code
  # imports them by name and does not see the branching.
  'packages/scf-core/utils/clipboard.ts'
  'packages/scf-core/utils/auth/clearAuthStorage.ts'
  'packages/scf-core/utils/cookieConsent'
  'packages/scf-core/utils/location'
  # Providers that intentionally bridge platforms at the root of the tree.
  'packages/scf-core/provider/auth/AuthStateChangeHandler.ts'
  'packages/scf-core/provider/theme/UniversalThemeProvider.tsx'
  'packages/scf-core/provider/cookie-consent'
  # SDK examples and the SDK's OAuth hook (browser-only OAuth flow).
  'packages/sdk/docs-site'
  'packages/sdk/examples'
  'packages/sdk/src/react/hooks.ts'
  '*/__tests__'
  '*/tests'
)

# File name patterns to skip post-find.
SKIP_FILE_GLOBS=(
  '*.web.ts'
  '*.web.tsx'
  '*.test.ts'
  '*.test.tsx'
  '*.spec.ts'
  '*.spec.tsx'
  '*.stories.tsx'
  '*.stories.ts'
)

build_find_prune() {
  local args=()
  for p in "${PRUNE_PATHS[@]}"; do
    args+=( -path "$p" -prune -o )
  done
  printf '%s\n' "${args[@]}"
}

candidate_files() {
  for dir in "${INCLUDE_DIRS[@]}"; do
    [ -d "$dir" ] || continue
    # shellcheck disable=SC2046
    find "$dir" $(build_find_prune | tr '\n' ' ') -type f \( -name '*.ts' -o -name '*.tsx' \) -print
  done
}

is_skipped_file() {
  local file="$1"
  local base
  base=$(basename "$file")
  for glob in "${SKIP_FILE_GLOBS[@]}"; do
    # shellcheck disable=SC2053
    if [[ "$base" == $glob ]]; then return 0; fi
  done
  return 1
}

violations=0
violations_output=""

while IFS= read -r file; do
  is_skipped_file "$file" && continue

  matches=""
  for pattern in "${PATTERNS[@]}"; do
    # Use grep -Pn for Perl regex with negative-lookahead-like patterns.
    # Strip lines marked with `// platform-allow` and comment lines.
    found=$(grep -nE "$pattern" "$file" 2>/dev/null \
      | grep -v 'platform-allow' \
      | grep -vE '^[[:space:]]*[0-9]+:[[:space:]]*//' \
      | grep -vE '^[[:space:]]*[0-9]+:[[:space:]]*\*')
    if [ -n "$found" ]; then
      matches="${matches}${found}"$'\n'
    fi
  done

  if [ -n "$matches" ]; then
    violations=$((violations + 1))
    violations_output="${violations_output}${file}:"$'\n'"${matches}"$'\n'
  fi
done < <(candidate_files)

if [ "$violations" -gt 0 ]; then
  printf '%b' "$violations_output"
  echo "❌ Found $violations file(s) using browser DOM/BOM APIs outside platform-extension files."
  echo "   Use primitives from @scf/core/utils/platform instead, or split the file"
  echo "   into .web.ts / .native.ts variants."
  echo "   If a specific line is intentional and guarded, append \`// platform-allow: reason\`."
  exit 1
fi

echo "✅ No browser globals leaked into shared/native code paths."
