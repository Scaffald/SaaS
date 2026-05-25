# Next session — kick off here

> Self-contained brief for the next Claude Code session. Paste the
> "Starting prompt" section verbatim (or `cat` this file into the chat)
> and the agent should have full context.

## Next version to cut: `app-v1.4.1` (patch)

Two mobile-bundle UI fixes have landed on `main` since `app-v1.4.0` was
tagged but haven't shipped to TestFlight yet:

- [#303](https://github.com/Unicorn/UNI-Construct/pull/303) — ProjectSelector full-viewport AlertCircle (size string → numeric)
- [#306](https://github.com/Unicorn/UNI-Construct/pull/306) — 5 more lucide-icon size sites swept (IPIPResultsPage + DrawerLink)

Both are user-visible. A patch ships them through TestFlight QA on the
same v1.4.x baseline rather than waiting for v1.5.0 feature work.

The other commits on `main` since v1.4.0 (#301 ship-ios.sh, #302
LINEAR_API_KEY, #304 cross-env dogfood) are release-engineering only —
they don't change the mobile bundle. Edge-function and CI work doesn't
ride the mobile version.

Confirm the exact diff with:
```
git log app-v1.4.0..origin/main --oneline
```

After v1.4.1 lands, **v1.5.0** opens up — primary candidate is the
column + function-level schema audit (task #31 from the previous
session's list; see `docs/agents/audits/2026-05-22-supabase-schema-drift.md:55-59`).

---

## State at the end of 2026-05-24

### Shipped today (8 PRs + Scaffald/ui#7 + app-v1.4.0)

| # | What |
|---|---|
| [#298](https://github.com/Unicorn/UNI-Construct/pull/298) | Expo SDK 55 → 56 atomic upgrade |
| [#299](https://github.com/Unicorn/UNI-Construct/pull/299) | dotenv-cli 7→11 + moti 0.25→0.30 |
| [#300](https://github.com/Unicorn/UNI-Construct/pull/300) | `@scaffald/ui` submodule pointer to merged main |
| [#301](https://github.com/Unicorn/UNI-Construct/pull/301) | `ship-ios.sh` POSTHOG check → `eas env:list` |
| [#302](https://github.com/Unicorn/UNI-Construct/pull/302) | Auto-load `LINEAR_API_KEY` for `release:promote` |
| [#303](https://github.com/Unicorn/UNI-Construct/pull/303) | Work Logs restoration + `/v1/health` + deploy-skew audit |
| [#304](https://github.com/Unicorn/UNI-Construct/pull/304) | Cross-env `dogfood-log` + Codex P2 on `deploy-functions.sh` |
| [#306](https://github.com/Unicorn/UNI-Construct/pull/306) | 5-site lucide icon size sweep |
| [Scaffald/ui#7](https://github.com/Scaffald/ui/pull/7) | `StyleSheet.absoluteFillObject` → `absoluteFill` |
| `app-v1.4.0` | Tagged + on TestFlight (EAS build `b4cf2359`, build number 10400) |

### Live infra

- Edge functions on dev/preview/prod all serve commit `00b39dd00` per
  `/v1/health`. Verify any time with:
  ```bash
  curl -s https://pmtdqrfpumqwkdhpgwcz.supabase.co/functions/v1/api/v1/health
  curl -s https://uhjkipdwayqfihkanabk.supabase.co/functions/v1/api/v1/health
  curl -s https://qmfmpcyxsihhfttvqpbw.supabase.co/functions/v1/api/v1/health
  ```
- `pnpm deploy:functions:{dev,preview,prod}` (delegates to
  [scripts/deploy-functions.sh](../../../scripts/deploy-functions.sh))
  is the canonical manual deploy when CI is blocked. Bakes
  `GIT_COMMIT` + `DEPLOYED_AT` into project secrets so `/v1/health`
  reports correctly.
- `.github/workflows/deploy-skew-audit.yml` runs nightly when CI is
  unblocked — fails loudly if any env's `/v1/health` reports a commit
  >7 days behind `origin/main`.

### Known gotchas

- **CI is billing-blocked org-wide.** Every PR's checks fail in 3-4s.
  Local gates (`pnpm typecheck`, `pnpm lint`, `pnpm test:unit`,
  `pnpm web:build`) are the source of truth. Merge with
  `gh pr merge <N> --admin --squash`.
- **Pre-commit / pre-push hooks** rerun broad nx graphs and often
  trigger over-matching errors on unrelated files. Use
  `SKIP_PRECOMMIT=1` / `SKIP_PREPUSH=1` after confirming local gates
  pass.
- **Parent worktree** at `/Users/clay/Development/UNI-Construct` is
  where main is checked out. The `.claude/worktrees/*` worktrees are
  what Claude sessions branch off; release scripts that require a
  clean tree (`pnpm release:app`, `pnpm ship:ios`) run cleanest from
  the parent worktree on the `main` branch.
- **dogfood-log** now supports `--projectId <uuid>` and `--list` for
  cross-env use. On dev, `clay@unicorn.love` can see 3 projects (HQ
  Renovation, Warehouse Build, Office Fit-Out) per
  `seeds/011_seed-real-org-structure.sql`.
- **Linear MCP** may need reconnect (`/mcp` UI flow). Linear API key
  for `release:promote` is in gitignored `.env.production`
  (`LINEAR_API_KEY=lin_api_...`).

---

## Starting prompt (paste into next session)

> Cut `app-v1.4.1` to TestFlight to ship the UI fixes that landed since
> v1.4.0 (the 3 PRs called out in
> `docs/agents/handoffs/2026-05-25-next-session.md`). The mobile app
> hasn't shipped to TestFlight since 2026-05-24 ~20:49 PT (`app-v1.4.0`,
> build 10400, commit `cf8a453fe`). Follow `docs/agents/RELEASE-PROCESS.md`:
>
> 1. Verify `main` is clean: `git status` + `git log app-v1.4.0..main`
>    shows only the three UI commits above (and the release-engineering
>    PRs which don't touch mobile bundle).
> 2. Optional sanity: pull and run local gates (`pnpm typecheck`,
>    `pnpm lint`, `pnpm test:unit`, `pnpm web:build`).
> 3. Apply Linear `v1.4.1` label to any SC issues you want bundled.
>    (Probably zero — this is a UX patch.)
> 4. `echo y | pnpm release:app 1.4.1` (the prompt is interactive; pipe
>    `y` in to confirm). Pushes commit `chore(release): scaffald-app v1.4.1`
>    + tag `app-v1.4.1`.
> 5. `pnpm ship:ios --yes` — EAS prod build + auto-submit to TestFlight.
>    Build runs ~8-15 min in the cloud. Monitor via:
>    `cd apps/scaffald && pnpm exec eas build:view <id>`.
> 6. Once TestFlight ingests the build, run `pnpm release:promote 1.4.1`
>    (auto-loads `LINEAR_API_KEY` from `.env.production`).
> 7. Dogfood-log the session via:
>    ```
>    dotenv -e .env.dev -- pnpm tsx scripts/dogfood-log.ts \
>      --team frontend --projectId b0000001-0000-4000-8000-000000000001 \
>      --hours <x> --description "..." --tasks "..." --submit
>    ```
>    (Project UUID is "HQ Renovation" on dev — clay's only fixture
>    project. Run `pnpm tsx scripts/dogfood-log.ts --list` against
>    .env.dev to refresh if needed.)
>
> Then start on **v1.5.0**: column + function-level schema audit per
> `docs/agents/audits/2026-05-22-supabase-schema-drift.md:55-59`. The
> table-level audit is done (SC-67 caught up). Remaining: column
> additions on existing tables, functions/triggers/RLS policies,
> indexes/constraints. Plan suggests "an evening of careful work" —
> dump schemas, diff, file each remaining drift as its own ticket.
>
> All context: `docs/agents/handoffs/2026-05-25-next-session.md`.

---

## Outstanding tasks not on the critical path

- **Storybook in scf-core** (task #49 from prev session): currently no
  config — would need to set it up or migrate ProjectSelector to
  `packages/ui` where stories already work. Blocks visual regression
  testing of work-logs form states.
- **Memory** of stale tasks: prev session's task list had ~50 entries
  by the end. Worth starting fresh.
- **Same `size="md"` bug** elsewhere if grep turns up new occurrences —
  the [#303](https://github.com/Unicorn/UNI-Construct/pull/303) + [#306](https://github.com/Unicorn/UNI-Construct/pull/306) sweep covered scf-core but not
  `apps/scaffald/app/**`. Quick grep:
  ```bash
  grep -rn 'size="\(xs\|sm\|md\|lg\|xl\)"' apps/scaffald/app --include="*.tsx" | grep -v node_modules
  ```
  Then filter by whether the parent component is a lucide icon (capital
  name imported from `lucide-react-native`).

---

## Files / commands cheat-sheet

| Need | File / cmd |
|---|---|
| Release process | `docs/agents/RELEASE-PROCESS.md` |
| Schema-drift audit | `docs/agents/audits/2026-05-22-supabase-schema-drift.md` |
| Per-pillar constraints | `.radium/*.md` (read before touching that area) |
| Deploy edge functions manually | `pnpm deploy:functions:{dev,preview,prod}` |
| Smoke health endpoint | `curl https://<ref>.supabase.co/functions/v1/api/v1/health` |
| Dogfood-log to dev | `dotenv -e .env.dev -- pnpm tsx scripts/dogfood-log.ts --list` |
| Cut + ship mobile | `echo y \| pnpm release:app X.Y.Z && pnpm ship:ios --yes` |
| Promote Linear post-TestFlight | `pnpm release:promote X.Y.Z` |
| Bypass pre-commit / pre-push (local gates verified) | `SKIP_PRECOMMIT=1 git commit ...` / `SKIP_PREPUSH=1 git push ...` |

Project refs (dev/preview/prod):
- dev: `pmtdqrfpumqwkdhpgwcz`
- preview: `uhjkipdwayqfihkanabk`
- prod: `qmfmpcyxsihhfttvqpbw`
