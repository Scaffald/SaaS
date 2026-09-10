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

# `scaffald` is the Expo app: its build is the full Metro web export, minutes
# long, and CI covers it on the deploy path. Everything else builds here.
#
# Both docs sites used to be excluded too, for dependency-resolution failures
# rather than anything wrong in their own source (#377). Both are fixed by
# pnpm overrides in the root package.json — see the comments there — so they
# are back under pre-push coverage.
BUILD_EXCLUDES="scaffald"
TEST_EXCLUDES="@scaffald/integration-test,scf-core,scaffald"

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

# Cheap proxy for "would the web export even start?"
#
# The `scaffald` build is excluded above because the Metro web export takes
# minutes, on the assumption that CI covers it on the deploy path. #501 showed
# that assumption is not safe: Lighthouse CI is the only workflow that runs
# `expo export`, and on pull requests it fires only for PRs labelled `ci:full`,
# which dependency PRs do not get. So a pnpm override pinning
# expo-modules-autolinking to a version older than the installed @expo/cli
# expects reached main, and every web deploy failed at Metro config time with
# `getSupportPackageForPlatform is not a function` — after lint, typecheck and
# unit tests had all gone green.
#
# @expo/cli reaches the autolinking package through this re-export and calls
# these three functions before bundling anything, so checking they exist costs
# ~1s and catches the whole class of expo/autolinking version skew. It is a
# smoke test of the interface, not a substitute for the export itself.
echo "🔍 Checking Expo autolinking exports match the installed CLI..."
AUTOLINK_OUT=$(cd apps/scaffald && node -e "
const required = [
  'makeCachedDependenciesLinker',
  'scanDependencyResolutionsForPlatform',
  'getSupportPackageForPlatform',
];
const autolinking = require('expo/internal/unstable-autolinking-exports');
const missing = required.filter((fn) => typeof autolinking[fn] !== 'function');
if (missing.length) {
  console.error('missing from expo-modules-autolinking: ' + missing.join(', '));
  console.error('expo-modules-autolinking@' + require('expo-modules-autolinking/package.json').version);
  console.error('expo@' + require('expo/package.json').version + ' expects ' +
    require('expo/package.json').dependencies['expo-modules-autolinking']);
  process.exit(1);
}
" 2>&1)
AUTOLINK_STATUS=$?

if [ "$AUTOLINK_STATUS" -ne 0 ]; then
  echo "   Expo web export would fail before bundling. Align the"
  echo "   expo-modules-autolinking / expo-modules-core pnpm overrides in the"
  echo "   root package.json with what the installed expo declares:"
  printf '%s\n' "$AUTOLINK_OUT" | sed 's/^/     /'
fi

# A pnpm override silently outranks the catalog entry of the same name; when
# they disagree the catalog lies about what installs. Three shipped incidents
# (#453, #501, #511) — see scripts/check-override-catalog-alignment.mjs.
echo "🔍 Checking pnpm overrides against the catalog…"
node scripts/check-override-catalog-alignment.mjs
ALIGN_STATUS=$?

# A function created without an explicit search_path resolves unqualified names
# against the caller's search_path. Migration 308 swept the ones that existed;
# ten created by 314-325 were missed and drifted unnoticed for eleven migrations
# (#468). Also catches two migrations sharing a number, which concurrent
# branches make likely — it happened between #723 and this change.
echo "🔍 Checking migration numbers and function search_path…"
node scripts/check-migrations.mjs
MIGRATIONS_STATUS=$?

FAILED=""
[ "$BUILD_STATUS" -ne 0 ] && FAILED="$FAILED build"
[ "$TEST_STATUS" -ne 0 ]  && FAILED="$FAILED test"
[ "$DENO_STATUS" -ne 0 ]  && FAILED="$FAILED deno-parse"
[ "$AUTOLINK_STATUS" -ne 0 ] && FAILED="$FAILED expo-autolinking"
[ "$ALIGN_STATUS" -ne 0 ] && FAILED="$FAILED override-catalog"
[ "$MIGRATIONS_STATUS" -ne 0 ] && FAILED="$FAILED migrations"

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
