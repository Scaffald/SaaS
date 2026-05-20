#!/bin/bash
#
# Daily Apple-secret expiry watcher, intended to run under launchd on the
# operator's Mac when GitHub Actions billing is unavailable. Mirrors the
# logic of .github/workflows/apple-secret-expiry.yml.
#
# Reads APPLE_SECRET from .env.production (or .env, whichever has it),
# runs scripts/check-apple-secret-expiry.ts, and pops a macOS notification
# if the secret is approaching expiry (<30 days) or expired (<21 days).
#
# Exit codes:
#   0   secret has ≥30 days remaining
#   1   warning band (<30 days), notification fired
#   2   error band (<21 days OR expired OR missing), notification fired
#
# Repo root is auto-detected via the script's own location, so the launchd
# job doesn't have to hardcode a cwd.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${REPO_ROOT}" || exit 2

notify() {
  local title="$1"
  local message="$2"
  # `osascript display notification` is non-interactive and survives launchd.
  /usr/bin/osascript -e "display notification \"${message}\" with title \"${title}\"" >/dev/null 2>&1 || true
}

# Pull APPLE_SECRET from the first env file that has it.
APPLE_SECRET=""
for f in .env.production .env .env.preview .env.dev .env.dev-local; do
  if [ -f "${REPO_ROOT}/${f}" ]; then
    value="$(grep -E '^APPLE_SECRET=' "${REPO_ROOT}/${f}" | head -n 1 | sed -E 's/^APPLE_SECRET=//; s/^"//; s/"$//')"
    if [ -n "${value}" ]; then
      APPLE_SECRET="${value}"
      break
    fi
  fi
done

if [ -z "${APPLE_SECRET}" ]; then
  notify "Apple secret check" "APPLE_SECRET not found in any local .env file. Run scripts/rotate-apple-secret.ts to refresh."
  exit 2
fi

export APPLE_SECRET

# Warn band: 30-day threshold. Capture output so we can include it in the notification.
WARN_OUTPUT="$(/usr/bin/env pnpm tsx scripts/check-apple-secret-expiry.ts --warn-days 30 2>&1)"
WARN_STATUS=$?

if [ ${WARN_STATUS} -eq 0 ]; then
  # Healthy — no notification, just log to stdout for the launchd log file.
  echo "[$(date -u +%FT%TZ)] ok"
  echo "${WARN_OUTPUT}"
  exit 0
fi

# Failed warn-band check. Run the 21-day version to find out which severity.
ERROR_OUTPUT="$(/usr/bin/env pnpm tsx scripts/check-apple-secret-expiry.ts --warn-days 21 2>&1)"
ERROR_STATUS=$?

if [ ${ERROR_STATUS} -ne 0 ]; then
  notify "Apple secret needs rotation NOW" "APPLE_SECRET has <21 days left. Run: SUPABASE_ACCESS_TOKEN=... pnpm tsx scripts/rotate-apple-secret.ts"
  echo "[$(date -u +%FT%TZ)] error"
  echo "${ERROR_OUTPUT}"
  exit 2
fi

notify "Apple secret expiring soon" "APPLE_SECRET has <30 days left. Plan a rotation soon: pnpm tsx scripts/rotate-apple-secret.ts"
echo "[$(date -u +%FT%TZ)] warn"
echo "${WARN_OUTPUT}"
exit 1
