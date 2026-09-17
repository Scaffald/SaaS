#!/usr/bin/env bash
#
# Fail on circular imports in the TypeScript source roots.
#
# Two things this guards against, the second learned the hard way:
#
#   1. A cycle, obviously.
#   2. Checking nothing and reporting success. madge defaults to JavaScript
#      extensions, so pointed at this repo without `--extensions ts,tsx` it
#      prints
#
#          Processed 0 files (270ms)
#          ✔ No circular dependency found!
#
#      — a green check that read zero files. `pnpm check-circular-deps` was
#      already a no-op (`nx show projects --json > /dev/null`, #777); wiring
#      this script in naively would have replaced one no-op with another that
#      looked like it worked. So a root that yields no files is an error here,
#      not a pass.
#
# Usage: scripts/check-circular-deps.sh <dir> [dir...]

set -uo pipefail

if [ "$#" -eq 0 ]; then
  echo "usage: $0 <dir> [dir...]" >&2
  exit 2
fi

status=0

for src in "$@"; do
  if [ ! -d "$src" ]; then
    echo "✗ $src: not a directory" >&2
    status=1
    continue
  fi

  echo "→ madge $src"
  output=$(npx --yes madge --circular --extensions ts,tsx "$src" 2>&1)
  code=$?
  echo "$output" | sed 's/^/    /'

  processed=$(printf '%s\n' "$output" | sed -n 's/.*Processed \([0-9][0-9]*\) files.*/\1/p' | head -1)
  if [ -z "$processed" ] || [ "$processed" -eq 0 ] 2>/dev/null; then
    echo "✗ $src: madge processed no files — the path or --extensions is wrong," >&2
    echo "  and a check that reads nothing must not report success." >&2
    status=1
    continue
  fi

  # madge exits non-zero when it finds a cycle. Trust that rather than
  # string-matching its success message, which changes between versions.
  if [ "$code" -ne 0 ]; then
    echo "✗ $src: circular dependencies found" >&2
    status=1
  else
    echo "✓ $src: no cycles ($processed files)"
  fi
done

exit "$status"
