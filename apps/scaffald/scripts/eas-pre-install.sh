#!/bin/bash
# eas-build-pre-install hook: verbose submodule hydration on the EAS worker.
#
# EAS Workflows clone the parent repo via the GitHub App's installation token
# but DO NOT propagate that auth to submodule clones; the prepare script in
# root package.json silences any failure (`|| true`) so the empty packages/ui
# + packages/sdk dirs sneak through to pnpm install which then fails with
# ERR_PNPM_WORKSPACE_PKG_NOT_FOUND.
#
# This hook prints the actual git output (no silencing) so we can diagnose
# auth issues precisely. It also tries a couple of credential paths EAS might
# expose before falling back to the noisy default.

set -uo pipefail

echo "[eas-pre-install] === environment ==="
echo "[eas-pre-install] cwd: $(pwd)"
echo "[eas-pre-install] EAS_BUILD_WORKINGDIR=${EAS_BUILD_WORKINGDIR:-<unset>}"
echo "[eas-pre-install] EAS_BUILD_GIT_COMMIT_HASH=${EAS_BUILD_GIT_COMMIT_HASH:-<unset>}"
# Look for any token-shaped env var EAS may expose
env | grep -iE "TOKEN|GH_|GITHUB" | sed 's/=.*/=<redacted>/' || echo "[eas-pre-install] (no token-shaped env vars found)"

# We're invoked from the EAS project root (apps/scaffald). Climb to repo root
# where .gitmodules + packages/ live.
cd ../..
echo "[eas-pre-install] climbed to repo root: $(pwd)"

if [ ! -f .gitmodules ]; then
  echo "[eas-pre-install] no .gitmodules at repo root; nothing to hydrate"
  exit 0
fi

echo "[eas-pre-install] === pre-init state ==="
echo "[eas-pre-install] packages/ui contents:"
ls packages/ui 2>&1 | head -5 || true
echo "[eas-pre-install] packages/sdk contents:"
ls packages/sdk 2>&1 | head -5 || true
echo "[eas-pre-install] git remote -v:"
git remote -v || true
echo "[eas-pre-install] git config submodule.* (any URL rewrites?):"
git config --get-regexp '^submodule\.' || echo "[eas-pre-install]   (no submodule config set)"
echo "[eas-pre-install] git credential helper:"
git config --get-all credential.helper || echo "[eas-pre-install]   (none)"

# If EAS exposed any GitHub App / PAT-style token, use it for HTTPS clones.
# Common candidates: GITHUB_TOKEN, GH_TOKEN, EXPO_GITHUB_TOKEN.
TOKEN="${GITHUB_TOKEN:-${GH_TOKEN:-${EXPO_GITHUB_TOKEN:-}}}"
if [ -n "$TOKEN" ]; then
  echo "[eas-pre-install] found a token — configuring credential helper"
  git config --global credential.helper store
  echo "https://x-access-token:${TOKEN}@github.com" > ~/.git-credentials
  chmod 600 ~/.git-credentials
fi

echo "[eas-pre-install] === git submodule update --init --recursive (verbose) ==="
git submodule update --init --recursive 2>&1
SUB_STATUS=$?

echo "[eas-pre-install] git submodule update exit code: $SUB_STATUS"

echo "[eas-pre-install] === post-init state ==="
echo "[eas-pre-install] packages/ui contents:"
ls packages/ui 2>&1 | head -10 || true
echo "[eas-pre-install] packages/sdk contents:"
ls packages/sdk 2>&1 | head -10 || true

if [ "$SUB_STATUS" -ne 0 ]; then
  echo "[eas-pre-install] FATAL: submodule init failed. The EAS worker can't auth to Scaffald/ui or Scaffald/sdk."
  echo "[eas-pre-install] Vendoring the submodules into the main repo is the next step."
  exit 1
fi

if [ ! -f packages/ui/package.json ] || [ ! -f packages/sdk/package.json ]; then
  echo "[eas-pre-install] FATAL: submodule directories exist but have no package.json — checkout incomplete."
  exit 1
fi

echo "[eas-pre-install] Submodules hydrated successfully."
