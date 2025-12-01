#!/bin/bash
# Replace catalog: references in devDependencies with explicit versions
# This is needed when creating a standalone repository that won't have access to the monorepo catalog

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Path to pnpm-workspace.yaml for catalog versions
CATALOG_FILE="${ROOT_DIR}/pnpm-workspace.yaml"
PACKAGE_JSON="${1:-./package.json}"

if [ ! -f "${PACKAGE_JSON}" ]; then
  echo "❌ package.json not found at: ${PACKAGE_JSON}"
  exit 1
fi

if [ ! -f "${CATALOG_FILE}" ]; then
  echo "❌ pnpm-workspace.yaml not found at: ${CATALOG_FILE}"
  echo "Using fallback versions from requirement spec..."
fi

echo "🔧 Replacing catalog: references in devDependencies..."

# Catalog versions (from pnpm-workspace.yaml or fallback)
declare -A VERSIONS=(
  ["@biomejs/biome"]="~2.3.6"
  ["@types/node"]="~20.0.0"
  ["@types/react"]="~19.1.0"
  ["typescript"]="~5.9.2"
)

# Read catalog versions from pnpm-workspace.yaml if available
if [ -f "${CATALOG_FILE}" ]; then
  while IFS= read -r line; do
    if [[ $line =~ ^[[:space:]]*['"]?([^'":]+)['"]?:[[:space:]]*(.+)$ ]]; then
      KEY="${BASH_REMATCH[1]}"
      VALUE="${BASH_REMATCH[2]}"
      # Remove quotes if present
      VALUE="${VALUE%\"}"
      VALUE="${VALUE#\"}"
      VALUE="${VALUE%\'}"
      VALUE="${VALUE#\'}"
      # Store in associative array if it's one we care about
      if [[ -v VERSIONS["${KEY}"] ]]; then
        VERSIONS["${KEY}"]="${VALUE}"
      fi
    fi
  done < <(grep -A 100 "^catalog:" "${CATALOG_FILE}" | grep -E "^\s+['\"]?@biomejs/biome|^\s+['\"]?@types/node|^\s+['\"]?@types/react|^\s+['\"]?typescript" || true)
fi

# Replace catalog: references in devDependencies
for pkg in "${!VERSIONS[@]}"; do
  version="${VERSIONS[$pkg]}"
  # Escape special characters for sed
  pkg_escaped=$(echo "$pkg" | sed 's/[[\.*^$()+?{|]/\\&/g')
  
  if grep -q "\"${pkg_escaped}\": \"catalog:\"" "${PACKAGE_JSON}"; then
    echo "  Replacing ${pkg}: catalog: → ${version}"
    # Use a temp file for macOS compatibility
    if [[ "$OSTYPE" == "darwin"* ]]; then
      sed -i '' "s/\"${pkg_escaped}\": \"catalog:\"/\"${pkg_escaped}\": \"${version}\"/" "${PACKAGE_JSON}"
    else
      sed -i "s/\"${pkg_escaped}\": \"catalog:\"/\"${pkg_escaped}\": \"${version}\"/" "${PACKAGE_JSON}"
    fi
  fi
done

# Verify no catalog: remains in devDependencies
if grep -q "catalog:" "${PACKAGE_JSON}"; then
  echo "⚠️  Warning: Some catalog: references may still remain"
  grep "catalog:" "${PACKAGE_JSON}" || true
else
  echo "✅ All catalog: references replaced in devDependencies"
fi

