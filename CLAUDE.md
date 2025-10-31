# SCF-Neue (Scaffald) - Claude Code Context

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
- **Turbo** - Monorepo build system
- **Biome** - Code formatting and linting
- **TypeScript** - Type safety
- **Playwright** - E2E testing

## Project Structure

```
SCF-Neue/
├── apps/
│   ├── expo/              # React Native app (primary)
│   └── next/              # Next.js web (legacy, migrating to Expo Web)
├── packages/
│   ├── core/              # Shared business logic and features
│   │   └── features/      # Route-based feature organization
│   ├── ui/                # Cross-platform UI components
│   ├── supabase/          # Database, migrations, Edge Functions
│   └── fonts/             # Font and icon management
├── .cursor/rules/         # Cursor AI development rules
│   ├── code-quality.mdc           # CI/CD quality standards
│   ├── project-guardrails.mdc     # Essential project practices
│   ├── supabase.mdc              # Supabase development
│   ├── react-native.mdc           # React Native/Expo
│   ├── ui-development.mdc         # UI component standards
│   ├── typescript-typing.mdc      # TypeScript standards
│   ├── trpc-supabase-patterns.mdc # tRPC and RLS patterns
│   └── memory/                    # Project knowledge base
├── tests/
│   └── playwright-helpers/ # E2E test utilities
└── docs/                   # Project documentation
```

## Development Commands

### Primary Workflow
```bash
# Development servers
pnpm dev              # Start Expo dev server (port 8081)
pnpm web              # Start web dev server (port 3000)
pnpm ios              # Run iOS app
pnpm android          # Run Android app

# Code quality (ALWAYS run before committing)
pnpm check            # Format, lint, type check (matches CI)
pnpm build            # Build verification (matches CI)

# Supabase operations
pnpm supa start       # Start local Supabase (port 54321)
pnpm supa stop        # Stop Supabase
pnpm supa:studio      # Open Supabase Studio (port 54323)
pnpm supa:mailpit     # Open Mailpit for emails (port 54324)
pnpm supa db reset    # Reset database with all migrations
pnpm supa:seed        # Seed test data (users, industries, etc.)
pnpm supa:generate    # Generate TypeScript types from local DB

# Testing
pnpm exec playwright test    # Run Playwright E2E tests
pnpm test:all               # Full test suite (integration + build)
```

### Important Notes
- **ALWAYS use `pnpm`** - Never use `npm` or `yarn`
- **ALWAYS run `pnpm check && pnpm build`** before committing
- **Servers assumed running** - Don't start dev servers unless explicitly requested
- **Use workspace commands** - `pnpm --filter <package> <command>`

## Code Quality Standards

### Pre-Commit Workflow
**IMPORTANT**: Always run `pnpm check && pnpm build` before committing. This matches CI exactly.

### TypeScript Standards
- **NEVER use `any` type** - Use `unknown` or proper typing
- **Always define explicit types** for functions and components
- **Use proper interfaces** for complex objects
- **Validate external data** with type guards and Zod schemas

### Code Organization
- **Feature-based**: Routes organized in `packages/core/features/<feature>/`
- **Route naming**: `<parent>-<child>-{left|right|screen}.tsx` pattern
- **No barrel files**: Direct imports to optimize build performance
- **Cross-platform**: UI components in `packages/ui/` work on web and mobile

## Cursor Rules Reference

This project uses comprehensive Cursor rules located in `.cursor/rules/`. Key rules:

### Always Applied
- **`code-quality.mdc`**: CI/CD aligned quality standards, pre-commit workflow
- **`project-guardrails.mdc`**: Package manager, server management, git context

### Auto-Applied by File Type
- **`supabase.mdc`**: Supabase development commands and patterns
- **`react-native.mdc`**: React Native/Expo development guidelines
- **`ui-development.mdc`**: Tamagui component standards, cross-platform patterns
- **`typescript-typing.mdc`**: TypeScript typing standards, no `any` types
- **`trpc-supabase-patterns.mdc`**: tRPC endpoints, RLS policies, security
- **`route-naming-convention.mdc`**: Dashboard route structure patterns
- **`avoid-barrel-files.mdc`**: Build performance optimization

### Memory Bank (`.cursor/rules/memory/`)
- **`project-overview.md`**: Complete project structure and tech stack
- **`architecture-decisions.md`**: Key architectural choices and rationale
- **`common-patterns.md`**: Established code patterns and conventions
- **`troubleshooting-guide.md`**: Common issues and solutions
- **`development-workflows.md`**: Team workflows and processes

**Reference these rules** when working on related code. They contain detailed guidelines for:
- API development with tRPC and Supabase RLS
- UI component creation with Tamagui
- Route structure and naming conventions
- TypeScript typing best practices
- Supabase migration patterns

## Database Overview

### Key Data
- **O*NET 30.0**: 1,016+ occupations with skills, abilities, knowledge
- **CSI MasterFormat**: 8,955 construction skills taxonomy
- **Universities**: 10,191 universities from 202 countries
- **Industries**: Construction, Manufacturing, Transportation, Energy

### Schema Highlights
- **User profiles**: Comprehensive worker profiles with private/public schema separation
- **Jobs**: Job postings with skills, location (PostGIS), compensation
- **Applications**: ATS pipeline with status tracking
- **Organizations**: Multi-tenant organization management with RLS
- **Skills**: Multi-taxonomy skills system (O*NET, CSI MasterFormat)

### Development Database
```bash
# Complete reset (migrations + seeds)
pnpm supa db reset && pnpm supa:seed

# This includes:
# - 90+ migrations with O*NET database
# - Test users, industries, organizations
# - CSI MasterFormat skills
# - University catalog
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

## Common Patterns

### Creating New Dashboard Route
```bash
# Use the generator (creates all necessary files)
pnpm gen route

# Follows pattern:
# packages/core/features/<parent>/<parent>-<child>-left.tsx
# packages/core/features/<parent>/<parent>-<child>-right.tsx
# packages/core/features/<parent>/<parent>-<child>-screen.tsx
```

### Adding tRPC Endpoint
1. Create router in `packages/supabase/functions/trpc/routers/`
2. Add to main router in `packages/supabase/functions/trpc/root.ts`
3. Use `protectedProcedure` or `publicProcedure`
4. Implement proper RLS checks in database policies
5. Add Zod validation schemas

### Creating UI Component
1. Use Tamagui primitives (`Button`, `Text`, `View`, `Stack`)
2. Create in `packages/ui/src/components/`
3. Make it cross-platform (web, iOS, Android)
4. Export from appropriate index file
5. Document with JSDoc comments

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
- **Web Dev**: 3000 (Next.js) or 8082 (Expo Web)
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

### Common Issues
- **Port conflicts**: Check `~/projects/ports.json` for port management
- **Docker not running**: Supabase requires Docker Desktop
- **Type errors**: Run `pnpm supa:generate` after schema changes
- **Build failures**: Run `pnpm reset` to clear caches

### Getting Help
- Check `.cursor/rules/memory/troubleshooting-guide.md`
- Review recent git history: `git log --oneline -10`
- Check Supabase logs: `pnpm supa logs`
- Review CI/CD logs in GitHub Actions

## References

- **Cursor Rules**: `.cursor/rules/` directory
- **Memory Bank**: `.cursor/rules/memory/` for project knowledge
- **Anthropic Best Practices**: https://www.anthropic.com/engineering/claude-code-best-practices
- **Project Docs**: `docs/` directory
- **Supabase Docs**: See `packages/supabase/README.md`

