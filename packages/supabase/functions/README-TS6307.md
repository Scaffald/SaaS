# TS6307 Error Suppression Strategy

## Why These Errors Occur

TypeScript follows import chains even for type-only imports. When `app-router-type.ts` (included in expo tsconfig) imports from `_app.ts` (excluded Deno function file), TypeScript follows the entire import chain, causing TS6307 errors for all excluded files in that chain.

## Current Suppression Strategy

We use `// @ts-nocheck` on key entry point files:
- `trpc/routers/_app.ts` - Main router entry point
- `trpc/middleware.ts` - Shared middleware

This suppresses errors in those files and their direct imports, reducing errors from 86 to ~47.

## Adding More Suppression

If you need to suppress more errors, add `// @ts-nocheck` to the top of frequently imported files in:
- `functions/_shared/*.ts` - Shared utilities
- `functions/trpc/routers/*.ts` - Individual routers

## Alternative: Type Generation

A better long-term solution would be to generate the AppRouter type separately, avoiding the need to import from Deno files entirely.

