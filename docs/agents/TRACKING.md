# Issue tracking — GitHub Issues + Projects

As of 2026-07-16 all task tracking lives in **GitHub Issues** on
`Scaffald/SaaS`, with the org-level **[Scaffald project board](https://github.com/orgs/Scaffald/projects/1)**
as the human-facing view. Linear (team SC) is **deprecated** — its open backlog
was migrated (SC-xxx → issues #368–#377, each cross-linked) and the remaining
Linear data is read-only history.

## The split

- **GitHub Issues = the queue for AI agents.** An issue labeled **`agent-ready`**
  is triaged, self-contained (repro, expected behavior, code pointers,
  acceptance criteria), and safe to pick up without further product input.
  Agents: pick from `agent-ready`, assign yourself/comment when starting, open a
  PR that references the issue (`Fixes #NNN`).
- **Project board = the view for humans.** Board: <https://github.com/orgs/Scaffald/projects/1>.
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
gh issue create -R Scaffald/SaaS \
  -t "Title" -b "Repro / expected / pointers / acceptance" \
  -l bug -l "priority: high" -l agent-ready
# add to the board (status defaults to none; set it):
gh project item-add 1 --owner Scaffald --url <issue-url> --format json
gh project item-edit --project-id PVT_kwDOD5PrZ84Be5KD --id <item-id> \
  --field-id PVTSSF_lADOD5PrZ84Be5KDzhZQB8A --single-select-option-id <status-option-id>
```

Status option ids: Triage `17e392d5` · Backlog `ffb7b2b1` · Todo `a0b568a3` ·
In Progress `60098143` · In Review `a5784807` · In TestFlight `19276ced` ·
Done `8532a4f6`.

Body checklist for `agent-ready`: environment/repro steps, actual vs expected,
where to look (paths), acceptance criteria. If any of those are missing, label
it `needs-design` or leave it in Triage instead.

## Releases

The `vX.Y.Z` label convention carries over from Linear: label the issues that
ship in a release, move them to **In TestFlight** on the board when the build
is live, and **Done** once verified. The old Linear promotion scripts were
removed in the Scaffald org migration — release promotion is now a
board-status move.

## History

- Migration session: 2026-07-16 (Linear SC-14/23/31/32/75/76/99/130/131/132 →
  GitHub #368–#377, commented + canceled in Linear).
- Old backlog snapshots: `docs/agents/audits/`.
