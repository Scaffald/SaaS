#!/usr/bin/env bash
#
# scripts/smoke-remote.sh — post-deploy smoke suite for a remote environment.
#
#   ./scripts/smoke-remote.sh preview [expected_commit]
#   ./scripts/smoke-remote.sh prod    [expected_commit]
#   ./scripts/smoke-remote.sh dev     [expected_commit]
#
# expected_commit defaults to the current `git rev-parse --short HEAD`; pass it
# explicitly when smoking a deploy made from a different checkout.
#
# What it checks, and why each check exists (all born from real incidents):
#   1. /v1/health commit == expected     → deploy skew; a stale function was the
#      root cause of "prod is broken" more than once (see deploy-state memory).
#   2. anon GET /v1/work-logs → 401/403  → authz default-deny; #428/336 was an
#      OAuth rubber-stamp that a check like this would have caught.
#   3. /v1/profiles/slug/<nonce> → 404   → route registration; new routes 500ing
#      or falling through to catch-alls (#439) look identical to "works" without
#      an explicit probe. 404 is the healthy answer for a nonsense slug.
#   4. anon GET /v1/jobs → 200           → public read path end to end.
#   5. /v1/map/location-counts → rows    → exercises the PostGIS functions whose
#      search_path broke silently for months (migration 341); this endpoint
#      raises 42704 when they regress.
#   6. web SSR: / has <title> + hero, /auth is 200 → the render path; a broken
#      export ships an empty shell that still returns 200 without these greps.
#   7. (optional) password login + authed reads — runs only when
#      SMOKE_USER_EMAIL / SMOKE_USER_PASSWORD are present in the env file or
#      environment. There is no seeded login on preview/prod (test@example.com
#      is local-only), so these creds refer to a dedicated smoke user created
#      via the GoTrue admin API. Absence of creds skips, it does not fail.
#
# Exit 0 only if every non-skipped check passes.

set -uo pipefail
cd "$(git rev-parse --show-toplevel)"

ENV="${1:-}"
case "$ENV" in
  preview) REF="uhjkipdwayqfihkanabk"; ENV_FILE=".env.preview";    WEB_BASE="https://scf-scaffald--staging.expo.app" ;;
  prod)    REF="qmfmpcyxsihhfttvqpbw"; ENV_FILE=".env.production"; WEB_BASE="https://scaffald.com" ;;
  dev)     REF="pmtdqrfpumqwkdhpgwcz"; ENV_FILE=".env.dev";        WEB_BASE="" ;;
  *) echo "usage: $0 {preview|prod|dev} [expected_commit]" >&2; exit 2 ;;
esac

EXPECTED_COMMIT="${2:-$(git rev-parse --short HEAD)}"

[ -f "$ENV_FILE" ] || { echo "✗ $ENV_FILE not found — smoke needs its anon key" >&2; exit 1; }
ANON="$(grep -m1 '^EXPO_PUBLIC_SUPABASE_ANON_KEY=' "$ENV_FILE" | cut -d= -f2-)"
[ -n "$ANON" ] || { echo "✗ EXPO_PUBLIC_SUPABASE_ANON_KEY missing from $ENV_FILE" >&2; exit 1; }

SMOKE_USER_EMAIL="${SMOKE_USER_EMAIL:-$(grep -m1 '^SMOKE_USER_EMAIL=' "$ENV_FILE" 2>/dev/null | cut -d= -f2-)}"
SMOKE_USER_PASSWORD="${SMOKE_USER_PASSWORD:-$(grep -m1 '^SMOKE_USER_PASSWORD=' "$ENV_FILE" 2>/dev/null | cut -d= -f2-)}"

API="https://$REF.supabase.co/functions/v1/api"
AUTH="https://$REF.supabase.co/auth/v1"
PASS=0; FAIL=0; SKIP=0
BODY_FILE="$(mktemp)"
trap 'rm -f "$BODY_FILE"' EXIT

