#!/usr/bin/env python3
"""Verify the Play listing copy fits Play's limits.

The listing markdown is the source of truth; this reads it rather than holding
a second copy that could drift. Play rejects an over-length field at submission
time, which is a slow way to find out you miscounted.

    python3 play-store-assets/metadata/check-lengths.py

Exits non-zero if anything is over, so it can gate a commit.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

DOC = Path(__file__).with_name("play-store-listing.md")

# Play's documented limits.
LIMITS = {"App name": 30, "Short description": 80, "Full description": 4000}


def first_backticked_bold(section: str) -> str | None:
    """The chosen value is the first **`...`** in the section; alternates are plain."""
    m = re.search(r"\*\*`(.+?)`\*\*", section, re.S)
    return m.group(1) if m else None


def section(text: str, heading: str, until: str) -> str:
    start = text.index(heading) + len(heading)
    end = text.index(until, start)
    return text[start:end]


def main() -> int:
    text = DOC.read_text(encoding="utf-8")
    failures = []

    values = {
        "App name": first_backticked_bold(
            section(text, "## App name", "## Short description")
        ),
        "Short description": first_backticked_bold(
            section(text, "## Short description", "## Full description")
        ),
        # The description is the body itself, not a quoted string. Everything
        # between the heading and the commentary that follows it.
        "Full description": section(
            text, "## Full description — 4000 char max", "### Deliberate differences"
        ).strip(),
    }

    for field, limit in LIMITS.items():
        value = values[field]
        if value is None:
            failures.append(f"{field}: could not find a value in {DOC.name}")
            continue
        n = len(value)
        status = "ok" if n <= limit else "OVER"
        if n > limit:
            failures.append(f"{field}: {n} > {limit}")
        print(f"{field:<20} {n:>5} / {limit:<5} {status}")

    # The full description counts the <b> tags Play renders, so report the
    # visible length too — useful when trimming, misleading as a limit.
    visible = re.sub(r"</?[bi]>", "", values["Full description"] or "")
    print(f"{'  (visible text)':<20} {len(visible):>5}         markup stripped")

    print()
    if failures:
        for f in failures:
            print(f"FAIL  {f}")
        return 1
    print("All fields within Play limits.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
