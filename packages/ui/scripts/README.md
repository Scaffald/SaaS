# Standalone Repository Setup Scripts

Automated scripts for managing the hybrid maintenance setup. All scripts use dynamic path discovery and work from any directory.

## Prerequisites

- GitHub CLI (`gh`) installed and authenticated
- npm account with access to `@unicornlove` scope
- pnpm installed

## Environment Variables

- `UNICORNLOVE_UI_DIR` - Override standalone repo location (default: `../_packages/unicornlove-ui` relative to monorepo)
- `WORKSPACE_DIR` - Override workspace directory for setup-standalone-repo.sh

## Quick Start

### 1. Create Repository and Copy Files

```bash
# From monorepo root
./packages/ui/scripts/setup-standalone-repo.sh
```

This script will:
- Create GitHub repository `Unicorn/unicornlove-ui`
- Clone it to default location (or use `WORKSPACE_DIR` env var)
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
# From monorepo root
./packages/ui/scripts/setup-branch-protection.sh
```

This will:
- Require status checks (test, lint)
- Require 1 PR approval
- Enforce admins

### 4. Publish Alpha Version

Use the script (discovers path automatically):

```bash
./packages/ui/scripts/publish-alpha.sh
```

Or manually:
```bash
# Navigate to standalone repo
cd ../_packages/unicornlove-ui  # or your custom location
npm publish --tag alpha --access public
```

### 5. Sync and Publish Workflow

Complete workflow for syncing and publishing:

```bash
# From monorepo root
./packages/ui/scripts/sync-and-publish.sh
```

Or just sync:
```bash
./packages/ui/scripts/sync-to-standalone.sh
```

### 6. Local Development Setup

Switch between development modes:

```bash
./packages/ui/scripts/setup-local-dev.sh [link|npm|workspace]
```

See `DEVELOPER_SETUP.md` for details.

## Script Details

### setup-standalone-repo.sh

Creates the GitHub repository and sets up the local clone with all files.

**What it does:**
1. Creates public GitHub repository via `gh repo create`
2. Discovers paths dynamically (no hardcoded paths)
3. Clones repository to default location
4. Copies all files from `packages/ui`
5. Removes monorepo-specific files (dist, node_modules, .turbo)
6. Creates initial commit
7. Pushes to GitHub
8. Verifies setup (install, build, test, type check)

### sync-to-standalone.sh

Syncs changes from monorepo to standalone repository.

**Features:**
- Dynamic path discovery
- Automatic backup branch creation
- Catalog reference replacement
- Interactive commits

### sync-and-publish.sh

Complete workflow: sync, build, test, publish, and link.

**What it does:**
1. Syncs files from monorepo
2. Builds and tests
3. Commits changes
4. Optionally publishes to npm
5. Optionally pushes to GitHub
6. Optionally sets up pnpm link

### publish-alpha.sh

Publishes the package to npm with the `alpha` tag.

**Features:**
- Dynamic path discovery
- Build and test verification
- Semantic-release dry run
- Interactive confirmation

### setup-local-dev.sh

Switches between development modes (npm, link, workspace).

**Modes:**
- `npm` - Use published npm package (default)
- `link` - Use pnpm link (most portable)
- `workspace` - Use file: reference (fastest iteration)

### setup-branch-protection.sh

Configures branch protection rules for the main branch.

**What it does:**
- Requires status checks: `test`, `lint`
- Requires 1 PR approval
- Enforces admins (even admins must follow rules)

## Troubleshooting

### Repository Already Exists

If the repository already exists, the script will skip creation. To start fresh:
```bash
gh repo delete Unicorn/unicornlove-ui --yes
./packages/ui/scripts/setup-standalone-repo.sh
```

### Path Not Found

Set the `UNICORNLOVE_UI_DIR` environment variable:
```bash
export UNICORNLOVE_UI_DIR=/path/to/unicornlove-ui
./packages/ui/scripts/publish-alpha.sh
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

2. **Clone and Copy Files:**
   ```bash
   git clone git@github.com:Unicorn/unicornlove-ui.git ../_packages/unicornlove-ui
   cd ../_packages/unicornlove-ui
   # Then use sync-to-standalone.sh to copy files
   ```

3. **Set Secret:**
   ```bash
   gh secret set NPM_TOKEN --repo Unicorn/unicornlove-ui
   ```

4. **Publish:**
   ```bash
   # Use publish-alpha.sh script or manually:
   npm publish --tag alpha --access public
   ```

## Path Discovery

All scripts automatically discover paths:
- Monorepo root: Discovered from script location
- Standalone repo: Tries `../_packages/unicornlove-ui` first, then `../unicornlove-ui`
- Override: Set `UNICORNLOVE_UI_DIR` environment variable

No hardcoded paths - works on any developer machine!
