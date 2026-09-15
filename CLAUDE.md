# CLAUDE.md

Guidance for Claude Code sessions in this repo.

## Canonical context

- [AGENTINFO.md](AGENTINFO.md) — architecture, packages, commands, environment, testing, deployment. Read it first.
- [.radium/](.radium/README.md) — one constraint doc per pillar. **Read the pillar doc before editing that area**:

| Editing… | Read |
|---|---|
| `packages/ui` components or tokens | `.radium/scaffald-ui.md` |
| `packages/sdk` or `*-sdk-hooks.ts` in scf-core | `.radium/scaffald-sdk.md` |
| `apps/scaffald` routes, layouts, navigation, auth | `.radium/app-expo.md` |
| `packages/supabase` edge functions, migrations, RLS | `.radium/supabase-backend.md` |
| build config, CI, dependency pins | `.radium/ci-deployment.md` |

`pnpm radium:check` greps for the known-bad patterns those docs describe. When a bug came from an agent misreading a constraint, fix the `.radium/` doc in the same PR.

## Working in this repo

- **pnpm only.** Use `pnpm supa …` rather than a global Supabase CLI. Never `npm`.
- **Shared checkout.** Other sessions use the same clone. Work in a git worktree, never switch branches, stash, reset, or `git checkout -- <path>` in the shared tree, and never rewrite history that has been pushed.
- **Hooks.** Pre-commit reformats staged files (re-add and amend if it changed anything). Run `pnpm prepush` before pushing; the push hook refuses without its stamp. See [.githooks/README.md](.githooks/README.md).
- **No non-terminating commands.** No `--watch`, `tail -f`, or dev servers from Bash. Use the preview tools for servers, and single-run commands (`pnpm check`, `pnpm test:unit`) for verification.
- **Routes are constants.** Paths come from `packages/scf-core/constants/routes.ts`; `scripts/check-hardcoded-routes.mjs` rejects string literals.
- **Tests hit real systems.** Real local database and real HTTP against the `api` edge function. Mocks are only for third-party services we don't own.
- **Migrations are append-only.** New numbered file; never edit an applied one.

## Tracking

Work is tracked in GitHub Issues on `Scaffald/SaaS` and the org project board. See [docs/agents/TRACKING.md](docs/agents/TRACKING.md) for labels and the `agent-ready` contract.

**Audit and investigation findings become GitHub Issues, not markdown.** Do not write findings to `docs/`. The shape:

1. Survey first: `gh label list`, `gh issue list --limit 60`, dedupe against what is open.
2. One issue per self-contained finding, with `file:line` evidence and an acceptance section. Add `agent-ready` only when it genuinely stands alone.
3. An epic issue rolling the children up: checkbox list, dependency notes, sequencing, and a "what is solid" section.
4. Milestones carry the version plan; the epic carries the narrative.

Design specs and architecture proposals are still markdown under `docs/plans/`. The rule is about *findings*, not intent.
