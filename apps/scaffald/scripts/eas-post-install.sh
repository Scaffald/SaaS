#!/bin/bash
# eas-build-post-install hook: build the workspace packages that are
# tracked as git submodules and ship their compiled output as `dist/`.
#
# Both packages/sdk and packages/ui have `dist/` in .gitignore, so a fresh
# clone on the EAS worker has only `src/`. Their package.json files declare
# subpath exports like `@scaffald/sdk/react` that resolve to `dist/react/index.mjs`.
# Without `dist/`, Metro's bundle phase fails with:
#   "Unable to resolve module @scaffald/sdk/react"
#
# This hook runs `tsup` for both submodule packages so their `dist/` exists
# before Metro / expo prebuild tries to bundle the JS.
#
# Local dev gets `dist/` from running each package's `build` or `dev` script;
# CI/EAS gets it from this hook.

set -euo pipefail

echo "[eas-post-install] === environment ==="
echo "[eas-post-install] cwd: $(pwd)"

# We're invoked from the EAS project root (apps/scaffald). Climb to repo root.
cd ../..
echo "[eas-post-install] climbed to repo root: $(pwd)"

build_pkg() {
  local filter="$1"
  local label="$2"
  echo "[eas-post-install] === building $label ==="
  if pnpm --filter "$filter" run build; then
    echo "[eas-post-install] ✅ $label built"
  else
    echo "[eas-post-install] ❌ $label build FAILED"
    exit 1
  fi
}

build_pkg "@scaffald/sdk" "@scaffald/sdk"
build_pkg "@scaffald/ui" "@scaffald/ui"

echo "[eas-post-install] === verify dist outputs ==="
for path in \
  packages/sdk/dist/index.mjs \
  packages/sdk/dist/react/index.mjs \
  packages/ui/dist/index.mjs; do
  if [ -f "$path" ]; then
    echo "[eas-post-install]   ✓ $path"
  else
    echo "[eas-post-install]   ✗ MISSING: $path"
    exit 1
  fi
done

echo "[eas-post-install] all submodule packages built successfully"
