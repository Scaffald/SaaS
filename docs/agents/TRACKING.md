# Issue tracking — GitHub Issues + Projects

As of 2026-07-16 all task tracking lives in **GitHub Issues** on
`Unicorn/UNI-Construct`, with the org-level **[Scaffald project board](https://github.com/orgs/Unicorn/projects/9)**
as the human-facing view. Linear (team SC) is **deprecated** — its open backlog
was migrated (SC-xxx → issues #368–#377, each cross-linked) and the remaining
Linear data is read-only history.

## The split

- **GitHub Issues = the queue for AI agents.** An issue labeled **`agent-ready`**
  is triaged, self-contained (repro, expected behavior, code pointers,
  acceptance criteria), and safe to pick up without further product input.
  Agents: pick from `agent-ready`, assign yourself/comment when starting, open a
  PR that references the issue (`Fixes #NNN`).
- **Project board = the view for humans.** Board: <https://github.com/orgs/Unicorn/projects/9>.
  Status columns: `Triage → Backlog → Todo → In Progress → In Review → In TestFlight → Done`.
  Issues needing a product/design call sit in **Triage** with the
  **`needs-design`** label — do not implement those without a decision on the issue.

## Labels

| Label | Meaning |
| --- | --- |
| `agent-ready` | Triaged + self-contained; an agent can pick it up |
| `needs-design` | Blocked on a product/design decision |
| `priority: urgent/high/medium/low` | Priority (maps from Linear's Urgent/High/Medium/Low) |
| `vX.Y.Z` | Release version label (same convention as Linear had) |
| `from-linear` | Migrated from Linear team SC |
| `bug` / `UX` / `DX` / `mobile` / `Feature` / `Growth` | Kind/area tags |

## Filing an issue (agents)

```bash
gh issue create -R Unicorn/UNI-Construct \
  -t "Title" -b "Repro / expected / pointers / acceptance" \
  -l bug -l "priority: high" -l agent-ready
# add to the board (status defaults to none; set it):
gh project item-add 9 --owner Unicorn --url <issue-url> --format json
gh project item-edit --project-id PVT_kwDOAGPSF84BdiwM --id <item-id> \
  --field-id PVTSSF_lADOAGPSF84BdiwMzhYDjug --single-select-option-id <status-option-id>
```

Status option ids: Triage `a9f9ff70` · Backlog `6b53c079` · Todo `dd782536` ·
In Progress `08c58b21` · In Review `7c561222` · In TestFlight `913e1483` ·
Done `44dc28a5`.

Body checklist for `agent-ready`: environment/repro steps, actual vs expected,
where to look (paths), acceptance criteria. If any of those are missing, label
it `needs-design` or leave it in Triage instead.

## Releases

The `vX.Y.Z` label convention carries over from Linear: label the issues that
ship in a release, move them to **In TestFlight** on the board when the build
is live, and **Done** once verified. `scripts/release-promote-linear.mjs` and
`scripts/linear/` are deprecated (see the banners in those files) — release
promotion is now a board-status move.

## History

- Migration session: 2026-07-16 (Linear SC-14/23/31/32/75/76/99/130/131/132 →
  GitHub #368–#377, commented + canceled in Linear).
- Old backlog snapshots: `docs/agents/audits/`.
