# Releasing @scaffald/ui

This package uses **semantic-release** for versioning and publishing. The docs site is deployed to GitHub Pages via its own workflow. The public [Scaffald/ui](https://github.com/Scaffald/ui) repo is kept in sync from this monorepo.

## Prerequisites

- **Conventional commits** on `main`: use `feat:`, `fix:`, `BREAKING CHANGE:`, etc. so semantic-release can compute the next version.
- **CI secrets** (for GitHub Actions): `NPM_TOKEN` (npm publish), `GITHUB_TOKEN` (releases; provided by Actions), and `SCAFFALD_UI_SYNC_TOKEN` (sync to public repo).

## 1. Semantic release (npm + GitHub release)

**Option A – Let CI run the release (recommended)**

1. Commit and push your changes to `main`.
2. The workflow **Release @scaffald/ui** (`.github/workflows/semantic-release-ui.yml`) runs when `packages/scaffald-ui/**` changes (excluding `docs-site/` and `*.md`).
3. It runs typecheck, lint, build, then `semantic-release` from `packages/scaffald-ui`, which:
   - Analyzes commits since the last `ui-v*` tag
   - Updates `CHANGELOG.md` and `package.json` version
   - Publishes to **npm** as `@scaffald/ui`
   - Creates a **GitHub release** with tag `ui-vX.Y.Z` and attaches the dist tarball
   - Commits the version bump and changelog with `[skip ci]`

**Option B – Run release locally**

From the repo root:

```bash
cd packages/scaffald-ui
pnpm build
GITHUB_TOKEN=<token> NPM_TOKEN=<npm_token> pnpm release
```

Then push the new commit and tag:

```bash
git push origin main
git push origin ui-vX.Y.Z
```

To see what would happen without publishing:

```bash
pnpm release:dry
```

## 2. Docs site (GitHub Pages)

- **Automatic**: The workflow **Deploy @scaffald/ui Docs** (`.github/workflows/deploy-ui-docs.yml`) runs on pushes to `main` that touch:
  - `packages/scaffald-ui/docs-site/**`
  - `packages/scaffald-ui/src/**`
  - `packages/scaffald-ui/README.md`
- It builds the UI package, builds the Docusaurus site, and deploys to **GitHub Pages** (e.g. https://ui.scaffald.com if configured).
- **Manual**: In GitHub, go to Actions → **Deploy @scaffald/ui Docs** → **Run workflow** and run it on `main`.

## 3. Sync to public repo (Scaffald/ui)

- **Sync @scaffald/ui to Public Repository** (`.github/workflows/sync-ui-to-public.yml`) runs:
  - On push to `main` when `packages/scaffald-ui/**` changes, and
  - On push of tags `ui-v*`.
- It pushes the `packages/scaffald-ui` subtree to the **Scaffald/ui** repo as `main` and syncs version tags (e.g. `ui-v1.2.3` → `v1.2.3` there).

## Summary

| Goal              | Trigger / Command                                      |
|-------------------|--------------------------------------------------------|
| New npm release   | Push to `main` (release workflow) or run `pnpm release` locally |
| Update docs site  | Push to `main` (docs workflow) or run "Deploy @scaffald/ui Docs" manually |
| Sync public repo  | Automatic on `main` push and on `ui-v*` tag push       |

Configuration: `.releaserc.json` (tag format `ui-v${version}`, changelog, npm publish, GitHub release, git commit).

## Sync + docs only (no new version)

If you only want to **push the UI package to the Scaffald/ui repo** and **refresh the docs site** without running semantic-release (no npm publish, no new tag):

1. **Commit and push** your changes to `main`.
2. **Sync**: The workflow **Sync @scaffald/ui to Public Repository** runs on any push to `main` that touches `packages/scaffald-ui/**`. It pushes the `packages/scaffald-ui` subtree to the public **Scaffald/ui** repo as `main`.
3. **Docs**: The workflow **Deploy @scaffald/ui Docs** runs only when `packages/scaffald-ui/docs-site/**`, `packages/scaffald-ui/src/**`, or `packages/scaffald-ui/README.md` change. If your push didn’t touch those paths, trigger it manually: **Actions** → **Deploy @scaffald/ui Docs** → **Run workflow** → **Run workflow** (branch: `main`).
