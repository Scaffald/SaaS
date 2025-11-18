# SCF-Neue Cursor Rules

This directory contains streamlined Cursor rules that establish guard rails and development practices for the SCF-Neue project.

## Core Rules (Always Applied)

### 1. `code-quality.mdc`
**CI/CD aligned code quality standards** - Applied to all TypeScript/JavaScript files:
- **Pre-commit workflow**: Always run `pnpm check` before committing
- **CI alignment**: Run same checks locally as GitHub Actions
- **Quality gates**: Zero formatting errors, minimal warnings, successful builds
- **Commands**: `pnpm check && pnpm build` (matches CI exactly)

### 2. `project-guardrails.mdc`
**Essential project practices** - Applied to all files:
- **Package manager**: Always use `pnpm` instead of `npm`
- **Server management**: Assume servers are running, use workspace commands
- **Testing**: Always prompt for testing in actual clients
- **Git context**: Check git history for debugging and bug fixes
- **Workspace awareness**: Monorepo structure and command reference

## Specialized Rules (Auto-Applied)

### 3. `api-testing.mdc`
**API development guidelines** - Auto-attached to API files:
- Always prompt user to test APIs in actual clients
- Suggest browser extensions (REST Client, Thunder Client, Postman)
- Provide curl commands for quick testing
- Assume Supabase APIs available at `http://localhost:54321/*`

### 4. `supabase.mdc`
**Supabase development** - Auto-attached to Supabase files:
- Use `pnpm supa` instead of global supabase CLI
- Assume Supabase running on localhost:54321
- Common commands: `pnpm supa start/stop/generate/migration:new`

### 5. `react-native.mdc`
**React Native/Expo development** - Auto-attached to React Native files:
- Use `pnpm native`, `pnpm ios`, `pnpm android`
- Assume Expo dev server running on localhost:8081
- Test on actual devices when possible

### 6. `ui-development.mdc`
**UI component standards** - Auto-attached to UI files:
- Prefer Tamagui vanilla components and Bento components
- Create reusable, cross-platform components in `packages/ui/`
- Document components thoroughly with JSDoc

### 7. `avoid-barrel-files.mdc`
**Build performance optimization**:
- Avoid barrel files (index.ts re-exports) for better build performance
- Use direct imports instead of barrel imports
- Improves tree-shaking and hot reload performance

### 8. `route-naming-convention.mdc`
**Consistent route structure**:
- Dashboard routes follow `<parent>-<child>-{left|right|screen}.tsx` pattern
- Components named `ParentChildLeft`, `ParentChildRight`, `ParentChildScreen`
- Configuration files in `config/` folders

### 9. `typescript-typing.mdc`
**TypeScript typing standards** - Auto-attached to TypeScript files:
- Never use `any` type - prefer `unknown` or proper typing
- Always define explicit types for functions and components
- Use proper interfaces and type definitions
- Validate external data with type guards
- Use generic types for reusable code

### 10. `testing-logging.mdc`
**Testing workflow reminders** - Always applied:
- Quiet reporters log only suite lifecycle + failures for Vitest/Playwright
- Use `TEST_LOG_VERBOSE=1` (global) or `// @testlog verbose` (per file) to re-enable success logs
- `TEST_LOG_DEBUG=1` surfaces reporter internals when diagnosing hangs
- Last `completed …` line tells you which suite is still running/hung; rerun that file directly when stuck

## Key Benefits

1. **CI/CD Alignment** - Local development matches GitHub Actions exactly
2. **Consistent Tooling** - Always use pnpm workspace commands
3. **Quality Enforcement** - Automated formatting, linting, and type checking
4. **Type Safety** - Strong TypeScript typing standards, no `any` types
5. **Context Awareness** - Git history checking for debugging
6. **Performance Optimization** - Avoid patterns that slow builds
7. **Cross-Platform Standards** - Consistent UI development practices

## Development Workflow

```bash
# Before committing (matches CI exactly)
pnpm check && pnpm build

# Individual quality checks
pnpm check              # Format, lint, type check
pnpm build              # Build verification
pnpm check-deps         # Dependency consistency
pnpm lint-sherif        # Advanced monorepo linting
pnpm check-circular-deps # Circular import detection
```

## Adding New Rules

Create new `.mdc` files with appropriate metadata:

```yaml
---
description: "Rule description"
globs: ["file/pattern/**/*"]  # Optional, for auto-attachment
alwaysApply: true/false      # Whether to always apply
---
```

Rules are automatically applied based on file patterns and configuration.

## Memory Bank

The `memory/` directory contains accumulated project knowledge and patterns:

### Project Knowledge
- **`project-overview.md`** - Complete project structure, tech stack, and current status
- **`architecture-decisions.md`** - Key architectural choices, rationale, and trade-offs
- **`common-patterns.md`** - Established code patterns, conventions, and examples
- **`troubleshooting-guide.md`** - Common issues, debugging strategies, and solutions
- **`development-workflows.md`** - Complete development processes and team workflows

### Memory Bank Benefits
1. **Faster Context Loading** - Quick understanding of project structure and decisions
2. **Consistent Patterns** - Reference for established coding conventions
3. **Efficient Debugging** - Common issues and proven solutions
4. **Team Knowledge** - Shared understanding of workflows and processes
5. **Onboarding** - Comprehensive guide for new team members

### Updating Memory Bank
The memory bank should be updated when:
- New architectural decisions are made
- Common patterns evolve or new ones emerge
- Troubleshooting solutions are discovered
- Workflows change or improve
- Project structure or tech stack changes

This ensures the memory bank remains current and valuable for both AI assistants and team members.
