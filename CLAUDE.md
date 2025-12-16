# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Application Overview

**Scaffald** is a comprehensive job matching and career intelligence platform connecting construction and trades workers with employers. Built as a cross-platform application (iOS, Android, Web) with advanced features for career discovery, profile management, and applicant tracking.

### Core Purpose
- **Workers**: Discover jobs, build career profiles, get career guidance based on O*NET occupational data
- **Employers**: Post jobs, manage applications through ATS features, find qualified candidates
- **Career Intelligence**: Leverage O*NET 30.0 database (1,016+ occupations) for science-backed career guidance

### Key Features
- ✅ **Profile Management**: Comprehensive worker profiles (employment, education, skills, certifications, experience)
- ✅ **Job Discovery**: Search jobs, workers, employers, and map-based discovery
- ✅ **Office Admin**: Super admin interface for managing organizations, users, jobs, universities
- ✅ **ATS (Applicant Tracking System)**: Pipeline management, application tracking (76% complete)
- ✅ **O*NET Integration**: Career assessment, skill recommendations, occupation matching (planned)
- ✅ **Multi-Taxonomy Skills**: CSI MasterFormat for construction skills, O*NET taxonomy
- ✅ **Profile Completion System**: Dashboard widget tracking completion across profile sections

## Tech Stack

### Frontend
- **React Native** (Expo SDK 52) - Primary mobile/web framework
- **Tamagui** - Cross-platform UI components and styling
- **Bento** - Complex UI patterns and components
- **Expo Router** - File-based routing for native apps
- **React Query** - Data fetching and caching

### Backend
- **Supabase** - PostgreSQL database, authentication, Edge Functions, storage
- **tRPC** - End-to-end type-safe API layer
- **PostGIS** - Geographic data support
- **Zod** - Schema validation

### Development Tools
- **pnpm** (v10.17.1) - Package manager with workspaces
- **Nx** - Monorepo build system and task orchestration
- **Biome** - Code formatting and linting
- **TypeScript** - Type safety
- **Playwright** - E2E testing

## Project Structure

```
UNI-Construct/
├── apps/
│   ├── scaffald/              # Expo app (iOS, Android, Web) - port 8081
│   └── forsured-web/          # Vite web app for Forsured - port 5173
├── packages/
│   ├── scf-core/              # @scf/core - Shared business logic and features
│   │   └── features/          # Route-based feature organization
│   ├── ui/                    # @unicornlove/ui - Cross-platform UI components
│   ├── scf-supabase/          # @scf/supabase - Database, migrations, Edge Functions
│   │   └── migrations/        # 001-137 (Scaffald) + 200-232 (Forsured)
│   ├── forsured/              # @unicornlove/forsured - Zod schemas
│   ├── insurance/             # @unicornlove/insurance - Insurance domain
│   ├── compliance/            # @unicornlove/compliance - Compliance domain
│   └── tasks/                 # @unicornlove/tasks - Task management
├── .cursor/rules/             # Cursor AI development rules
│   ├── code-quality.mdc       # CI/CD quality standards
│   ├── project-guardrails.mdc # Essential project practices
│   ├── supabase.mdc           # Supabase development
│   ├── react-native.mdc       # React Native/Expo
│   ├── ui-development.mdc     # UI component standards
│   ├── typescript-typing.mdc  # TypeScript standards
│   ├── trpc-supabase-patterns.mdc # tRPC and RLS patterns
│   └── memory/                # Project knowledge base
├── tests/
│   └── playwright-helpers/    # E2E test utilities
└── docs/                      # Project documentation
```

## Development Commands

### Core Development (Primary Workflow)
```bash
# Start development environment - Scaffald (Expo)
pnpm dev              # Start Expo dev server (port 8081)
pnpm web              # Start Expo Web dev server (port 8081)
pnpm ios              # Build and run iOS app
pnpm android          # Build and run Android app

# Start development environment - Forsured (Vite)
pnpm dev:forsured     # Start Forsured Vite dev server (port 5173)
pnpm build:forsured   # Build Forsured for production
pnpm test:forsured    # Run Forsured tests (2401+ tests)
pnpm dev:all          # Run both Scaffald + Forsured concurrently

# Quick iteration (FAST - only affected packages)
pnpm check:affected   # Lint and type check only changed packages
pnpm lint:affected    # Lint only changed packages
pnpm typecheck:affected # Type check only changed packages

# Pre-commit validation (COMPREHENSIVE - REQUIRED before committing)
pnpm check            # Lint and type check all packages (matches CI)
pnpm build            # Build all packages (matches CI)
pnpm format:fix       # Fix formatting issues with Biome
pnpm lint:fix         # Fix linting issues

# Full pre-commit workflow (REQUIRED)
pnpm check && pnpm build && pnpm check-deps
```

