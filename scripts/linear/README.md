# scripts/linear/ (DEPRECATED)

> **⚠️ Deprecated 2026-07-16:** tracking moved to GitHub Issues + the
> [Scaffald project board](https://github.com/orgs/Unicorn/projects/9) — see
> [docs/agents/TRACKING.md](../../docs/agents/TRACKING.md). The open SC backlog
> was migrated to issues #368–#377 and canceled in Linear. These scripts are
> kept only for reading Linear history; do not file new work there.

Generic Linear toolkit for the Scaffald (SC) team. Reuses
`LINEAR_API_KEY` from `.env.production` (gitignored, parent worktree).

| Script | Purpose |
|---|---|
| [`backlog.mjs`](backlog.mjs) | Snapshot every open SC issue. Text by default; `--md` for a markdown report, `--json` for raw. |
| [`issue.mjs`](issue.mjs) | Fetch full details (description + comments) for one or more issues. `node scripts/linear/issue.mjs SC-19 SC-20`. |
| [`mutate.mjs`](mutate.mjs) | Generic mutation runner (comments, state moves, label adds, issue creates). Mutations are defined inline at the top of the file — edit the `PLAN` array then run with `--dry-run` first. |

Related (not in this folder):

- [`scripts/release-promote-linear.mjs`](../release-promote-linear.mjs) —
  bulk-promotes `vX.Y.Z`-labeled issues from In Github → In TestFlight.
  Wired to `pnpm release:promote`.
