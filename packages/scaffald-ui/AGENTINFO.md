# Scaffald UI – Agent / automation context

> **Canonical source** for the [Scaffald/ui](https://github.com/Scaffald/ui) repo. This package is developed in the **UNI-Construct** monorepo and synced here; docs are built and deployed from **this repo**.

## Repo identity

- **This repo**: [Scaffald/ui](https://github.com/Scaffald/ui) – public, standalone mirror of the `@scaffald/ui` package.
- **Upstream**: [Unicorn/UNI-Construct](https://github.com/Unicorn/UNI-Construct) – private monorepo; `packages/scaffald-ui` is synced to this repo’s `main` via GitHub Actions.
- **npm**: [@scaffald/ui](https://www.npmjs.com/package/@scaffald/ui) – published from UNI-Construct (semantic-release), not from this repo.
- **Docs**: https://ui.scaffald.com – built and deployed from **this repo** (GitHub Pages, workflow: **Deploy Docs**).

## Where things run

| Action | Repo | Workflow / notes |
|--------|------|-------------------|
| **Docs build + deploy** | **This repo (Scaffald/ui)** | `.github/workflows/deploy-docs.yml` – runs on push to `main` when `docs-site/**`, `src/**`, or `README.md` change. Enable Pages in Settings → Pages → Source: **GitHub Actions**. |
| **npm publish, releases, changelog** | UNI-Construct | Not in this repo. Sync only; no release workflows here. |
| **Sync from monorepo** | UNI-Construct | Pushes this repo’s `main` and tags; no workflow in this repo triggers sync. |

## Local development (this repo)

- **Install**: `pnpm install` (root has `pnpm-workspace.yaml`: `.`, `docs-site`).
- **Build**: `pnpm run build` (package), `pnpm run docs:build` (Docusaurus).
- **Docs dev**: `pnpm run docs:dev` or `cd docs-site && pnpm start`.
- **Release / versioning**: Handled in UNI-Construct; see `RELEASE.md` there or in this repo for the full flow.

## For AI agents

- **Editing docs or components**: Change files in this repo and push to `main`. **Deploy Docs** will run and update https://ui.scaffald.com (if Pages is enabled).
- **Publishing a new npm version**: That is done in UNI-Construct (semantic-release). This repo is a read-only mirror for source and docs; do not run release or npm publish here.
- **Broken links**: Docusaurus is set to `onBrokenLinks: 'warn'` so the build succeeds; fix links in `docs-site/` and `docusaurus.config.ts` as needed.
