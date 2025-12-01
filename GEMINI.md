
# GEMINI.md

## Project Overview

This is a [Tamagui](https://tamagui.dev), [solito](https://solito.dev), [Expo](https://expo.dev), and [Supabase](https://supabase.com) project. It is a monorepo managed with [pnpm](https://pnpm.io) and [Nx](https://nx.dev). The project includes a web app, an iOS app, and an Android app.

The project is structured as a monorepo with the following workspaces:

-   `apps/expo`: The Expo app (iOS, Android, and Web)
-   `packages/core`: Core business logic and types
-   `packages/ui`: Shared UI components
-   `packages/supabase`: Supabase client and migrations
-   `packages/schemas`: Zod schemas for validation

## Building and Running

### Development

-   Web: `pnpm web`
-   iOS: `pnpm ios`
-   Android: `pnpm android`

### Supabase

-   Start Supabase: `pnpm supa start`
-   Stop Supabase: `pnpm supa stop`
-   Reset database: `pnpm supa db reset`
-   Generate types: `pnpm supa:generate`

### Testing

-   Run all tests: `pnpm test`
-   Run Playwright E2E tests: `pnpm exec playwright test`

## Development Conventions

### Code Quality

-   Format code: `pnpm format:fix`
-   Lint code: `pnpm lint:fix`
-   Type check: `pnpm typecheck`

### Generators

-   Component: `pnpm gen component`
-   Screen: `pnpm gen screen`
-   tRPC Router: `pnpm gen router`
-   Route: `pnpm gen route`

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
