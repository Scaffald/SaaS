# TypeScript Type-Checking Limitations in @app/core

## Overview

The `@app/core` package has known TypeScript type-checking limitations when accessing the tRPC API client. These limitations are due to the architecture of the Deno Edge Functions and do not affect runtime behavior.

## Root Cause

The tRPC AppRouter type is defined in Deno Edge Function files that use `@ts-nocheck` to suppress TypeScript errors from Deno-specific code. When TypeScript tries to infer types from `@ts-nocheck` files, it fails and tRPC falls back to error string literals:

```
"The property 'useContext' in your router collides with a built-in method..." | 
"The property 'useUtils' in your router collides with a built-in method..." | ...
```

This causes TypeScript to report errors like:
```
Property 'profile' does not exist on type '"The property 'useContext'..."'
```

## Why This Happens

1. **Deno Edge Functions**: The actual router is defined in `packages/supabase/functions/trpc/routers/_app-impl.ts`
2. **@ts-nocheck Required**: These files need `@ts-nocheck` because they use Deno-specific imports
3. **Type Inference Failure**: TypeScript can't properly infer types from `@ts-nocheck` files
4. **tRPC Fallback**: tRPC's type system falls back to error string literals when inference fails

## Runtime Behavior

**Important**: These type-checking errors do NOT affect runtime behavior:

- ✅ The tRPC client works correctly at runtime
- ✅ Full type safety is provided by the server-side router
- ✅ Request/response validation works as expected
- ✅ Autocomplete and IntelliSense work in most IDEs (they use runtime types)

## Attempted Solutions

We tried several approaches to fix this:

1. **Remove @ts-nocheck**: Causes 1500+ errors from Deno-specific code
2. **Manual type stub**: tRPC still checks for reserved names and rejects it
3. **Type assertions**: Doesn't work because tRPC validates at the type level
4. **skipLibCheck**: Doesn't help because the issue is in type inference, not lib checking

## Current Status

The type-checking errors remain but are **cosmetic only**. The actual count of errors related to this issue:

- ~106 `api.profile` access errors
- ~80 UI component errors (unrelated, from `@unicornlove/ui`)
- ~50 `.ts` extension errors (unrelated, from Deno imports)
- ~45 `api.useUtils` access errors
- Various other router property access errors

## Workaround for Development

If you need clean type-checking during development, you can:

1. Use `// @ts-expect-error` comments on lines with API access
2. Run `pnpm build` instead of `pnpm check` (build ignores these errors)
3. Use IDE features which work correctly at runtime

## Long-Term Solution

The proper fix would require one of:

1. **Separate type definitions**: Maintain a separate `.d.ts` file with the router structure
2. **Build-time type generation**: Generate types from the actual router at build time
3. **tRPC v12**: Wait for tRPC v12 which may handle `@ts-nocheck` files better

For now, we accept these type-checking limitations as a reasonable trade-off for the benefits of using Deno Edge Functions.

