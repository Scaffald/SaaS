# Nx Migration Plan - SCF-Scaffald

> **Status**: 🔄 In Progress  
> **Started**: 2025-12-01  
> **Target**: Full migration from Turborepo to Nx with no backwards compatibility

## Overview

This document tracks the complete migration from Turborepo to Nx for the SCF-Scaffald monorepo. The goal is to achieve:
- Better test caching with affected commands
- Fine-grained task orchestration
- Improved CI/CD performance through distributed task execution
- Better project graph visualization

## Project Structure

```
apps/
  └── expo/           # Expo React Native app (expo-app)
packages/
  ├── core/           # @app/core - Core features & components
  ├── schemas/        # @app/schemas - Zod schemas
  ├── supabase/       # @app/supabase - Supabase client & types
  ├── trpc/           # @app/trpc - tRPC configuration
  └── ui/             # @unicornlove/ui - UI components
```

---

## Phase 1: Initial Setup & Dependencies ✅

### 1.1 Install Nx Dependencies
- [x] **TASK-1.1.1**: Install core Nx packages
  ```bash
  pnpm add -Dw nx @nx/workspace @nx/js @nx/vite @nx/react @nx/expo
  ```
- [x] **TASK-1.1.2**: Remove Turbo dependencies
  ```bash
  pnpm remove -w turbo @turbo/gen
  ```
- [x] **TASK-1.1.3**: Update `.gitignore` for Nx cache directories

### 1.2 Initialize Nx Workspace
- [x] **TASK-1.2.1**: Create `nx.json` configuration file
- [x] **TASK-1.2.2**: Configure default settings and caching
- [x] **TASK-1.2.3**: Set up named inputs for optimal caching

---

## Phase 2: Project Configuration ✅

### 2.1 Create project.json for packages/core
- [x] **TASK-2.1.1**: Create `packages/core/project.json`
  - Define project name: `core`
  - Configure `build` target
  - Configure `test` target (Vitest)
  - Configure `lint` target (Biome)
  - Configure `typecheck` target

### 2.2 Create project.json for packages/schemas
- [x] **TASK-2.2.1**: Create `packages/schemas/project.json`
  - Define project name: `schemas`
  - Configure `build` target
  - Configure `test` target
  - Configure `lint` target

### 2.3 Create project.json for packages/supabase
- [x] **TASK-2.3.1**: Create `packages/supabase/project.json`
  - Define project name: `supabase`
  - Configure `build` target
  - Configure `test` target
  - Configure `lint` target
  - Configure `generate` target (type generation)

### 2.4 Create project.json for packages/trpc
- [x] **TASK-2.4.1**: Create `packages/trpc/project.json`
  - Define project name: `trpc`
  - Configure `build` target
  - Configure `lint` target

### 2.5 Create project.json for packages/ui
- [x] **TASK-2.5.1**: Create `packages/ui/project.json`
  - Define project name: `ui`
  - Configure `build` target (tsup)
  - Configure `test` target
  - Configure `lint` target
  - Configure `watch` target

### 2.6 Create project.json for apps/expo
- [x] **TASK-2.6.1**: Create `apps/expo/project.json`
  - Define project name: `expo-app`
  - Configure `start` target
  - Configure `ios` target
  - Configure `android` target
  - Configure `web` target
  - Configure `build` target
  - Configure `test` target
  - Configure `lint` target
  - Configure EAS build targets

---

## Phase 3: Core nx.json Configuration ✅

### 3.1 Define Target Defaults
- [x] **TASK-3.1.1**: Configure `build` target defaults with proper caching
- [x] **TASK-3.1.2**: Configure `test` target defaults with Vitest integration
- [x] **TASK-3.1.3**: Configure `lint` target defaults with Biome
- [x] **TASK-3.1.4**: Configure `typecheck` target defaults

### 3.2 Configure Named Inputs
- [x] **TASK-3.2.1**: Define `default` input (all source files)
- [x] **TASK-3.2.2**: Define `production` input (excluding test files)
- [x] **TASK-3.2.3**: Define `sharedGlobals` for env files

