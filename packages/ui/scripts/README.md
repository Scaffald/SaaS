# Standalone Repository Setup Scripts

Automated scripts to complete the remaining manual tasks for REQ-311.

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- npm account with access to `@unicornlove` scope
- pnpm installed

## Quick Start

### 1. Create Repository and Copy Files

```bash
cd /Users/clay/Development/SCF-Scaffald
./packages/ui/scripts/setup-standalone-repo.sh
```

This script will:
- Create GitHub repository `Unicorn/unicornlove-ui`
- Clone it to `/Users/clay/Development/unicornlove-ui`
- Copy all files from `packages/ui`
- Create initial commit
- Push to GitHub
- Verify setup (install, build, test, type check)

### 2. Set Up GitHub Secrets

```bash
# Generate NPM token at: https://www.npmjs.com/settings/unicornlove/tokens
# Then set it as a secret:
gh secret set NPM_TOKEN --repo Unicorn/unicornlove-ui
```

When prompted, paste your NPM automation token.

### 3. Configure Branch Protection (Optional)

```bash
cd /Users/clay/Development/SCF-Scaffald
./packages/ui/scripts/setup-branch-protection.sh
```

This will:
- Require status checks (test, lint)
- Require 1 PR approval
- Enforce admins

### 4. Publish Alpha Version

```bash
cd /Users/clay/Development/unicornlove-ui
../SCF-Scaffald/packages/ui/scripts/publish-alpha.sh
```

Or manually:
```bash
cd /Users/clay/Development/unicornlove-ui
npm publish --tag alpha --access public
```

### 5. Test Installation

```bash
# In a test project
pnpm add @unicornlove/ui@alpha
```

### 6. Migrate SCF-Scaffald

After verifying the published package works:

```bash
cd /Users/clay/Development/SCF-Scaffald
./packages/ui/scripts/migrate-scaffald.sh <version>
```

Or manually update:
- `packages/core/package.json`: Change `"@unicornlove/ui": "workspace:*"` to `"@unicornlove/ui": "^<version>"`
- `pnpm-workspace.yaml`: Remove `- packages/ui`
- Run `pnpm install && pnpm build && pnpm test:all`
- If successful: `git rm -r packages/ui && git commit -m "chore: migrate to published @unicornlove/ui package"`

## Script Details

### setup-standalone-repo.sh

Creates the GitHub repository and sets up the local clone with all files.

**What it does:**
1. Creates public GitHub repository via `gh repo create`
2. Clones repository to workspace
3. Copies all files from `packages/ui`
4. Removes monorepo-specific files (dist, node_modules, .turbo)
5. Creates initial commit
6. Pushes to GitHub
7. Verifies setup (install, build, test, type check)

### setup-branch-protection.sh

Configures branch protection rules for the main branch.

**What it does:**
- Requires status checks: `test`, `lint`
- Requires 1 PR approval
- Enforces admins (even admins must follow rules)

### publish-alpha.sh

Publishes the package to npm with the `alpha` tag.

**What it does:**
1. Verifies repository exists
2. Checks npm login status
3. Builds package
4. Runs tests
5. Runs semantic-release dry run
6. Prompts for confirmation
7. Publishes to npm with `alpha` tag

## Troubleshooting

### Repository Already Exists

If the repository already exists, the script will skip creation. To start fresh:
```bash
gh repo delete Unicorn/unicornlove-ui --yes
./packages/ui/scripts/setup-standalone-repo.sh
```

### npm Not Logged In

```bash
npm login
# Enter your npm credentials
```

### GitHub CLI Not Authenticated

```bash
gh auth login
```

### Permission Denied

Make sure scripts are executable:
```bash
chmod +x packages/ui/scripts/*.sh
```

## Manual Steps (If Scripts Fail)

If any script fails, you can complete the steps manually:

1. **Create Repository:**
   ```bash
   gh repo create Unicorn/unicornlove-ui --public --description "Comprehensive UI component library for Tamagui and Expo"
   ```

2. **Copy Files:**
   ```bash
   git clone git@github.com:Unicorn/unicornlove-ui.git
   cd unicornlove-ui
   cp -r /Users/clay/Development/SCF-Scaffald/packages/ui/* .
   cp -r /Users/clay/Development/SCF-Scaffald/packages/ui/.storybook .
   cp -r /Users/clay/Development/SCF-Scaffald/packages/ui/.github .
   git add .
   git commit -m "chore: initial commit"
   git push
   ```

3. **Set Secret:**
   ```bash
   gh secret set NPM_TOKEN --repo Unicorn/unicornlove-ui
   ```

4. **Publish:**
   ```bash
   cd unicornlove-ui
   npm publish --tag alpha --access public
   ```

