#!/bin/bash
# eas-build-pre-install hook: hydrate the packages/ui + packages/sdk
# submodules on the EAS worker.
#
# EAS uploads via `git ls-files`, which excludes submodule contents.
# Without this script, packages/ui and packages/sdk arrive as empty
# directories on the worker, so pnpm install can't resolve the
# @scaffald/ui and @scaffald/sdk workspace deps and Metro fails at the
# "Bundle JavaScript" phase with a generic Unknown error.
#
# Auth: a deploy key is uploaded as the SSH_KEY EAS secret (--type file).
# The same public key is added to both Scaffald/ui and Scaffald/sdk
# repos as a read-only deploy key. EAS exposes the secret as a file
# path via the SSH_KEY env var.

set -euo pipefail

if [ -z "${SSH_KEY:-}" ]; then
  echo "[eas-pre-install] SSH_KEY env var not set; submodules cannot be cloned. Skipping."
  echo "[eas-pre-install] If this is a real build, verify the SSH_KEY EAS secret exists for this project."
  exit 0
fi

echo "[eas-pre-install] Installing deploy key..."
mkdir -p ~/.ssh
cp "$SSH_KEY" ~/.ssh/id_ed25519
chmod 600 ~/.ssh/id_ed25519
ssh-keyscan -H github.com >> ~/.ssh/known_hosts 2>/dev/null
echo "[eas-pre-install] Deploy key installed."

# We're invoked from the project root (apps/scaffald). Climb to the
# monorepo root where packages/ live.
cd ../..

UI_BRANCH="${SCAFFALD_UI_BRANCH:-main}"
SDK_BRANCH="${SCAFFALD_SDK_BRANCH:-main}"

clone_submodule() {
  local repo="$1"
  local target="$2"
  local branch="$3"
  echo "[eas-pre-install] Cloning $repo (branch=$branch) → $target"
  rm -rf "$target"
  GIT_SSH_COMMAND="ssh -i ~/.ssh/id_ed25519 -o IdentitiesOnly=yes -o StrictHostKeyChecking=no" \
    git clone --depth 1 -b "$branch" "$repo" "$target"
}

clone_submodule "git@github.com:Scaffald/ui.git" "packages/ui" "$UI_BRANCH"
clone_submodule "git@github.com:Scaffald/sdk.git" "packages/sdk" "$SDK_BRANCH"

echo "[eas-pre-install] Submodules hydrated."
