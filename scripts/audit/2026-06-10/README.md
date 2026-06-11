# 2026-06-10 — Worker-flow status matrix (SC-22)

Consolidates the four web-app audit passes (SC-18 create-job, SC-19 apply,
SC-20 onboarding/profile, SC-21 certification) into a single per-flow status
view. Used as the master input for mobile MVP implementation prioritization.

This audit does **not** capture new findings — that work is already done.
It rolls up the 26 `[pre-audit/SC-1X]` child tickets (SC-100–SC-127) plus
the v1.7.0 profile-API repairs (SC-90–SC-99) and reports, per flow:

- What landed and in which release (v1.7.0 / v1.8.0 / v1.9.0)
- What's confirmed working in code
- What gaps remain (open tickets, untested paths)
- What this implies for mobile MVP work

## Files

| File | Role |
|---|---|
| [`STATUS-MATRIX.md`](STATUS-MATRIX.md) | **Deliverable.** Hand-curated per-flow synthesis. The thing to read. |
| [`generate-status-matrix.mjs`](generate-status-matrix.mjs) | Re-queries Linear + git for the raw ticket → PR map. Run to refresh the data tables in STATUS-MATRIX.md when state changes. |

## Running the generator

```bash
node --env-file=.env.production scripts/audit/2026-06-10/generate-status-matrix.mjs
```

Prints the per-flow tables to stdout. `LINEAR_API_KEY` is read from
`.env.production` (same pattern as `scripts/release-promote-linear.mjs`).

## Why this lives in `scripts/audit/<date>/`

Matches the pattern from `2026-05-26/` and `2026-05-28/`: each audit gets
its own dated folder. Unlike those, this one's `.mjs` is *reusable* — it
queries live Linear state by label/title pattern, so re-running tomorrow
will pick up newly-shipped or newly-filed tickets in the same flows.

## Related

- [SC-22](https://linear.app/scaffald/issue/SC-22) — this ticket
- Parent audits (all Done): [SC-18](https://linear.app/scaffald/issue/SC-18),
  [SC-19](https://linear.app/scaffald/issue/SC-19),
  [SC-20](https://linear.app/scaffald/issue/SC-20),
  [SC-21](https://linear.app/scaffald/issue/SC-21)
- Release process: [docs/agents/RELEASE-PROCESS.md](../../../docs/agents/RELEASE-PROCESS.md)
