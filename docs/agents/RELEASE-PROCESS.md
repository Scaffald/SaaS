# Release Process

Coordinated version tagging across git, Linear, commits, and TestFlight. The
goal is a single audit trail per release so we always know: what code shipped,
what tickets it covered, what's been QA'd, and what's safe to roll back to.

> Status: established 2026-05-19. First release under this process is
> `scaffald-app v1.1.0` (post-MAVA stabilization).

---

## Versioning convention

Per-package SemVer with a package-scoped tag prefix. Each shippable artifact
owns its own version line:

| Package | Source of truth | Tag scheme | Example |
|---|---|---|---|
| `scaffald-app` (mobile) | `apps/scaffald/package.json` `version` | `app-vX.Y.Z` | `app-v1.1.0` |
| `@scaffald/ui` (submodule) | `packages/ui` submodule pointer + its own tags | `vX.Y.Z` in submodule | `v2.4.0` |
| `@scaffald/sdk` | `packages/sdk/package.json` | `sdk-vX.Y.Z` | `sdk-v0.3.0` |
| `@scaffald/web` | `apps/web/package.json` | `web-vX.Y.Z` | `web-v0.1.0` |

**One git tag = one shippable build.** The tag points at the exact commit
whose `package.json` matches the version. The tag is created at the moment we
push to TestFlight (or equivalent for the artifact), not before.

### When to bump which number

- **PATCH** (`1.1.0` → `1.1.1`): bugfix only, no new behavior, no breaking
  changes. Hotfixes to a TestFlight release go here.
- **MINOR** (`1.1.0` → `1.2.0`): new features, additive changes, internal
  refactors. The common case for our 1-2 week release cadence.
- **MAJOR** (`1.x.y` → `2.0.0`): breaking changes for end users (auth flow
  reset, data model migration, UX repositioning). Or a major product-level
  reset signal.

Don't promote a release to MAJOR just because the diff is big. The signal is
"end users have to adapt" or "the team's mental model of the product changed."

---

## Linear coordination

### Version labels

Every Linear issue that's in flight for a release gets a `vX.Y.Z` label
matching the target scaffald-app version. Labels are team-scoped (Scaffald).

- Filter by label = release-notes draft for that version.
- Issue can be in any Linear Project (Mobile MVP, Worker Core Flows, etc.) —
  the version label is orthogonal.

The version label is applied **when the issue is picked up**, not when it
ships. If an issue slips, move the label to the next version.

### Status flow

```
Triage → Todo → In Progress → In Review → Done → In QA → Verified
                                              ↘ Canceled
```

- **Done**: PR merged to `main`. Code is in the repo but not on TestFlight.
- **In QA**: a TestFlight build containing this issue exists. QA can test it.
- **Verified**: QA signed off. Safe to promote to production / App Store.

> The "In QA" and "Verified" states must be added in Linear team settings
> (the Linear MCP doesn't expose state creation via API). They should both be
> created with the `started` and `completed` type respectively. Once added,
> the release script (see below) automates the `Done → In QA` transition.

### Don't QA against `main`

QA / QC / UAT only tests against a tagged TestFlight build. `main` HEAD
between releases is unstable by design.

---

## Release flow

The full sequence to ship `scaffald-app vX.Y.Z`:

1. **Confirm the version label is right.** Look at Linear `vX.Y.Z`-labeled
   `Done` issues. Anything still `In Progress` or `In Review` should either
   land before the cut or be moved to the next version's label.
2. **Bump the version.**
   ```bash
   pnpm release:app X.Y.Z
   ```
   This bumps `apps/scaffald/package.json`, commits with
   `chore(release): bump scaffald-app to X.Y.Z`, creates tag `app-vX.Y.Z`,
   and pushes both. (See [scripts/release.sh](../../scripts/release.sh) —
   build out as needed.)
3. **Trigger the EAS build.**
   ```bash
   pnpm --filter scaffald-app eas:build:dev:device:ios
   ```
4. **Submit to TestFlight** when the build is green.
5. **Promote Linear issues.** Move every `vX.Y.Z`-labeled `Done` issue to
   `In QA`. (The release script can do this via the Linear API once it's
   wired up.)
6. **QA tests against the TestFlight build.** As each issue is validated,
   move it to `Verified`.
7. **Production promotion** happens out of band (App Store submission) once
   all `vX.Y.Z` issues are `Verified`.

### Submodule pointer bumps

If a release pulls in new commits from `packages/ui` (or other submodules),
the bump commits land on `main` before the release. Each submodule's own
release process is independent — its own `vX.Y.Z` tag is created in its repo
when its dist artifact ships.

---

## Rollback

To roll back to a known-good build:

```bash
git checkout app-vX.Y.Z      # the previous green tag
pnpm --filter scaffald-app eas:build:dev:device:ios
```

The tag is the rollback target. This is why one tag per TestFlight build
matters — every shipped artifact has a reproducible source commit.

---

## What this process replaces

- Manual `chore(release): bump scaffald-app to X.Y.Z` commits without
  corresponding git tags (which is what produced `1.0.1` with no tag).
- Old `semantic-release`-style `vX.Y.Z` tags that didn't correspond to any
  particular package (`v1.0.0`, `v1.1.0`, `v1.2.0` from Dec 2025 — leave
  in place but they're not load-bearing).
- Ad-hoc "is this on TestFlight yet?" questions in Slack.

---

## Conventions for contributors

- **Commit messages**: keep the existing pattern. `Closes Scaffald/SC-X` in
  the commit body so Linear auto-closes the issue on merge.
- **PR titles**: lead with the scope and the ticket(s). Existing convention
  is fine.
- **Branches**: `clay/sc-X-...` per issue, or `clay/sc-X-Y-...` for grouped
  work. Same as now.
- **Don't tag commits manually** outside the release flow. Tags are reserved
  for shippable builds.

---

## See also

- [CLAUDE.md](./CLAUDE.md) — top-level agent guidance for this repo.
- [DOGFOODING.md](./DOGFOODING.md) — internal usage / smoke testing.
- [Linear roadmap view](https://linear.app/scaffald/team/SC) — filter by
  `vX.Y.Z` label for release notes.
