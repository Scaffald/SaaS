# Cline Rules for SCF-Scaffald

## Primary Rule Source
**All project rules and guidelines are located in `.cursor/rules/` directory.**

Please check the following locations for comprehensive project information:

### Core Rules
- **`.cursor/rules/code-quality.mdc`** - CI/CD aligned code quality standards
- **`.cursor/rules/project-guardrails.mdc`** - Essential project practices and tooling
- **`.cursor/rules/README.md`** - Complete overview of all rules and their purposes

### Specialized Rules
- **`.cursor/rules/api-testing.mdc`** - API development and testing guidelines
- **`.cursor/rules/supabase.mdc`** - Supabase-specific development practices
- **`.cursor/rules/react-native.mdc`** - React Native and Expo development
- **`.cursor/rules/ui-development.mdc`** - UI component development standards
- **`.cursor/rules/avoid-barrel-files.mdc`** - Build performance optimization
- **`.cursor/rules/route-naming-convention.mdc`** - Consistent route structure

### Memory Bank (Project Knowledge)
- **`.cursor/rules/memory/project-overview.md`** - Complete project structure and tech stack
- **`.cursor/rules/memory/architecture-decisions.md`** - Key architectural choices and rationale
- **`.cursor/rules/memory/common-patterns.md`** - Established code patterns and conventions
- **`.cursor/rules/memory/troubleshooting-guide.md`** - Common issues and debugging strategies
- **`.cursor/rules/memory/development-workflows.md`** - Complete development processes

## Key Development Commands
```bash
# Primary quality workflow (matches CI exactly)
pnpm check && pnpm build

# Individual checks
pnpm check              # Format, lint, type check
pnpm build              # Build verification
pnpm check-deps         # Dependency consistency
pnpm lint-sherif        # Advanced monorepo linting
pnpm check-circular-deps # Circular import detection
```

## Project Structure
- **pnpm workspace monorepo** with cross-platform React Native/Next.js application
- **Primary platform**: React Native (Expo) for iOS, Android, and Web
- **Tech stack**: TypeScript, Tamagui, Supabase, tRPC, Turbo
- **Package manager**: Always use `pnpm` instead of `npm`

## Quick Reference
- **Always run `pnpm check`** before committing changes
- **Use direct imports** instead of barrel files for better performance
- **Follow route naming convention**: `<parent>-<child>-{left|right|screen}.tsx`
- **Prefer Tamagui components** for UI development
- **Test in actual clients** rather than assuming functionality works
- **Check git history** when debugging issues

---

*This file serves as a pointer to the comprehensive rule set in `.cursor/rules/`. All detailed guidelines, patterns, and project knowledge are maintained there to ensure consistency between Cursor and Cline.*
