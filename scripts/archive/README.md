# Archived Scripts

One-off migration, codemod, and setup scripts. Kept for reference; use standard workflows for new work.

## Contents

| Script | Purpose |
|--------|---------|
| `fix-duplicate-styles.js` | Codemod to merge duplicate style props in JSX (one-time cleanup) |
| `fix-beyond-ui-props.mjs` | Beyond UI migration codemod – size/padding prop conversions |
| `setup-docs-domain.sh` | One-time docs site domain setup |
| `setup-docs-domain-github-pages.sh` | One-time GitHub Pages domain config for docs |

## Preferred Alternatives

- **Database migrations**: Use `pnpm supa db push` or `pnpm supa migration up`
- **Codemods**: Run manually when needed; prefer Nx generators for new code
- **API testing**: Use `scripts/test-api.sh` or `pnpm test:api`
