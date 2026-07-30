#!/usr/bin/env bash
#
# Pre-push validation. Writes the stamp that .githooks/pre-push checks.
#
# Extracted from an inline package.json one-liner that had a silent failure:
#
#   nx affected -t build & nx affected -t test & wait && echo $SHA > stamp
#
# Bare `wait` returns 0 whether or not the background jobs succeeded, so the
# stamp was written — and "✅ Pre-push validated" printed — even when nx
# reported "Failed tasks". Two changes were merged against that green-looking
# output while builds were in fact failing. This version waits on each job by
# pid and refuses to stamp unless both are clean.
#
# Also runs a parse check over the Deno test suites. `deno test` aborts the
# whole run on a single syntax error before executing anything, which reads as
# "nothing to do" rather than "everything is broken" — that is how 5 files with
# mismatched quotes went unnoticed for six weeks (#416, #418).

set -uo pipefail

cd "$(git rev-parse --show-toplevel)"

# Builds known to fail for reasons outside this repo. Each needs an issue, so
# the list stays a record of work rather than a place failures go to die.
#   docs-site        — Docusaurus theme-mermaid 3.10.1 vs core 3.9.2, in the
#                      packages/sdk submodule
#   @scaffald/ui-docs — webpack ProgressPlugin schema mismatch, in the
#                      packages/ui submodule (#377)
BUILD_EXCLUDES="scaffald,docs-site,@scaffald/ui-docs"
TEST_EXCLUDES="@scaffald/integration-test,@scaffald/ui,scf-core,scaffald"

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"
export NX_PARALLEL="${NX_PARALLEL:-5}"

START=$SECONDS
echo "🔍 Running pre-push validation..."

git fetch origin main 2>/dev/null || true

npx nx affected -t build --exclude="$BUILD_EXCLUDES" &
BUILD_PID=$!
npx nx affected -t test --exclude="$TEST_EXCLUDES" &
TEST_PID=$!

# Wait on each pid individually — this is the whole point.
wait "$BUILD_PID"; BUILD_STATUS=$?
wait "$TEST_PID";  TEST_STATUS=$?

# Cheap and infra-free: can every suite still be loaded?
#
# `deno test --filter` with a pattern that matches nothing parses and evaluates
# every file's module scope, registers its Deno.test cases, and runs none of
# them — so it needs no database and answers exactly the question that matters:
# can these suites run at all. Grepping `deno check` output for "SyntaxError"
# was the wrong probe; Deno reports an unterminated string as TS1002, so the
# first version of this guard let an injected parse error straight through.
#
# --no-check is deliberate: type errors are real but do not stop the suites
# (which run under --no-check), and the unit files carry known fixture drift.
# Blocking every push on that would trade a big problem for a smaller one.
echo "🔍 Checking Deno test suites can be loaded..."
DENO_OUT=$(cd packages/supabase && npx deno test --allow-all --no-check --no-lock \
  --config tests/deno.json --filter '__prepush_load_probe__' \
  tests/unit/ tests/routers/ 2>&1)
DENO_STATUS=$?

if [ "$DENO_STATUS" -ne 0 ]; then
  echo "   A test suite failed to load — it cannot run at all:"
  printf '%s\n' "$DENO_OUT" | grep -vE "^(Download|Check) " | tail -12
fi

FAILED=""
[ "$BUILD_STATUS" -ne 0 ] && FAILED="$FAILED build"
[ "$TEST_STATUS" -ne 0 ]  && FAILED="$FAILED test"
[ "$DENO_STATUS" -ne 0 ]  && FAILED="$FAILED deno-parse"

if [ -n "$FAILED" ]; then
  echo
  echo "❌ Pre-push validation FAILED after $((SECONDS - START))s —$FAILED"
  echo "   No stamp written, so \`git push\` will refuse."
  echo "   Re-read the output above; do not reach for SKIP_PREPUSH=1 to get past"
  echo "   a real failure."
  exit 1
fi

mkdir -p .nx/cache
git rev-parse HEAD > .nx/cache/.prepush-validated
echo "✅ Pre-push validated in $((SECONDS - START))s — git push will skip checks"
