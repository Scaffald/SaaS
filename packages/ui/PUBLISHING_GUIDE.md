# Publishing Guide for @unicornlove/ui

## Prerequisites

1. **NPM Authentication**
   ```bash
   npm login
   # Or use automation token:
   # Create token at https://www.npmjs.com/settings/unicornlove/tokens
   # Type: Automation
   # Scopes: read:packages, write:packages
   ```

2. **GitHub Secrets** (for CI/CD)
   - Go to: https://github.com/Unicorn/unicornlove-ui/settings/secrets/actions
   - Add `NPM_TOKEN` with your npm automation token

## Publishing Alpha Version

```bash
cd /Users/clay/Development/unicornlove-ui

# 1. Verify build
pnpm build

# 2. Verify tests
pnpm test:unit

# 3. Dry run semantic-release
pnpm release:dry-run

# 4. Publish alpha version
npm publish --tag alpha --access public
```

## Publishing via Semantic Release (Automated)

After setting up GitHub secrets, semantic-release will automatically:
- Analyze commits
- Determine version bump
- Generate changelog
- Publish to npm
- Create GitHub release

Triggered on push to `main` branch.

## Manual Version Publishing

If you need to publish manually:

```bash
# Update version in package.json
npm version patch|minor|major

# Build and publish
pnpm build
npm publish --access public
```

## Testing Installation

After publishing:

```bash
# In a test project
pnpm add @unicornlove/ui@alpha

# Or specific version
pnpm add @unicornlove/ui@1.0.0
```

## Migration to SCF-Scaffald

After publishing, migrate SCF-Scaffald:

```bash
cd /Users/clay/Development/SCF-Scaffald
./packages/ui/scripts/migrate-scaffald.sh 1.0.0
```

