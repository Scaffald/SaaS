#!/usr/bin/env bash
#
# Apply a migration to a remote Supabase project AND record it in the ledger.
#
#   ./scripts/apply-migration.sh prod 340_something.sql
#   ./scripts/apply-migration.sh prod 340_something.sql --dry-run
#   ./scripts/apply-migration.sh prod --status          # what's applied vs not
#
# Why this exists (#437)
# ----------------------
# Schema changes here have been applied by POSTing SQL to the Management API's
# database/query endpoint, because direct psql to the project is IPv6-only from
# this machine. That endpoint runs the SQL but does NOT touch
# supabase_migrations.schema_migrations, so the ledger stopped reflecting
# production: of seven unrecorded migrations found on 2026-07-30, six had in
# fact been applied and one (336) never had — with no way to tell them apart.
#
# That is not a bookkeeping nicety. #428 was analysed from the repo and reported
# the OPPOSITE of production's real behaviour ("rubber stamp" vs "fails closed")
# because 336 was in the repo but not the database. Any reasoning about schema
# state is unreliable while the ledger lies.
#
# So: one path in, and it always records the version.

set -uo pipefail

cd "$(git rev-parse --show-toplevel)"

MIGRATIONS_DIR="packages/supabase/migrations"

ENV="${1:-}"
case "$ENV" in
  prod)    PROJECT_REF="qmfmpcyxsihhfttvqpbw" ;;
  dev)     PROJECT_REF="pmtdqrfpumqwkdhpgwcz" ;;
  preview) PROJECT_REF="uhjkipdwayqfihkanabk" ;;
  *)
    echo "usage: $0 {prod|dev|preview} <migration.sql> [--dry-run]" >&2
    echo "       $0 {prod|dev|preview} --status" >&2
    exit 2
    ;;
esac
shift

PAT="$(grep -m1 '^SUPABASE_PAT=' .env | cut -d= -f2-)"
[ -n "$PAT" ] || { echo "❌ SUPABASE_PAT missing from .env" >&2; exit 1; }

API="https://api.supabase.com/v1/projects/$PROJECT_REF/database/query"

# Run a SQL string, print the raw JSON response. Fails on HTTP error.
run_sql() {
  local sql="$1"
  local payload
  payload=$(SQL="$sql" python3 -c 'import json,os;print(json.dumps({"query":os.environ["SQL"]}))')
  curl -fsS -X POST -H "Authorization: Bearer $PAT" -H "Content-Type: application/json" \
    "$API" -d "$payload"
}

recorded_versions() {
  run_sql "select coalesce(string_agg(version, ' ' order by version), '') as v
           from supabase_migrations.schema_migrations" \
    | python3 -c "import json,sys; print(json.load(sys.stdin)[0]['v'])"
}

# --- --status -------------------------------------------------------------
if [ "${1:-}" = "--status" ]; then
  REC="$(recorded_versions)"
  echo "Ledger for $ENV ($PROJECT_REF):"
  REC="$REC" MIGRATIONS_DIR="$MIGRATIONS_DIR" python3 <<'PY'
import os, re
rec = set(os.environ["REC"].split())
files = sorted(f for f in os.listdir(os.environ["MIGRATIONS_DIR"]) if f.endswith(".sql"))
missing = [f for f in files if (m := re.match(r"^(\d+)_", f)) and m.group(1) not in rec]
print(f"  repo migrations: {len(files)}")
print(f"  recorded:        {len(rec)}")
print(f"  unrecorded:      {len(missing)}")
for f in missing:
    print(f"    - {f}")
if missing:
    print()
    print("  Unrecorded does NOT mean unapplied — inspect the objects each one")
    print("  creates before assuming either way. That ambiguity is the bug.")
PY
  exit 0
fi

# --- apply ----------------------------------------------------------------
FILE="${1:-}"
[ -n "$FILE" ] || { echo "❌ no migration file given" >&2; exit 2; }
shift

DRY_RUN=0
for arg in "$@"; do
  [ "$arg" = "--dry-run" ] && DRY_RUN=1
done

# Accept a bare filename or a path.
[ -f "$FILE" ] || FILE="$MIGRATIONS_DIR/$FILE"
[ -f "$FILE" ] || { echo "❌ not found: $FILE" >&2; exit 1; }

BASENAME="$(basename "$FILE")"
VERSION="$(printf '%s' "$BASENAME" | sed -E 's/^([0-9]+)_.*/\1/')"
NAME="$(printf '%s' "$BASENAME" | sed -E 's/^[0-9]+_(.*)\.sql$/\1/')"

if ! printf '%s' "$VERSION" | grep -Eq '^[0-9]+$'; then
  echo "❌ '$BASENAME' does not start with a numeric version." >&2
  exit 1
fi

if printf '%s' " $(recorded_versions) " | grep -q " $VERSION "; then
  echo "⏭️  $VERSION already recorded for $ENV. Nothing to do."
  echo "   (Re-applying is usually safe — most migrations here are idempotent —"
  echo "    but do it deliberately rather than through this script.)"
  exit 0
fi

echo "Applying $BASENAME to $ENV ($PROJECT_REF)"
echo "  version: $VERSION"
echo "  name:    $NAME"

if [ "$DRY_RUN" = "1" ]; then
  echo
  echo "--dry-run: not applying. First 20 lines:"
  head -20 "$FILE" | sed 's/^/    /'
  exit 0
fi

echo "→ running SQL…"
run_sql "$(cat "$FILE")" > /dev/null
echo "  applied."

echo "→ recording in supabase_migrations.schema_migrations…"
run_sql "insert into supabase_migrations.schema_migrations (version, name)
         values ('$VERSION', '$NAME')
         on conflict (version) do nothing" > /dev/null
echo "  recorded."

echo
echo "✅ $BASENAME applied and recorded for $ENV."
