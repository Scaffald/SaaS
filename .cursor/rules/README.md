# SCF-Neue Cursor Rules

This directory contains Cursor rules that establish guard rails and development practices for the SCF-Neue project.

## Rules Overview

### 1. `project-guardrails.mdc` (Always Applied)
Core project guidelines that apply to all files:
- Use `yarn` instead of `npm`
- Use `yarn supabase` instead of global supabase CLI
- Assume servers are already running
- Always prompt for testing in actual clients
- Check git history for bug fixes and errors

### 2. `supabase.mdc` (Auto-attached to Supabase files)
Supabase-specific development guidelines:
- Use `yarn supa` for all Supabase operations
- Assume Supabase is running on localhost:54321
- Use local types generation for development

### 3. `api-testing.mdc` (Auto-attached to API files)
API development and testing guidelines:
- Always prompt user to test APIs
- Suggest browser extensions for testing
- Provide curl commands for quick testing
- Assume APIs are running on default ports

### 4. `git-context.mdc` (Agent requested)
Git history and debugging context:
- Always check git history for bug fixes
- Use specific git commands for context gathering
- Follow systematic bug investigation workflow

### 5. `react-native.mdc` (Auto-attached to React Native files)
React Native and Expo development:
- Use `yarn native`, `yarn ios`, `yarn android`
- Assume Expo dev server is running
- Test on actual devices when possible

### 6. `nextjs.mdc` (Auto-attached to Next.js files)
Next.js web development:
- Use `yarn web` instead of `next dev`
- Assume Next.js is running on localhost:3000
- Test in actual browser with dev tools

### 7. `ui-development.mdc` (Auto-attached to UI files)
UI component development guidelines:
- Prefer Tamagui vanilla components
- Prefer Bento components for complex patterns
- Create reusable components in packages/ui
- Make components cross-platform and well-documented
- Refactor components to be clean and modular

### 8. `code-quality.mdc` (Always Applied)
Code quality and maintenance guidelines:
- Always run `yarn check` when making changes
- Aim for zero formatting errors and minimal warnings
- Maintain TypeScript type safety across the entire project
- Maintain consistent code quality across the project

## Usage

These rules are automatically applied based on file patterns and context. They help ensure:

1. **Consistent tooling** - Always use yarn workspace commands
2. **Proper testing** - Always test in actual clients
3. **Context awareness** - Check git history for debugging
4. **Server management** - Assume servers are running
5. **Platform-specific guidance** - Tailored rules for different technologies
6. **UI consistency** - Prefer Tamagui/Bento components and create reusable UI components
7. **Code quality** - Automated formatting, linting, and TypeScript checking

## Adding New Rules

To add new rules, create a new `.mdc` file in this directory with the appropriate metadata:

```yaml
---
description: "Rule description"
globs: ["file/pattern/**/*"]  # Optional, for auto-attachment
alwaysApply: true/false      # Whether to always apply
---
```

The rules will be automatically picked up by Cursor and applied based on the configuration.