### 3.3 Configure Caching
- [x] **TASK-3.3.1**: Enable task caching for all cacheable operations
- [x] **TASK-3.3.2**: Configure proper output paths for cache artifacts
- [x] **TASK-3.3.3**: Set up task dependencies

---

## Phase 4: Replace turbo.json with nx.json ✅

### 4.1 Remove Turbo Configuration
- [x] **TASK-4.1.1**: Delete `turbo.json`
- [x] **TASK-4.1.2**: Remove `turbo/` directory
- [x] **TASK-4.1.3**: Remove `.turbo` from all locations

### 4.2 Update Workspace Caching
- [x] **TASK-4.2.1**: Remove `.turbo` cache directories from `.gitignore`
- [x] **TASK-4.2.2**: Add `.nx` cache directories to `.gitignore`
- [x] **TASK-4.2.3**: Update `reset` scripts for Nx cache

---

## Phase 5: Update Root package.json Scripts ✅

### 5.1 Replace Turbo Commands
- [x] **TASK-5.1.1**: Replace `turbo build` → `nx run-many -t build`
- [x] **TASK-5.1.2**: Replace `turbo check` → `nx run-many -t lint typecheck`
- [x] **TASK-5.1.3**: Replace `turbo test:unit` → `nx run-many -t test`
- [x] **TASK-5.1.4**: Replace `turbo format` → `nx format:check` / `nx format:write`
- [x] **TASK-5.1.5**: Replace `turbo lint` → `nx run-many -t lint`
- [x] **TASK-5.1.6**: Replace `turbo typecheck` → `nx run-many -t typecheck`
- [x] **TASK-5.1.7**: Replace `turbo watch` → `nx run-many -t watch`

### 5.2 Add Nx-Specific Commands
- [x] **TASK-5.2.1**: Add `nx affected` commands for CI optimization
- [x] **TASK-5.2.2**: Add `nx graph` command for dependency visualization
- [x] **TASK-5.2.3**: Add `nx reset` for cache clearing
- [x] **TASK-5.2.4**: Add `nx show projects` for listing projects

---

## Phase 6: Vitest Integration with Nx

### 6.1 Configure @nx/vite Plugin
- [ ] **TASK-6.1.1**: Update root `vitest.config.ts` for Nx compatibility
- [ ] **TASK-6.1.2**: Configure test targets to use workspace Vitest config
- [ ] **TASK-6.1.3**: Set up proper test caching inputs/outputs

### 6.2 Per-Package Test Configuration
- [ ] **TASK-6.2.1**: Update `packages/core/vitest.config.ts`
- [ ] **TASK-6.2.2**: Update `packages/schemas/vitest.config.ts`
- [ ] **TASK-6.2.3**: Update `packages/ui/vitest.config.ts`
- [ ] **TASK-6.2.4**: Update `apps/expo/vitest.config.ts`

---

## Phase 7: CI/CD Workflow Updates ✅

### 7.1 Update .github/workflows/test.yml
- [x] **TASK-7.1.1**: Add Nx CLI caching with `actions/cache`
- [x] **TASK-7.1.2**: Replace `pnpm typecheck` → `nx affected -t typecheck`
- [x] **TASK-7.1.3**: Replace `pnpm lint` → `nx affected -t lint`
- [x] **TASK-7.1.4**: Replace `pnpm test:unit` → `nx affected -t test`
- [x] **TASK-7.1.5**: Add `--base` and `--head` for affected calculations

### 7.2 Update .github/workflows/integrity.yaml
- [ ] **TASK-7.2.1**: Update integrity checks to use Nx commands
- [ ] **TASK-7.2.2**: Configure Nx Cloud (optional) or local cache restoration

### 7.3 Update .github/workflows/deploy-web.yml
- [ ] **TASK-7.3.1**: Update build commands to use Nx
- [ ] **TASK-7.3.2**: Leverage affected command for conditional deploys

---

## Phase 8: Documentation Updates ✅

### 8.1 Update Cursor Rules
- [x] **TASK-8.1.1**: Update `.cursor/rules/project-guardrails.mdc`
  - Replace all `turbo` references with `nx`
  - Update workspace command references
