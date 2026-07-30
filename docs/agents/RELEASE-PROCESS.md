# Release Process

> **⚠️ Tracker migrated (2026-07-16):** Linear is deprecated — tracking now
> lives in GitHub Issues + the [Scaffald project board](https://github.com/orgs/Scaffald/projects/1).
> See [TRACKING.md](TRACKING.md). Read the Linear steps below as their board
> equivalents: `vX.Y.Z` Linear label → GitHub `vX.Y.Z` issue label; "In Github"
> / "In TestFlight" state moves → board Status column moves;
> `pnpm release:promote` → bulk board-status update.

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

The web build no longer has a version line of its own. `@scaffald/web` was the
Next.js marketing site at `apps/web`; the marketing pages moved into the Expo
app in July 2026 and the package was deleted, so the web deploy now ships from
`apps/scaffald` under the `app-vX.Y.Z` tag along with everything else.

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
Triage → Todo → In Progress → In Github → In TestFlight → Done
                                                       ↘ Canceled
```

- **In Github**: PR merged to `main`. Code is in the repo but not on
  TestFlight yet. Author is effectively done with the work.
- **In TestFlight**: a TestFlight build containing this issue exists. QA can
  test it. This is the QA team's "ready to sign off" queue.
- **Done**: QA has validated the change against the TestFlight build. Safe
  to promote to production / App Store.

> The "In Github" and "In TestFlight" states are configured in Linear team
> settings. Once they exist, the release script's bulk-promotion step can
> move all `vX.Y.Z`-labeled `In Github` issues to `In TestFlight` after a
> successful release cut.

### Don't QA against `main`

QA / QC / UAT only tests against a tagged TestFlight build. `main` HEAD
between releases is unstable by design.

---

## Release flow

The full sequence to ship `scaffald-app vX.Y.Z`:

1. **Confirm the version label is right.** Look at Linear `vX.Y.Z`-labeled
   `In Github` issues. Anything still `In Progress` should either land
   before the cut or be moved to the next version's label.
2. **Bump the version.**
   ```bash
   pnpm release:app X.Y.Z
   ```
   This bumps `apps/scaffald/package.json`, commits with
   `chore(release): bump scaffald-app to X.Y.Z`, creates tag `app-vX.Y.Z`,
   and pushes both. (See [scripts/release.sh](../../scripts/release.sh) —
   build out as needed.)
3. **Trigger the EAS build (and auto-submit).**
   ```bash
   pnpm ship:ios
   ```
   This script (in `scripts/ship-ios.sh`) validates the production env
   *before* kicking off EAS so you don't burn 20 minutes on a build that's
   guaranteed to fail. It checks:
   - `.env.production` exists and has every `EXPO_PUBLIC_*` var that
     `eas.json` doesn't already hardcode (Mapbox, Google OAuth, etc.).
   - The Mapbox token actually works (live ping to the geocoding API).
   - The EAS server-side secret `POSTHOG_KEY_PROD` is registered.
   - You're on `main` (warns if not).

   Then runs `eas build --profile production --platform ios --non-interactive --no-wait --auto-submit`
   so the build queues on EAS and auto-submits to TestFlight when complete.
   Pass `--yes` to skip the confirmation prompt, `--no-build` for a
   validation-only dry run.
4. **TestFlight submission is automatic** with `--auto-submit`.
5. **Once the TestFlight build is live, promote Linear issues:**
   ```bash
   pnpm release:promote X.Y.Z
   ```
   This finds every issue with label `vX.Y.Z` in state `In Github` and moves
   it to `In TestFlight` in one batch. Pass `--dry-run` to preview without
   writing.

   **Where the key lives:** `LINEAR_API_KEY` is stored in the project root's
   gitignored `.env.production` file. The `release:promote` pnpm script
   auto-loads it via `dotenv -e .env.production --`, so no manual env var
   is needed. If you ever need a fresh key, generate one at
   [Linear → Settings → Account → Security](https://linear.app/settings/account/security)
   and append it to `.env.production` (see `.env.template` for the format).
6. **QA tests against the TestFlight build.** As each issue is validated,
   move it to `Done`.
7. **Production promotion** happens out of band (App Store submission) once
   all `vX.Y.Z` issues are `Done`.

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
