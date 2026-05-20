#!/bin/bash
#
# Installs a launchd agent that runs scripts/apple-secret-watch.sh daily
# at 09:00 local time on the operator's Mac. Replaces the GH Actions
# daily expiry workflow while billing is unavailable.
#
# Idempotent — re-running unloads any existing plist before re-installing.
#
# Usage:
#   bash scripts/install-apple-secret-watcher.sh           # install / reinstall
#   bash scripts/install-apple-secret-watcher.sh uninstall # remove the agent
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
PLIST_LABEL="love.scaffald.apple-secret-watch"
PLIST_PATH="${HOME}/Library/LaunchAgents/${PLIST_LABEL}.plist"
LOG_DIR="${HOME}/Library/Logs/scaffald"
LOG_PATH="${LOG_DIR}/apple-secret-watch.log"
WATCH_SCRIPT="${REPO_ROOT}/scripts/apple-secret-watch.sh"

case "${1:-install}" in
  uninstall)
    if [ -f "${PLIST_PATH}" ]; then
      /bin/launchctl unload "${PLIST_PATH}" 2>/dev/null || true
      /bin/rm -f "${PLIST_PATH}"
      echo "Removed ${PLIST_PATH}"
    else
      echo "No plist at ${PLIST_PATH} — nothing to do."
    fi
    exit 0
    ;;
  install|"") ;;
  *) echo "Unknown action: $1 (expected install|uninstall)" >&2; exit 2 ;;
esac

# Find pnpm so launchd can run it without inheriting the user's interactive PATH.
PNPM_BIN="$(command -v pnpm || true)"
if [ -z "${PNPM_BIN}" ]; then
  echo "error: pnpm not on PATH. Install pnpm or pass it via the plist's EnvironmentVariables." >&2
  exit 2
fi
PNPM_DIR="$(dirname "${PNPM_BIN}")"

# Make sure the watch script is executable.
/bin/chmod +x "${WATCH_SCRIPT}"

mkdir -p "${LOG_DIR}"
mkdir -p "${HOME}/Library/LaunchAgents"

# Unload any prior version so the new plist takes effect even if config changed.
if [ -f "${PLIST_PATH}" ]; then
  /bin/launchctl unload "${PLIST_PATH}" 2>/dev/null || true
fi

cat > "${PLIST_PATH}" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${PLIST_LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${WATCH_SCRIPT}</string>
  </array>
  <key>WorkingDirectory</key>
  <string>${REPO_ROOT}</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>${PNPM_DIR}:/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin</string>
  </dict>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>9</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
  <key>RunAtLoad</key>
  <false/>
  <key>StandardOutPath</key>
  <string>${LOG_PATH}</string>
  <key>StandardErrorPath</key>
  <string>${LOG_PATH}</string>
</dict>
</plist>
PLIST

/bin/launchctl load "${PLIST_PATH}"

echo "Installed launchd agent ${PLIST_LABEL}"
echo "  plist: ${PLIST_PATH}"
echo "  schedule: daily at 09:00 local time"
echo "  log: ${LOG_PATH}"
echo ""
echo "Verify with: launchctl list | grep apple-secret"
echo "Run on-demand with: bash ${WATCH_SCRIPT}"
echo "Uninstall with: bash ${SCRIPT_DIR}/$(basename "$0") uninstall"