### Supabase Operations
```bash
# Local development
pnpm supa start       # Start local Supabase (port 54321)
pnpm supa stop        # Stop Supabase
pnpm supa status      # Check Supabase status

# Database management
pnpm supa db reset    # Reset database with all migrations
pnpm supa migration:new <name>  # Create new migration
pnpm supa migration:up          # Apply pending migrations

# Type generation & tools
pnpm supa:generate    # Generate TypeScript types from local DB
pnpm supa:generate:remote  # Generate types from remote DB
pnpm supa:studio      # Open Supabase Studio (http://127.0.0.1:54323)
pnpm supa:mailpit     # Open Mailpit for emails (http://127.0.0.1:54324)

# Seeding & data
pnpm supa:seed        # Seed test data (users, industries, organizations)
pnpm supa:seed:onet   # Import O*NET database (1,016+ occupations)

# Deployment (environment-specific)
pnpm supa:db:push:preview   # Push migrations to preview environment
pnpm supa:db:push:prod      # Push migrations to production
pnpm supa:config:push       # Push configuration to environments
```

### Testing Commands
```bash
# Unit & API tests
pnpm test             # Run unit tests and API endpoint tests
pnpm test:unit        # Run Vitest unit tests
pnpm test:api         # Run tRPC endpoint tests
pnpm test:core        # Test @app/core package specifically
pnpm test:schemas     # Test Zod schema definitions

# Integration & validation
pnpm test:all         # Full test suite (integration + build)
pnpm test:build       # Verify all packages build
pnpm test:lint        # Lint, type check, and dependency checks
pnpm test:integration # Integration tests (lint + typecheck + tamagui)
pnpm test:tamagui     # Tamagui-specific checks
pnpm test:deps        # Dependency consistency and circular dependency checks

# Development & debugging
pnpm test:watch       # Watch mode for unit tests
pnpm test:vitest:ui   # Vitest UI dashboard
pnpm test:playwright  # Run Playwright E2E tests
pnpm test:deno:types  # Type check Deno Edge Functions

# Code quality in tests
pnpm test:orchestrated  # Orchestrated test runner
pnpm test:health:full   # Health analysis with unit tests
```

### Monorepo Commands (Nx)
```bash
# Affected projects (faster CI - only build changed packages)
pnpm affected:build    # Build only affected packages
pnpm affected:test     # Test only affected packages
pnpm affected:lint     # Lint only affected packages
pnpm affected:typecheck  # Type check only affected packages

# Project exploration
pnpm graph            # Visualize dependency graph (interactive)
pnpm nx:reset         # Clear Nx cache
pnpm check-circular-deps  # Check for circular dependencies

# Package-specific commands (via Nx)
nx run core:test      # Run tests for @app/core
nx run ui:build       # Build @unicornlove/ui package
nx run ui:watch       # Watch UI package for changes
nx run expo-app:start # Start Expo app specifically
```

### Localization & Data
```bash
pnpm locales:validate     # Validate all translations
pnpm locales:coverage     # Check translation coverage across locales
pnpm supa:news:import     # Import external job feeds
pnpm supa:news:feeds      # Seed news feed data
```

### UI & Build Tools
```bash
# Tamagui (UI framework)
pnpm tamagui:check        # Check Tamagui configuration
pnpm tamagui:upgrade      # Upgrade Tamagui to latest
pnpm tamagui:upgrade:canary  # Upgrade to canary versions

# UI package
pnpm ui:check             # Check UI package compilation
pnpm ui:optimize          # Optimize UI components
pnpm --filter @unicornlove/ui watch  # Watch UI package changes
```

