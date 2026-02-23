# Releasing @scaffald/ui

This package uses **semantic-release** for versioning and publishing. The **docs site is built and deployed from the [Scaffald/ui](https://github.com/Scaffald/ui) repo** (GitHub Pages). The UNI-Construct monorepo syncs this package to Scaffald/ui; release and npm publish run from the monorepo.

## Where things run

| What | Where it runs |
|------|----------------|
| **npm publish, GitHub release, changelog** | **UNI-Construct** monorepo (`.github/workflows/semantic-release-ui.yml`) |
| **Sync to Scaffald/ui** | **UNI-Construct** (`.github/workflows/sync-ui-to-public.yml`) |
| **Docs build + GitHub Pages deploy** | **Scaffald/ui** repo (`.github/workflows/deploy-docs.yml`, synced with this package) |

GitHub Pages must be enabled in **Scaffald/ui** (Settings → Pages → Source: **GitHub Actions**). The deploy workflow lives in this package so it is present in Scaffald/ui after sync.

## Prerequisites

- **Conventional commits** on `main`: use `feat:`, `fix:`, `BREAKING CHANGE:`, etc. so semantic-release can compute the next version.
- **CI secrets** (UNI-Construct): `NPM_TOKEN`, `GITHUB_TOKEN`, `SCAFFALD_UI_SYNC_TOKEN`.
- **Scaffald/ui**: GitHub Pages enabled and set to build from GitHub Actions.

## 1. Semantic release (npm + GitHub release) – monorepo

**Option A – Let CI run the release (recommended)**

1. Commit and push your changes to `main` in **UNI-Construct**.
2. The workflow **Release @scaffald/ui** runs when `packages/scaffald-ui/**` changes (excluding `docs-site/` and `*.md`).
3. It runs typecheck, lint, build, then `semantic-release` from this package: updates CHANGELOG and version, publishes to npm, creates GitHub release with tag `ui-vX.Y.Z`, and commits back with `[skip ci]`.

**Option B – Run release locally**

From UNI-Construct repo root:

```bash
cd packages/scaffald-ui
pnpm build
GITHUB_TOKEN=<token> NPM_TOKEN=<npm_token> pnpm release
git push origin main
git push origin ui-vX.Y.Z
```

Dry run: `pnpm release:dry`

## 2. Docs site (GitHub Pages) – Scaffald/ui repo

- **Automatic**: After sync, the **Scaffald/ui** repo has workflow **Deploy Docs** (`.github/workflows/deploy-docs.yml`). It runs on push to `main` when `docs-site/**`, `src/**`, or `README.md` change, builds the package and Docusaurus site, and deploys to GitHub Pages (e.g. https://ui.scaffald.com).
- **Trigger**: Pushing to `main` in **UNI-Construct** with scaffald-ui changes runs **Sync @scaffald/ui to Public Repository**, which updates **Scaffald/ui**; that push then triggers **Deploy Docs** in Scaffald/ui.
- **Manual**: In the **Scaffald/ui** repo, Actions → **Deploy Docs** → Run workflow.

Docs are **not** deployed from UNI-Construct; only from Scaffald/ui where Pages is configured.

## 3. Sync to public repo (Scaffald/ui)

- In **UNI-Construct**, **Sync @scaffald/ui to Public Repository** runs on push to `main` (when `packages/scaffald-ui/**` changes) and on tags `ui-v*`. It pushes this package’s tree to **Scaffald/ui** `main` and syncs version tags.

## Summary

| Goal | Where | Trigger |
|------|--------|--------|
| New npm release | UNI-Construct | Push to `main` or `pnpm release` locally |
| Update docs site | **Scaffald/ui** | Push to Scaffald/ui `main` (after sync) or run “Deploy Docs” there |
| Sync public repo | UNI-Construct | Automatic on `main` push and `ui-v*` tag |

## Sync + docs only (no new version)

To push the UI package to Scaffald/ui and refresh the docs **without** a new npm release:

1. Commit and push changes to **UNI-Construct** `main`.
2. **Sync** runs and updates **Scaffald/ui** `main`.
3. **Deploy Docs** runs in **Scaffald/ui** (if `docs-site/**`, `src/**`, or `README.md` changed). If not, run **Deploy Docs** manually in Scaffald/ui.

Configuration: `.releaserc.json` (tag format `ui-v${version}`, changelog, npm publish, GitHub release, git commit).
