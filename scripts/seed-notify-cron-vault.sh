#!/usr/bin/env bash
#
# Seed the Vault secret that lets pg_cron authenticate to the notification
# edge functions (migration 337). Run once per environment:
#
#   ./scripts/seed-notify-cron-vault.sh prod
#
# The cron jobs read two Vault rows at execution time:
#   edge_functions_url — not secret, seeded by automation already
#   service_role_key   — this script's job
#
# Until service_role_key exists the jobs fire every minute and get 401s —
# harmless, but noisy in net._http_response.
#
# Reads the service key from .env.production and the management PAT from .env;
# nothing is printed. Re-running updates the existing secret (rotation).

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ENV="${1:-}"
case "$ENV" in
  prod)    PROJECT_REF="qmfmpcyxsihhfttvqpbw"; KEY_FILE="$REPO_ROOT/.env.production" ;;
  dev)     PROJECT_REF="pmtdqrfpumqwkdhpgwcz"; KEY_FILE="$REPO_ROOT/.env.dev" ;;
  preview) PROJECT_REF="uhjkipdwayqfihkanabk"; KEY_FILE="$REPO_ROOT/.env.preview" ;;
  *) echo "usage: $0 {prod|dev|preview}" >&2; exit 2 ;;
esac

PAT="$(grep -m1 '^SUPABASE_PAT=' "$REPO_ROOT/.env" | cut -d= -f2-)"
SRK="$(grep -m1 '^SUPABASE_SERVICE_ROLE_KEY=' "$KEY_FILE" | cut -d= -f2- | tr -d '"'"'"' \r\n')"

[ -n "$PAT" ] || { echo "❌ SUPABASE_PAT missing from .env" >&2; exit 1; }
[ -n "$SRK" ] || { echo "❌ SUPABASE_SERVICE_ROLE_KEY missing from $KEY_FILE" >&2; exit 1; }

# JWTs are base64url + dots — no quotes — but verify before interpolating into
# SQL rather than assuming.
if ! printf '%s' "$SRK" | grep -Eq '^[A-Za-z0-9._-]+$'; then
  echo "❌ Service key contains unexpected characters; refusing to build SQL." >&2
  exit 1
fi

QUERY=$(python3 - "$SRK" <<'PY'
import json, sys
key = sys.argv[1]
sql = f"""
do $$ begin
  if exists (select 1 from vault.secrets where name = 'service_role_key') then
    perform vault.update_secret(
      (select id from vault.secrets where name = 'service_role_key'), '{key}');
  else
    perform vault.create_secret(
      '{key}', 'service_role_key',
      'Service role JWT for pg_cron -> edge function calls (migration 337)');
  end if;
end $$;
"""
print(json.dumps({"query": sql}))
PY
)

curl -fsS -X POST \
  -H "Authorization: Bearer $PAT" \
  -H "Content-Type: application/json" \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -d "$QUERY" > /dev/null

echo "✅ service_role_key seeded in $ENV Vault."
echo "The notifications-send-worker job runs every minute; within ~2 minutes"
echo "cron-driven runs should return 200. Verify with:"
echo "  select status, (response).status_code from net._http_response order by id desc limit 5;"