check() { # name expected_codes url [curl args...]
  local name="$1" expected="$2" url="$3"; shift 3
  local code
  code=$(curl -s -o "$BODY_FILE" -w "%{http_code}" --max-time 20 "$url" "$@")
  if [[ ",$expected," == *",$code,"* ]]; then
    echo "PASS  $name ($code)"; PASS=$((PASS+1))
  else
    echo "FAIL  $name (got $code, want $expected)  $(head -c 200 "$BODY_FILE")"; FAIL=$((FAIL+1))
  fi
}

echo "── smoke: $ENV ($REF), expecting commit $EXPECTED_COMMIT ──"

# 1. health + deploy skew
HEALTH=$(curl -fsS --max-time 20 --retry 2 --retry-delay 2 "$API/v1/health" 2>/dev/null)
echo "health: ${HEALTH:-<unreachable>}"
if [ -z "$HEALTH" ]; then
  echo "FAIL  health unreachable"; FAIL=$((FAIL+1))
elif echo "$HEALTH" | grep -q "\"commit\":\"$EXPECTED_COMMIT\""; then
  echo "PASS  commit==$EXPECTED_COMMIT"; PASS=$((PASS+1))
else
  echo "FAIL  commit mismatch (want $EXPECTED_COMMIT)"; FAIL=$((FAIL+1))
fi

# 2-5. API surface
check "authz default-deny (anon work-logs)" "401,403" "$API/v1/work-logs" -H "apikey: $ANON"
check "profiles/slug route registered"      "404"     "$API/v1/profiles/slug/smoke-nonexistent-$RANDOM" -H "apikey: $ANON"
check "anon GET /v1/jobs"                   "200"     "$API/v1/jobs" -H "apikey: $ANON"
check "geo functions (map/location-counts)" "200"     "$API/v1/map/location-counts?north=43.5&south=41.0&east=-69.5&west=-72.5" -H "apikey: $ANON"
if [ $FAIL -eq 0 ] && ! grep -q '"workers"' "$BODY_FILE"; then
  echo "FAIL  location-counts returned 200 without a workers count"; FAIL=$((FAIL+1))
fi

# 6. web SSR
if [ -n "$WEB_BASE" ]; then
  HTML=$(curl -s --max-time 25 "$WEB_BASE/")
  # Substring match, not `echo | grep -q`: grep -q exits at first match and the
  # resulting SIGPIPE on echo reads as a pipeline failure under pipefail.
  if [[ "$HTML" == *"<title>"* && "$HTML" == *"Connecting skilled trade workers"* ]]; then
    echo "PASS  web / server-renders title + hero"; PASS=$((PASS+1))
  else
    echo "FAIL  web / missing <title> or hero copy ($WEB_BASE)"; FAIL=$((FAIL+1))
  fi
  check "web /auth" "200" "$WEB_BASE/auth"
else
  echo "SKIP  web checks ($ENV has no canonical web URL)"; SKIP=$((SKIP+1))
fi

# 7. authed checks — only with smoke-user creds
if [ -n "$SMOKE_USER_EMAIL" ] && [ -n "$SMOKE_USER_PASSWORD" ]; then
  TOK=$(curl -s --max-time 20 "$AUTH/token?grant_type=password" \
    -H "apikey: $ANON" -H "Content-Type: application/json" \
    -d "{\"email\":\"$SMOKE_USER_EMAIL\",\"password\":\"$SMOKE_USER_PASSWORD\"}" \
    | python3 -c "import json,sys;print(json.load(sys.stdin).get('access_token',''))" 2>/dev/null)
  if [ -n "$TOK" ]; then
    echo "PASS  smoke-user password login"; PASS=$((PASS+1))
    for ep in "v1/jobs" "v1/notifications?limit=1" "v1/industries"; do
      check "authed GET /$ep" "200" "$API/$ep" -H "apikey: $ANON" -H "Authorization: Bearer $TOK"
    done
  else
    echo "FAIL  smoke-user login rejected (creds configured but unusable)"; FAIL=$((FAIL+1))
  fi
else
  echo "SKIP  authed checks (no SMOKE_USER_EMAIL/SMOKE_USER_PASSWORD in $ENV_FILE)"; SKIP=$((SKIP+1))
fi

echo "──"
echo "PASS=$PASS FAIL=$FAIL SKIP=$SKIP"
[ "$FAIL" -eq 0 ]