### Important Conventions
- **ALWAYS use `pnpm`** - Never use `npm` or `yarn` (monorepo requirement)
- **ALWAYS use workspace commands** - `pnpm supa`, `pnpm --filter <package>`, not global CLI tools
- **ALWAYS run `pnpm check && pnpm build` before committing**
- **Servers assumed running** - Development servers (Expo, Supabase) are assumed already running unless you're explicitly asked to start them
- **Check dependency versions** - Run `pnpm check-deps` to ensure consistency across monorepo

## Monorepo Packages & Organization

### Core Packages
- **`@app/core`** (`packages/core/`): Business logic, features, and application code
  - `features/`: Route-based feature modules (`<feature>/<feature>-<child>-{left|right|screen}.tsx`)
  - `locales/`: Translation files and localization helpers
- **`@unicornlove/ui`** (`packages/ui/`): Cross-platform UI components (Tamagui + Bento)
  - Published to npm and consumed via package (see UI Package Hybrid Maintenance below)
  - Shared across web and mobile platforms
- **`@app/schemas`** (`packages/schemas/`): Zod validation schemas for API/database
- **`@app/supabase`** (`packages/supabase/`): Database, migrations, and Edge Functions
  - `migrations/`: Numbered migrations (001-007+ pattern)
  - `functions/`: Deno Edge Functions and tRPC routers
- **`@app/trpc`** (`packages/trpc/`): tRPC client setup and type exports
- **`expo-app`** (`apps/expo/`): Primary Expo app (iOS, Android, Web)

### Package Installation Patterns
```bash
# Install in specific package
cd packages/core && pnpm add package-name

# Install in Expo app (native dependencies)
cd apps/expo && pnpm add react-native-reanimated

# Use workspace filter for commands
pnpm --filter @app/core test
pnpm --filter @unicornlove/ui watch
```

## Code Quality Standards

### Pre-Commit Workflow (MANDATORY)
**REQUIRED**: Always run these checks before committing:
```bash
pnpm check              # Format, lint, type check (matches CI)
pnpm build              # Build verification (matches CI)
pnpm check-deps         # Dependency consistency
```

### Post-Implementation Quality Check (MANDATORY)

**During Development (Fast Iteration):**
```bash
pnpm check:affected     # Lint and type check only changed packages
# Review and fix any issues in affected packages
```

**Before Committing (Comprehensive):**
```bash
pnpm lint:fix           # Auto-fix linting issues across all packages
pnpm check              # Verify all packages pass lint and type checks
pnpm build              # Verify all packages build successfully
# Review any remaining warnings/errors and fix manually
```

**Critical Rules:**
- **NEVER use ignore comments** - `@ts-ignore`, `@ts-expect-error`, `// biome-ignore` are prohibited
  - These mask problems, not solve them
  - Always fix the root cause instead
- **All errors must be resolved** before work is considered complete
- **All warnings should be reviewed** - some indicate real problems
- **Hook rules are non-negotiable**:
  - Hooks MUST be called unconditionally at component top level
  - Never call hooks inside conditionals, loops, or try-catch
  - Always maintain same hook call order across renders

### Linting Status by Package

| Package | Status | Details |
|---------|--------|---------|
| **@app/core** | ✅ 100% CLEAN | All business logic fully linted and passing |
| **@unicornlove/ui** | ✅ 99% CLEAN | 4 non-critical warnings in complex gesture code |
| **@app/schemas** | ✅ CLEAN | All Zod definitions validated |
| **@app/supabase** | ⚠️ 174 errors | Third-party types (Stripe) and generated code - acceptable |

### Linting Best Practices

