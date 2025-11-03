
# GEMINI.md

## Project Overview

This is a [Tamagui](https://tamagui.dev), [solito](https://solito.dev), [Expo](https://expo.dev), and [Supabase](https://supabase.com) project. It is a monorepo managed with [pnpm](https://pnpm.io) and [Turbo](https://turbo.build). The project includes a web app, an iOS app, and an Android app.

The project is structured as a monorepo with the following workspaces:

-   `apps/expo`: The Expo app (iOS and Android)
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

-   Start Supabase: `pnpm supa:start`
-   Stop Supabase: `pnpm supa:stop`
-   Reset database: `pnpm supa:reset`
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
