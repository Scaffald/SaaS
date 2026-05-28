# scripts/audit/

Audit tooling for the Scaffald mobile app.

## Reusable

| Script | Purpose |
|---|---|
| [`ui-sweep.mjs`](ui-sweep.mjs) | Playwright walk of every route in `apps/scaffald/app/` at a given viewport. Login via UI, save storageState, then capture each route. Output: `docs/agents/audits/<date>-ui-audit/` of screenshots + manifest. |

Run from the parent worktree (where `node_modules` lives):

```bash
cd /Users/clay/Development/UNI-Construct
node .claude/worktrees/<wt>/scripts/audit/ui-sweep.mjs
```

## Dated subfolders — one per audit run

Each audit run gets a dated folder for the one-off filing scripts. They're
not parameterized — they encode the specific Task IDs / finding IDs from that
particular pass. Keep them around as the audit log.

```
audit/
  ui-sweep.mjs              # reusable
  2026-05-26/
    file-findings.ts        # filed 19 findings as in-product Tasks
    create-linear-tickets.mjs   # created SC-77 through SC-89
```

To kick off a new audit:

1. Run `ui-sweep.mjs` → produces screenshots.
2. Hand-write `findings.md` after walking each.
3. Copy a previous date's filing scripts to today's date, swap the finding
   list + Task ID mapping, and run.
