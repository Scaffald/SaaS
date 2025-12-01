# Deno Type Checking Guide

## Overview

This document describes the Deno type checking setup for Supabase Edge Functions.

## Quick Start

Run type checking locally:

```bash
pnpm test:deno:types
```

## Configuration Files

### `deno.json`
Main Deno configuration at `packages/supabase/functions/deno.json`:
- `nodeModulesDir: "auto"` - Enables npm package support
- `importMap: "./import_map.json"` - References the import map
- `compilerOptions` - TypeScript settings for Deno

### `import_map.json`
Central import map for all dependencies using npm: specifiers:
- `@supabase/supabase-js@2.58.0`
- `@trpc/server@10.45.0`
- `stripe@20.0.0`
- `expo-server-sdk@4.0.0`
- And more...

### `trpc/deno.json`
Additional imports specific to tRPC routers including `@app/trpc/schemas` and `@app/trpc/utils`.

## Error Status

### Current State:
- **460 type errors** (with full type checking enabled)
- Types are now properly resolving from npm packages

### Error Categories:

| Error Code | Count | Description |
|------------|-------|-------------|
| TS2345 | 215 | Argument type mismatches (schema issues) |
| TS2339 | 113 | Property does not exist (database queries) |
| TS2702 | 31 | Stripe namespace issues |
| TS2769 | 19 | No overload matches |
| TS2322 | 15 | Type assignment errors |
| TS2694 | 12 | Namespace export issues |
| Others | 55 | Various other type issues |

### Root Cause Analysis:

1. **Schema Resolution**: The Supabase client defaults to `public` schema, but our application uses `core` schema. Many queries don't call `.schema('core')` before `.from()`.

2. **createClient Generic**: Files using `createClient<Database>()` should work, but queries that don't call `.schema()` resolve to public schema.

3. **Stripe 20.x**: Breaking changes in Stripe types require code updates.

## Known Issues

### Stripe 20.x API Changes
The upgrade from Stripe 14.x to 20.x introduced breaking changes. Files using Stripe may need:
- Updated import patterns
- API method name changes
- Type adjustments

### Supabase Export Resolution
Some files show `Module has no exported member` errors for `@supabase/supabase-js`. This is related to how npm: specifiers resolve types differently than esm.sh URLs.

### Database Type Mismatches
Many TS2339 errors are due to:
- Stale generated types in `types.ts`
- Missing tables/columns in generated types
- Query results not matching expected shapes

To fix, run: `pnpm supa:generate`

## Best Practices

### Use Import Map Specifiers
```typescript
// ✅ Good - uses import map
import { createClient } from "@supabase/supabase-js";

// ❌ Bad - hardcoded URL
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
```

### Type-Only Imports
```typescript
// ✅ Good - explicit type import
import type { Database } from "../_shared/database.types.ts";

// For values
import { z } from "zod";
```

### File Extensions
Deno requires explicit `.ts` extensions:
```typescript
// ✅ Good
import { corsHeaders } from "../_shared/cors.ts";

// ❌ Bad - no extension
import { corsHeaders } from "../_shared/cors";
```

## Adding Dependencies

1. Add to `import_map.json`:
```json
{
  "imports": {
    "new-package": "npm:new-package@1.0.0"
  }
}
```

2. Run `deno install` to update node_modules
3. Use in code with bare specifier

## CI Integration

The `pnpm test:deno:types` script can be added to CI pipelines when type checking is clean:

```yaml
- name: Check Deno Types
  run: pnpm test:deno:types
```

## Future Improvements

1. **Regenerate Supabase types** - Run `pnpm supa:generate` after schema changes
2. **Fix Stripe 20.x imports** - Update to new API patterns
3. **Remove @ts-nocheck pragmas** - Once errors are resolved in those files
4. **Add to CI pipeline** - When error count reaches 0
