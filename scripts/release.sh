#!/usr/bin/env bash
#
# Cut a scaffald-app release: bump version, commit, tag app-vX.Y.Z, push.
# See docs/agents/RELEASE-PROCESS.md for the full flow.
#
# Usage:
#   scripts/release.sh <version>            # e.g. scripts/release.sh 1.1.0
#   scripts/release.sh <version> --no-push  # dry-ish: stop after commit + tag
#   scripts/release.sh <version> --build    # also kick off EAS build to TestFlight
#
# Validates that:
#   - The version is valid SemVer (X.Y.Z, no pre-release for now).
#   - We're on the main branch.
#   - The working tree is clean.
#   - The version moves forward (not the same as current, not a downgrade).
#   - The git tag app-v<version> does not already exist.

set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

# --- args -----------------------------------------------------------------
if [ $# -lt 1 ]; then
  echo "usage: scripts/release.sh <version> [--no-push] [--build]" >&2
  exit 2
fi

VERSION="$1"
shift || true

NO_PUSH=0
RUN_BUILD=0
for arg in "$@"; do
  case "$arg" in
    --no-push) NO_PUSH=1 ;;
    --build)   RUN_BUILD=1 ;;
    *) echo "unknown arg: $arg" >&2; exit 2 ;;
  esac
done

# --- validate version -----------------------------------------------------
if ! [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "✗ '$VERSION' is not a valid SemVer X.Y.Z." >&2
  exit 1
fi

TAG="app-v${VERSION}"

if git rev-parse -q --verify "refs/tags/${TAG}" >/dev/null; then
  echo "✗ tag ${TAG} already exists." >&2
  exit 1
fi

# --- validate branch + tree ----------------------------------------------
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "✗ release must be cut from main. currently on: $BRANCH" >&2
  exit 1
fi

if [ -n "$(git status --porcelain | grep -v '^.M packages/ui')" ]; then
  echo "✗ working tree is dirty. commit or stash before releasing:" >&2
  git status --short >&2
  exit 1
fi

# --- validate version moves forward --------------------------------------
PKG_PATH="apps/scaffald/package.json"
CURRENT=$(node -p "require('./${PKG_PATH}').version")

if [ "$CURRENT" = "$VERSION" ]; then
  echo "✗ ${PKG_PATH} is already at $VERSION." >&2
  exit 1
fi

# Compare via sort -V: the smaller (older) value sorts first.
SMALLER=$(printf '%s\n%s\n' "$CURRENT" "$VERSION" | sort -V | head -1)
if [ "$SMALLER" = "$VERSION" ]; then
  echo "✗ $VERSION is lower than current $CURRENT — would be a downgrade." >&2
  exit 1
fi

# --- confirm --------------------------------------------------------------
echo
echo "  About to release scaffald-app:"
echo "    version: $CURRENT → $VERSION"
echo "    tag:     $TAG"
echo "    branch:  $BRANCH"
if [ "$NO_PUSH" = "1" ]; then
  echo "    push:    NO (--no-push)"
else
  echo "    push:    yes (commit + tag to origin/main)"
fi
if [ "$RUN_BUILD" = "1" ]; then
  echo "    build:   yes (EAS device:ios after push)"
fi
echo
read -r -p "  Continue? [y/N] " ANSWER
case "$ANSWER" in
  y|Y) ;;
  *) echo "aborted."; exit 0 ;;
esac

# --- bump + commit + tag --------------------------------------------------
TMP=$(mktemp)
node -e "
  const fs = require('fs');
  const path = '${PKG_PATH}';
  const pkg = JSON.parse(fs.readFileSync(path, 'utf8'));
  pkg.version = '${VERSION}';
  fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');
"
git add "$PKG_PATH"

git commit -m "chore(release): scaffald-app v${VERSION}"

git tag -a "$TAG" -m "scaffald-app v${VERSION}

Cut via scripts/release.sh. See docs/agents/RELEASE-PROCESS.md.

Linear: all v${VERSION}-labeled issues currently in 'In Github' should
move to 'In TestFlight' once this TestFlight build is live."

echo "✓ commit + tag created locally."

# --- push -----------------------------------------------------------------
if [ "$NO_PUSH" = "0" ]; then
  # --atomic = either both refs land on origin or neither does. Prevents the
  # "main is bumped but no tag" state where the release commit ships
  # untaggable — breaks "one tag = one shippable build".
  git push --atomic origin main "$TAG"
  echo "✓ pushed main and ${TAG} atomically to origin."
fi

# --- optional EAS build ---------------------------------------------------
if [ "$RUN_BUILD" = "1" ]; then
  echo
  echo "  Kicking off EAS build for device iOS..."
  pnpm --filter scaffald-app eas:build:dev:device:ios
fi

echo
echo "  Next:"
echo "    1. Wait for the EAS build to finish, then submit to TestFlight."
echo "    2. Once live on TestFlight, move the v${VERSION}-labeled issues from"
echo "       'In Github' to 'In TestFlight' on the board:"
echo "         https://github.com/orgs/Scaffald/projects/1"
echo "    3. QA tests against the TestFlight build."
echo "    4. As issues are validated, QA moves them to 'Done'."
echo
