# 2026-06-10 — v1.10.0 prep audits

Two prep passes informing v1.10.0 scope work. Neither captures new findings
— both roll up existing state into actionable form.

1. **Worker-flow status matrix (SC-22)** — consolidates the four web-app
   audit passes (SC-18 create-job, SC-19 apply, SC-20 onboarding/profile,
   SC-21 certification) + the v1.7.0 profile-API repair sweep into a
   single per-flow status view. Master input for mobile MVP
   implementation prioritization.
2. **@scaffald/ui usage inventory (SC-27 prep)** — mechanical inventory of
   the UI kit's ~1,100 public exports, classified by who imports them
   directly. Identifies dead exports (candidates for "comment out / hide"
   per the SC-27 ticket) and surfaces an architectural reality: `apps/web`
   consumes the kit only through wrapper packages.

## Files

| File | Role |
|---|---|
| [`STATUS-MATRIX.md`](STATUS-MATRIX.md) | **SC-22 deliverable.** Per-flow synthesis: what shipped, what's verified, cross-cutting patterns, v1.10.0 implications. |
| [`generate-status-matrix.mjs`](generate-status-matrix.mjs) | Re-queries Linear + git for the raw ticket → PR map. Refreshes STATUS-MATRIX tables. |
| [`UI-KIT-INVENTORY.md`](UI-KIT-INVENTORY.md) | **SC-27 prep deliverable.** Per-export usage breakdown of `@scaffald/ui`: dead / mobile-direct / package-only. Triage queue for the refactor. |
| [`inventory-ui-kit.mjs`](inventory-ui-kit.mjs) | Re-generates UI-KIT-INVENTORY.md from the current submodule + consumer state. |

## Running the generators

```bash
# SC-22 status matrix (needs Linear API key)
node --env-file=.env.production scripts/audit/2026-06-10/generate-status-matrix.mjs

# SC-27 UI-kit inventory (pure source-tree scan, no auth)
node scripts/audit/2026-06-10/inventory-ui-kit.mjs > scripts/audit/2026-06-10/UI-KIT-INVENTORY.md
```

`LINEAR_API_KEY` for the status-matrix generator is read from
`.env.production` (same pattern as `scripts/release-promote-linear.mjs`).

## Why this lives in `scripts/audit/<date>/`

Matches the pattern from `2026-05-26/` and `2026-05-28/`: each audit gets
its own dated folder. Unlike those, these generators are *reusable* — they
re-query live state (Linear, source tree) so re-running tomorrow will
pick up newly-shipped tickets or newly-added exports.

## Related

- [SC-22](https://linear.app/scaffald/issue/SC-22) · [SC-27](https://linear.app/scaffald/issue/SC-27)
- Parent audits (all Done): [SC-18](https://linear.app/scaffald/issue/SC-18),
  [SC-19](https://linear.app/scaffald/issue/SC-19),
  [SC-20](https://linear.app/scaffald/issue/SC-20),
  [SC-21](https://linear.app/scaffald/issue/SC-21)
- Release process: [docs/agents/RELEASE-PROCESS.md](../../../docs/agents/RELEASE-PROCESS.md)
