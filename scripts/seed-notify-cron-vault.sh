#!/usr/bin/env bash
#
# Seed the Vault secrets that let pg_cron call the edge functions
# (migration 337 and every later job that reads them). Run once per environment:
#
#   ./scripts/seed-notify-cron-vault.sh {prod|dev|preview}
#
# The cron jobs read two Vault rows at execution time:
#   edge_functions_url: https://<ref>.supabase.co/functions/v1 (created if missing)
#   service_role_key:   the service key the function RUNTIME holds (created or rotated)
#
# Which key the runtime holds varies by project. The notify-* functions compare
# the Bearer byte for byte with the runtime's SUPABASE_SERVICE_ROLE_KEY. Dev and
# preview run the new `sb_secret_` key and prod the legacy JWT (2026-11). The
# Management API reports legacy keys as enabled on every project, so that flag
# can't tell them apart. The .env.<env> files hold the legacy JWT, which is the
# wrong answer for dev and preview (#564, #1075).
#
# So the script fetches both candidates from the Management API and asks the
# runtime: it POSTs each one to notify-send-worker and keeps the one that is not
# refused with 401. A successful probe runs one worker pass, the same thing the
# every-minute cron does.
#
# Needs only SUPABASE_PAT in .env. Prints no key material. Re-running is safe:
# it updates service_role_key (rotation) and leaves an existing
# edge_functions_url alone.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ENV="${1:-}"
case "$ENV" in
  prod)    PROJECT_REF="qmfmpcyxsihhfttvqpbw" ;;
  dev)     PROJECT_REF="pmtdqrfpumqwkdhpgwcz" ;;
  preview) PROJECT_REF="uhjkipdwayqfihkanabk" ;;
  *) echo "usage: $0 {prod|dev|preview}" >&2; exit 2 ;;
esac

PAT="$(grep -m1 '^SUPABASE_PAT=' "$REPO_ROOT/.env" | cut -d= -f2- | tr -d '"'"'"' \r\n')"
[ -n "$PAT" ] || { echo "❌ SUPABASE_PAT missing from .env" >&2; exit 1; }

API="https://api.supabase.com/v1/projects/$PROJECT_REF"
FUNCTIONS_URL="https://$PROJECT_REF.supabase.co/functions/v1"
# The Management API sits behind Cloudflare, which rejects curl's default UA.
UA="scaffald-ops"

KEYS_JSON="$(curl -fsS -H "Authorization: Bearer $PAT" -H "User-Agent: $UA" \
  "$API/api-keys?reveal=true")"

# One candidate per line, as "<label> <key>": the new secret key first, then the
# legacy service_role JWT.
CANDIDATES="$(printf '%s' "$KEYS_JSON" | python3 -c '
import json, sys
keys = json.load(sys.stdin)
for k in keys:
    if k.get("type") == "secret" and k.get("api_key"):
        print("sb_secret", k["api_key"])
for k in keys:
    if k.get("name") == "service_role" and k.get("type") == "legacy" and k.get("api_key"):
        print("legacy_jwt", k["api_key"])
')"

[ -n "$CANDIDATES" ] || { echo "❌ No service keys returned for $ENV" >&2; exit 1; }

SRK=""
LABEL=""
while read -r label key; do
  [ -n "$key" ] || continue
  code="$(curl -s -o /dev/null -w '%{http_code}' -X POST \
    -H "Authorization: Bearer $key" -H "Content-Type: application/json" \
    -d '{}' "$FUNCTIONS_URL/notify-send-worker")"
  echo "probe $label -> HTTP $code"
  if [ "${code:0:1}" = "2" ]; then
    SRK="$key"; LABEL="$label"; break
  fi
done <<< "$CANDIDATES"

[ -n "$SRK" ] || {
  echo "❌ The $ENV runtime refused every candidate key; is notify-send-worker deployed?" >&2
  exit 1
}

# Keys are base64url, dots and underscores, with no quotes. Check that before
# putting one into SQL instead of assuming it.
if ! printf '%s' "$SRK" | grep -Eq '^[A-Za-z0-9._-]+$'; then
  echo "❌ Service key contains unexpected characters; refusing to build SQL." >&2
  exit 1
fi

QUERY=$(python3 - "$SRK" "$FUNCTIONS_URL" "$LABEL" <<'PY'
import json, sys
key, url, label = sys.argv[1:4]
sql = f"""
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'edge_functions_url') then
    perform vault.create_secret(
      '{url}', 'edge_functions_url',
      'Base URL for pg_cron -> edge function calls');
  end if;
  if exists (select 1 from vault.secrets where name = 'service_role_key') then
    perform vault.update_secret(
      (select id from vault.secrets where name = 'service_role_key'), '{key}');
  else
    perform vault.create_secret(
      '{key}', 'service_role_key',
      'Runtime service key ({label}) for pg_cron -> edge function calls (migration 337)');
  end if;
end $$;
"""
print(json.dumps({"query": sql}))
PY
)

curl -fsS -X POST \
  -H "Authorization: Bearer $PAT" \
  -H "User-Agent: $UA" \
  -H "Content-Type: application/json" \
  "$API/database/query" \
  -d "$QUERY" > /dev/null

echo "✅ $ENV Vault: service_role_key = runtime's $LABEL key; edge_functions_url present."
echo "notifications-send-worker runs every minute. Verify with:"
echo "  select status_code, content from net._http_response order by id desc limit 5;"