**Before Committing:**
1. Run `pnpm lint:fix` to auto-fix formatting and common issues
2. Review remaining errors - there should be none in business logic
3. Fix any `any` types by providing proper TypeScript types
4. Remove unused variables (don't prefix with underscore unless intentional)
5. Verify hook calls are at top level (unconditional)
6. Check dependency arrays are complete

**Type Safety Standards:**
- ❌ Never write: `variable as any`
- ✅ Always write: `variable as ProperType` or better, type it properly from the start
- ❌ Never write: `function param: any`
- ✅ Always write: `function param: unknown` or specific type
- **Exception**: Third-party library integrations where you can't change types

**Hook Patterns (React):**
```typescript
// ✅ CORRECT - hooks at top level
export function MyComponent() {
  const [state, setState] = useState(0)
  const value = useMemo(() => expensiveComputation(), [])

  useEffect(() => {
    // do something
  }, [state])

  return <div>{state}</div>
}

// ❌ WRONG - conditional hook
export function BadComponent({ condition }: { condition: boolean }) {
  if (condition) {
    const [state, setState] = useState(0)  // WRONG!
  }
  return <div>...</div>
}

// ❌ WRONG - hook after early return
export function BadComponent2({ data }: { data?: any[] }) {
  if (!data || data.length === 0) {
    return null  // ERROR: useMemo below is after return!
  }

  const computed = useMemo(() => data.map(x => x.id), [data])
  return <div>{computed}</div>
}
```

**Linting Commands:**
```bash
# Fast iteration (affected packages only)
pnpm check:affected         # Lint and type check changed packages
pnpm lint:affected          # Lint changed packages only
pnpm typecheck:affected     # Type check changed packages only

# Comprehensive checks (all packages)
pnpm lint:fix               # Check and fix formatting/linting automatically
pnpm lint                   # Check linting status (read-only)
pnpm typecheck              # Type check all packages

# Custom rules
pnpm lint:routes            # Check hardcoded routes (custom rule)
pnpm lint:sort-package-json # Sort package.json keys

# Full pre-commit validation (REQUIRED)
pnpm check && pnpm build && pnpm check-deps
```

### TypeScript Standards
- **NEVER use `any` type** - Use `unknown` or proper typing
- **Always define explicit types** for functions and components
- **Use proper interfaces** for complex objects
- **Validate external data** with type guards and Zod schemas
- **Import React functions directly** - Never use global React imports:
  ```typescript
  // ✅ GOOD
  import { useState, Fragment } from 'react';
  import type { FC, ReactNode } from 'react';

  // ❌ BAD
  import React from 'react';
  const Component = () => <React.Fragment>...</React.Fragment>;
  ```

### Code Organization
- **Feature-based**: Routes organized in `packages/core/features/<feature>/`
- **Route naming**: `<parent>-<child>-{left|right|screen}.tsx` pattern
  - Use `pnpm gen route` to auto-generate properly structured route files
- **No barrel files**: Direct imports to optimize build performance
- **Cross-platform**: UI components in `packages/ui/` work on web and mobile
- **Avoid circular dependencies**: Run `pnpm check-circular-deps` to verify

## BrainGrid Integration (CRITICAL)

### Mandatory Task Status Updates

**⚠️ NON-NEGOTIABLE REQUIREMENT**: When working on BrainGrid requirements and tasks, you MUST update statuses immediately upon completion using the BrainGrid MCP tools. This is not optional.

### Required Workflow

1. **Starting a Task**:
   - Mark task status as `IN_PROGRESS` using `mcp__braingrid__update_project_task`
   - Update task description with current status if needed

2. **Completing a Task**:
   - **IMMEDIATELY** mark task status as `COMPLETED` using `mcp__braingrid__update_project_task`
   - Update requirement status if all tasks are complete using `mcp__braingrid__update_project_requirement`
   - Do NOT commit code without updating BrainGrid statuses first

3. **Blocking/Cancelled Tasks**:
   - Mark task as `CANCELLED` with clear reason in description
   - Create new REQ for blocking issues if needed
   - Add blocking relationships using task dependencies

### BrainGrid MCP Tools

Always provide `project_id` (auto-detected from `.braingrid/project.json`):

```bash
# Read project config
cat .braingrid/project.json

# Update task status
mcp__braingrid__update_project_task({
  project_id: "...",
  requirement_id: "REQ-XXX",
  task_id: "...",
  status: "COMPLETED"
})

# Update requirement status
mcp__braingrid__update_project_requirement({
  project_id: "...",
  requirement_id: "REQ-XXX",
  status: "COMPLETED"
})

# Create new requirement for blockers
mcp__braingrid__create_project_requirement({
  project_id: "...",
  prompt: "Detailed description of issue found..."
})
```

### Why This Matters

- **Project visibility**: Team needs real-time status updates
- **Blocking dependencies**: Other tasks may depend on completion status
- **Effort tracking**: Accurate time estimates require completion data
- **Developer handoff**: Next developer needs to know what's done
- **Sprint planning**: Project managers rely on accurate status

**REMEMBER**: Task status updates are of paramount importance. Update BrainGrid BEFORE committing code or marking work complete.

## Cursor Rules Integration

This project uses comprehensive Cursor rules located in `.cursor/rules/`. These rules are auto-applied based on file type and should be your primary reference during development.

### Always-Applied Rules
- **`project-guardrails.mdc`** - Package manager (`pnpm`), server management, git workflow
  - Assume servers are running; don't start unless asked
  - NEVER use global `supabase` CLI; use `pnpm supa` instead
  - Check git history when debugging issues
  - Post-implementation linting is MANDATORY
- **`workspace-commands.mdc`** - Complete command reference for all operations
- **`testing-logging.mdc`** - Test reporter behavior and debugging hanging tests
  - Use `TEST_LOG_VERBOSE=1` to see detailed logs when debugging
  - Use `// @testlog verbose` pragma for per-file verbose logging
- **`react-imports-code-quality.mdc`** - React import patterns and ignore comment prohibition
  - Never use `import React` or `@ts-ignore` comments
  - Always prefer named imports; fix the root cause of errors

### File-Type Specific Rules
- **`supabase.mdc`** (SQL files, supabase/): Database schema, migrations, policies
  - NEVER reset database - use migrations only
  - Schema organization: `core` for app, `data`/`cms`/`onet` for reference
  - Migration structure and patterns (001-007 core, 008+ new features)
- **`react-native.mdc`** (expo/, React Native files): Expo/React Native development
- **`ui-development.mdc`** (packages/ui/): Tamagui components, cross-platform patterns
- **`ui-package-hybrid.mdc`** (packages/ui/): CRITICAL - hybrid npm/workspace maintenance
  - UI package is published to npm but developed locally
  - Sync changes via `./packages/ui/scripts/sync-to-standalone.sh`
  - See detailed docs in this rule
- **`route-naming-convention.mdc`** (packages/core/features/): Dashboard route structure
  - Pattern: `<parent>-<child>-{left|right|screen}.tsx`
  - Use `pnpm gen route` to auto-generate
- **`avoid-barrel-files.mdc`**: Performance optimization via direct imports
- **`trpc-supabase-patterns.mdc`**: tRPC endpoints, RLS policies, security patterns

### Git & Development Workflow Rules
- **`git-safety.mdc`** - Prevents accidental destructive operations
  - No force pushes to main
  - No git checkout/revert without safety checks
- **`browser-server-management.mdc`** - Browser/server testing protocol
  - Always ask before starting web servers
  - Offer manual vs. agent testing options
- **`no-long-running-watchers.mdc`** - Prevents resource-heavy background processes
- **`no-git-checkout-revert.mdc`** - Prevents destructive git operations

### Memory Bank (`.cursor/rules/memory/`)
- **`project-overview.md`**: Complete project structure and tech stack
- **`architecture-decisions.md`**: Key architectural choices and rationale
- **`common-patterns.md`**: Established code patterns and conventions
- **`troubleshooting-guide.md`**: Common issues and solutions
- **`development-workflows.md`**: Team workflows and processes

### Key Rule Takeaways for Daily Development
1. **Code Quality**: Run `pnpm lint:fix` after ALL code changes; fix errors, don't suppress
2. **Supabase**: Use migrations (never reset); respect schema organization (core/data/cms/onet)
3. **tRPC**: Always validate with Zod; implement proper RLS checks
4. **React**: Named imports only; no React.Fragment, no `any` types
5. **UI Components**: Use Tamagui primitives; make cross-platform; document with JSDoc
6. **Routes**: Use naming convention; use generator; keep files under 300 lines
7. **Monorepo**: Use workspace commands; avoid circular dependencies; use `affected:*` for CI
8. **Testing**: Watch for hanging tests; use verbose flag when debugging
9. **Git**: Always check history before modifying; use feature branches; conventional commits
10. **Servers**: Assume running; don't start unless asked; use `pnpm` commands, not direct CLIs

## Database & Supabase Development

### Key Data
- **O*NET 30.0**: 1,016+ occupations with skills, abilities, knowledge
- **CSI MasterFormat**: 8,955 construction skills taxonomy
- **Universities**: 10,191 universities from 202 countries
- **Industries**: Construction, Manufacturing, Transportation, Energy

### Schema Organization (CRITICAL)
- **`core.*`**: Platform/shared tables (users, organizations, role_assignments)
  - Used by BOTH Scaffald and Forsured applications
  - User profiles, jobs, organizations, applications, etc.
  - Private/PII data: `core.profile`, `core.preferences`, `core.applications`
  - NO `private_` prefix - RLS handles privacy
- **`forsured.*`**: Forsured insurance compliance tables (migrations 200-232)
  - Insurance policies, compliance issues, documents, tasks
  - Projects, companies, coverage requirements
  - References `core.*` for users and organizations
- **`data.*`**: Reference data (universities, MasterFormat, certifications) - READ-ONLY
- **`cms.*`**: CMS content (welcome_slides, etc.) - READ-ONLY
- **`onet.*`**: O*NET occupational reference data - READ-ONLY

### Forsured Database Client
```typescript
// Import from @scf/supabase/forsured-client
import { forsured, core } from '@scf/supabase/forsured-client';

// Query Forsured-specific data (insurance, compliance, etc.)
const policies = await forsured('insurance_policies').select('*').eq('status', 'active');
const tasks = await forsured('tasks').select('*').eq('project_id', projectId);

// Query core/platform data (users, organizations)
const users = await core('users').select('*').eq('organization_id', orgId);
const org = await core('organizations').select('*').eq('id', orgId).single();
```

### Schema Highlights
- **User profiles**: Comprehensive worker profiles with private/public separation
- **Jobs**: Job postings with skills, location (PostGIS), compensation
- **Applications**: ATS pipeline with status tracking
- **Organizations**: Multi-tenant organization management with RLS
- **Skills**: Multi-taxonomy skills system (O*NET, CSI MasterFormat)

### Rich Text Handling
- **Column naming**: Use `description` or `about` (NOT `*_rich` suffix)
- **NO plain text fallbacks**: Don't add `*_plain` columns
- **For search**: Use function-based extraction: `extract_tiptap_plain_text()` function
- Example search query:
  ```sql
  SELECT * FROM core.jobs
  WHERE to_tsvector('english', core.extract_tiptap_plain_text(description)) @@ plainto_tsquery('engineer');
  ```

### Migration Best Practices
**Migrations NEVER reset the database** - all changes must follow migration pattern:
```bash
pnpm supa migration:new feature_name   # Create numbered migration (008_feature_name.sql)
pnpm supa migration:up                 # Apply migrations
```

**Migration structure** (001-007 are core, new migrations start at 008):
1. **001_schema.sql**: Pure schema (tables, types, enums) - NO foreign keys, policies, or indexes
2. **002_data.sql**: Reference data schemas (universities, masterformat, etc.)
3. **003_relations.sql**: Foreign key relationships
4. **004_functions.sql**: Functions and triggers
5. **005_policies.sql**: RLS policies
6. **006_storage.sql**: Storage buckets and policies
7. **007_indexes.sql**: Performance indexes

### Development Database Setup
```bash
# Complete reset (migrations + seeds)
pnpm supa db reset && pnpm supa:seed

# This includes:
# - 90+ migrations with O*NET database
# - Test users, industries, organizations
# - CSI MasterFormat skills
# - University catalog
```

### Supabase Type Generation
```bash
# After schema changes, regenerate types
pnpm supa:generate    # From local database

# Commit the updated types file
# packages/supabase/types.ts
```

### tRPC Router Integration
When creating tRPC endpoints, use correct schemas:
```typescript
// Use .schema("core") for application tables
await db.schema("core").from("jobs").select("*");

// Use .schema("data") for reference data (read-only)
const universities = await db.schema("data").from("universities").select("*");

// Use .schema("cms") for CMS tables
const slides = await db.schema("cms").from("welcome_slides").select("*");
```

## Testing

### Playwright E2E Tests
```bash
# Run all tests
pnpm exec playwright test

# Run specific test
pnpm exec playwright test tests/test-r001-auth.spec.ts

# Run with UI
pnpm exec playwright test --ui
```

### Test Structure
- **Helpers**: `tests/playwright-helpers/` - Auth, profile, fixtures
- **Specs**: `tests/test-r*.spec.ts` - Route-based test files
- **Config**: `tests/playwright.config.ts` - Base URL: `http://localhost:8082`

### Test Users
- **Regular**: `lexis.salah@eths.education.com`
- **Admin**: `ewongagent@gmail.com`
- **Super Admin**: `zach@unicorn.love`

### Testing Policy

**If we own it or write it, we test it directly - we do NOT mock it in tests.**

- Do NOT mock the database or the internal API
- Use a real database instance and real HTTP calls
- Mocks are only allowed for external third-party services
- Tables, code, configuration, and definitions that we own and that affect the code we own inside of 3rd party systems should be tested because we own it

## UI Package Hybrid Maintenance (CRITICAL)

**The `@unicornlove/ui` package uses a special hybrid maintenance approach:**

### How It Works
- **`packages/ui/`** in the monorepo: Primary development location (source of truth)
- **Consumption**: Monorepo consumes `@unicornlove/ui@^1.0.1` from npm
- **Workflow**: Edit locally → Sync to standalone → Publish → Consume via npm
- **Modes**: Can run as npm package (default), linked workspace, or local dev

### Development Workflow
1. **Make changes** to `packages/ui/` in monorepo
2. **Sync to standalone** (separate repo):
   ```bash
   ./packages/ui/scripts/sync-to-standalone.sh
   ```
3. **Publish** to npm from standalone repo
4. **Update version** in monorepo's root package.json

### Important Guidelines
- **NEVER suggest deleting `packages/ui/`** - it's essential for development
- **Reference**: `.cursor/rules/ui-package-hybrid.mdc` for complete details
- **Components**: Use Tamagui vanilla primitives and Bento for complex patterns
- **Cross-platform**: Ensure all components work on web, iOS, and Android

## Common Development Patterns

### Creating New Dashboard Route
```bash
# Use the built-in generator (creates all necessary files)
pnpm gen route

# Generates files following naming convention:
# packages/core/features/<parent>/<parent>-<child>-left.tsx
# packages/core/features/<parent>/<parent>-<child>-right.tsx
# packages/core/features/<parent>/<parent>-<child>-screen.tsx
```

### Adding tRPC Endpoint
1. **Create router** in `packages/supabase/functions/trpc/routers/<feature>.ts`
2. **Add to main router** in `packages/supabase/functions/trpc/root.ts`
3. **Use procedures**:
   ```typescript
   export const featureRouter = createTRPCRouter({
     listItems: protectedProcedure
       .input(z.object({ organizationId: z.string() }))
       .query(async ({ input, ctx }) => {
         // Check RLS: user must belong to organization
         return await db
           .schema("core")
           .from("items")
           .select("*")
           .eq("organization_id", input.organizationId);
       }),
   });
   ```
4. **Implement RLS checks** in database policies
5. **Add Zod validation** schemas for inputs

### Creating UI Component
1. **Location**: `packages/ui/src/components/`
2. **Framework**: Use Tamagui primitives (`Button`, `Text`, `View`, `Stack`)
3. **Complex patterns**: Use Bento components for complex UI patterns
4. **Cross-platform**: Test on web, iOS, and Android
5. **Export**: Add to appropriate index file (`index.ts`, `index.web.ts`, etc.)
6. **Document**: Add JSDoc comments with prop descriptions
   ```typescript
   /**
    * Button component - cross-platform compatible
    * @param props - Standard button props
    * @example
    * <Button onPress={() => alert('Pressed!')}>Click me</Button>
    */
   export function Button({ children, ...props }: ButtonProps) {
     return <Tamagui.Button {...props}>{children}</Tamagui.Button>;
   }
   ```

## Environment Setup

### Required Services
- **Supabase**: `pnpm supa start` (runs in Docker)
- **Web Server**: `pnpm web` (port 3000) or Expo dev server (port 8081)
- **Docker Desktop**: Required for local Supabase

### Environment Variables
- Copy `.env.example` to `.env`
- Required: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- See `.env.example` for full list

### Ports
- **Expo Dev**: 8081
- **Web Dev**: 8081 (Expo Web)
- **Supabase**: 54321 (API), 54323 (Studio), 54324 (Mailpit)

## Git Workflow

### Branch Strategy
- **Feature branches** for all new development
- **Conventional commits**: `feat(scope): description`, `fix(scope): description`
- **Don't commit to main** - create feature branches

### Before Committing
```bash
# Run these commands (matches CI)
pnpm check              # Format, lint, type check
pnpm build              # Verify all packages build
pnpm check-deps         # Dependency version consistency
```

## Documentation

### Key Documentation Files
- **`README.md`**: Setup, development, deployment
- **`docs/features/`**: Feature documentation
- **`docs/office/`**: Admin interface documentation
- **`tests/README.md`**: Playwright testing guide
- **`.cursor/rules/`**: Development rules and patterns

## Troubleshooting

### Common Issues & Solutions
| Issue | Solution |
|-------|----------|
| Port conflicts | Check `~/projects/ports.json` for port management |
| Docker not running | Supabase requires Docker Desktop running |
| Type errors after schema change | Run `pnpm supa:generate` to update types |
| Build failures | Run `pnpm reset` to clear all caches and reinstall |
| Xcode can't find Node | Check `.xcode.env` NODE_BINARY path (use `which node`) |
| iOS simulator fails to connect | Use `pnpm web -H $(pnpm get-local-ip-mac \| head -n 1)` for local IP |
| Test hangs indefinitely | Check `.cursor/rules/testing-logging.mdc`; use `TEST_LOG_VERBOSE=1` |
| Circular dependency warnings | Run `pnpm check-circular-deps` to visualize and fix |
| Linting/type errors after changes | Always run `pnpm lint:fix` immediately after coding |
| Supabase migrations fail | Ensure migrations are idempotent (use `IF NOT EXISTS`, transactions) |

### Getting Help
- **Check first**: `.cursor/rules/memory/troubleshooting-guide.md` for detailed solutions
- **Review history**: `git log --oneline -20` to understand recent changes
- **Check logs**: `pnpm supa logs` for Supabase issues
- **Test isolation**: Run failing test directly: `pnpm vitest run path/to/test.ts`
- **CI/CD**: Review GitHub Actions logs for environment-specific issues

## Quick Reference: Essential Pre-Commit Checklist

```bash
# 1. Run quality checks (REQUIRED)
pnpm lint:fix              # Fix auto-fixable linting issues
pnpm check                 # Lint, type check, format check
pnpm build                 # Verify all packages build
pnpm check-deps            # Ensure dependency consistency

# 2. Run targeted tests
pnpm test:unit             # Run unit tests
pnpm test:api              # Run API endpoint tests
pnpm test:build            # Verify full build

# 3. Verify database changes (if applicable)
pnpm supa:generate         # Update types after schema changes
pnpm supa migration:up     # Apply pending migrations

# 4. Commit with conventional message
git add .
git commit -m "feat(scope): description"
git push
```

## References & Documentation

- **Cursor Rules**: `.cursor/rules/` directory (auto-applied based on file type)
- **Memory Bank**: `.cursor/rules/memory/` for architecture and workflows
- **Anthropic Best Practices**: https://www.anthropic.com/engineering/claude-code-best-practices
- **Project Documentation**: `docs/` directory
- **Supabase Guide**: `packages/supabase/README.md`
- **Playwright Tests**: `tests/README.md`
- **README**: Full setup and deployment documentation

## Key Workspace Packages Quick Reference

```
packages/
├── core/              @app/core - Features, business logic, routes
├── ui/                @unicornlove/ui - Tamagui components (hybrid npm/workspace)
├── schemas/           @app/schemas - Zod validation schemas
├── supabase/          @app/supabase - Database, migrations, tRPC functions
├── trpc/              @app/trpc - tRPC client and exports
└── fonts/             Font and icon management

apps/
└── expo/              expo-app - Expo app (iOS, Android, Web)

Development Commands by Package:
- pnpm --filter @app/core test
- pnpm --filter @unicornlove/ui watch
- pnpm --filter @app/supabase test:endpoints
- pnpm --filter expo-app ios
```