- [x] **TASK-8.1.2**: Update `.cursor/rules/workspace-commands.mdc`
  - Replace Turbo commands with Nx equivalents
  - Document new Nx-specific commands

### 8.2 Update README Files
- [ ] **TASK-8.2.1**: Update root `README.md` with Nx commands
- [ ] **TASK-8.2.2**: Update development workflow documentation
- [ ] **TASK-8.2.3**: Create `docs/NX-CHEATSHEET.md` for quick reference

### 8.3 Update CLAUDE.md and GEMINI.md
- [ ] **TASK-8.3.1**: Update AI assistant context files with Nx information

---

## Phase 9: Validation & Testing

### 9.1 Local Validation
- [ ] **TASK-9.1.1**: Run `nx graph` and verify project dependencies
- [ ] **TASK-9.1.2**: Run `nx run-many -t build` and verify all packages build
- [ ] **TASK-9.1.3**: Run `nx run-many -t test` and verify all tests pass
- [ ] **TASK-9.1.4**: Run `nx run-many -t lint` and verify linting works
- [ ] **TASK-9.1.5**: Verify caching works by running commands twice

### 9.2 Affected Command Validation
- [ ] **TASK-9.2.1**: Make a change to `packages/core` and verify affected commands work
- [ ] **TASK-9.2.2**: Verify only dependent projects are rebuilt/retested
- [ ] **TASK-9.2.3**: Test `nx affected -t test --base=main` on a feature branch

### 9.3 CI/CD Validation
- [ ] **TASK-9.3.1**: Create test PR to verify CI workflows work with Nx
- [ ] **TASK-9.3.2**: Verify cache hits in CI environment
- [ ] **TASK-9.3.3**: Benchmark CI times before and after migration

---

## Phase 10: Cleanup & Finalization

### 10.1 Remove Legacy Files
- [ ] **TASK-10.1.1**: Delete `turbo.json`
- [ ] **TASK-10.1.2**: Delete `turbo/` directory completely
- [ ] **TASK-10.1.3**: Remove any `.turbo` cache directories
- [ ] **TASK-10.1.4**: Remove Turbo-related entries from `.gitignore`

### 10.2 Final Documentation
- [ ] **TASK-10.2.1**: Update this migration document with completion status
- [ ] **TASK-10.2.2**: Document any issues encountered and solutions
- [ ] **TASK-10.2.3**: Create migration retrospective notes

---

## Appendix A: Command Mapping Reference

| Old (Turbo) | New (Nx) |
|-------------|----------|
| `turbo build` | `nx run-many -t build` |
| `turbo test:unit` | `nx run-many -t test` |
| `turbo lint` | `nx run-many -t lint` |
| `turbo typecheck` | `nx run-many -t typecheck` |
| `turbo check` | `nx run-many -t lint typecheck` |
| `turbo format:fix` | `nx format:write` |
| `turbo watch` | `nx run-many -t watch` |
| `turbo --filter=@app/core build` | `nx run core:build` |
| `turbo check-circular-deps` | `nx graph` (visual) |

## Appendix B: Environment Variables

Nx respects these environment variables:
- `NX_DAEMON` - Enable/disable Nx daemon (true by default)
- `NX_CACHE_DIRECTORY` - Custom cache location
- `NX_SKIP_NX_CACHE` - Skip cache for a run
- `NX_PARALLEL` - Number of parallel tasks
- `NX_BASE` / `NX_HEAD` - Git refs for affected calculations

## Appendix C: Useful Nx Commands

```bash
# Visualize project graph
nx graph

# Show affected projects
nx show projects --affected

# Run specific target on specific project
nx run core:test

# Run target on all projects
nx run-many -t test

# Run target only on affected projects
nx affected -t test

# Clear cache
nx reset

# List all projects
nx show projects

# View project details
nx show project core
```

---

## Progress Tracking

**Last Updated**: 2025-12-01  
**Current Phase**: Phase 9 - Validation & Testing  
**Blocked By**: None  
**Next Action**: Run validation commands to verify Nx is working correctly
