# Manual Steps for REQ-311 Completion

## Step 1: NPM Authentication

```bash
cd /Users/clay/Development/unicornlove-ui
npm login
# Enter your npm credentials when prompted
```

**Alternative: Use Automation Token**
1. Go to: https://www.npmjs.com/settings/unicornlove/tokens
2. Create new token (Type: Automation)
3. Scopes: `read:packages`, `write:packages`
4. Save token for GitHub secrets (Step 3)

## Step 2: Publish Alpha Version

```bash
cd /Users/clay/Development/unicornlove-ui

# Verify everything is ready
pnpm build
pnpm test:unit

# Publish alpha version
npm publish --tag alpha --access public
```

**Expected Output:**
```
+ @unicornlove/ui@1.0.0
```

## Step 3: Set Up GitHub Secrets

1. Go to: https://github.com/Unicorn/unicornlove-ui/settings/secrets/actions
2. Click "New repository secret"
3. Name: `NPM_TOKEN`
4. Value: Your npm automation token (from Step 1)
5. Click "Add secret"

This enables automated publishing via semantic-release.

## Step 4: Test Installation

```bash
# In a test directory
mkdir /tmp/test-unicornlove-ui
cd /tmp/test-unicornlove-ui
pnpm init -y
pnpm add @unicornlove/ui@alpha

# Test import
node -e "const ui = require('@unicornlove/ui'); console.log('✅ Package installed successfully')"
```

## Step 5: Migrate SCF-Scaffald

```bash
cd /Users/clay/Development/SCF-Scaffald

# Get the published version
VERSION=$(npm view @unicornlove/ui@alpha version)
echo "Published version: $VERSION"

# Run migration script
./packages/ui/scripts/migrate-scaffald.sh $VERSION

# Or manually:
# 1. Update packages/core/package.json:
#    "@unicornlove/ui": "^${VERSION}"

# 2. Update pnpm-workspace.yaml:
#    Remove: - packages/ui

# 3. Install and test
pnpm install
pnpm build
pnpm test:all
```

## Step 6: Verify Migration

```bash
cd /Users/clay/Development/SCF-Scaffald

# Check imports work
pnpm --filter @app/core build

# Run app
pnpm dev

# Run tests
pnpm test:all
```

## Step 7: Clean Up (After Verification Period)

After 1-2 weeks of successful usage:

```bash
cd /Users/clay/Development/SCF-Scaffald

# Remove packages/ui directory
git rm -r packages/ui
git commit -m "chore: remove packages/ui - migrated to published @unicornlove/ui package"
```

## Troubleshooting

### npm publish fails with authentication
- Run `npm login` again
- Check you have publish access to `@unicornlove` scope

### Migration fails with import errors
- Verify package is published: `npm view @unicornlove/ui`
- Check version matches: `npm view @unicornlove/ui@alpha version`
- Clear pnpm cache: `pnpm store prune`

### Build fails after migration
- Check peer dependencies are installed
- Verify package.json exports are correct
- Check for any workspace-specific imports

