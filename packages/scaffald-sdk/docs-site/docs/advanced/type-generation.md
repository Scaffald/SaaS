# OpenAPI Type Generation

Guide to generating TypeScript types from the Scaffald OpenAPI specification.

## Overview

The Scaffald SDK maintains TypeScript types in two ways:

1. **Hand-crafted types** (current approach) - Types are manually defined in each resource file
2. **Auto-generated types** (optional) - Types generated from the live OpenAPI specification

Both approaches are valid. Hand-crafted types provide better control and documentation, while auto-generated types ensure perfect sync with the API.

## Current Status

✅ **Hand-crafted types are the primary source of truth**

The SDK currently uses manually defined types that are:
- Comprehensive and fully documented
- Tested with 62 unit tests
- Kept in sync with the API through code reviews
- Optimized for developer experience with helpful comments

🔧 **Auto-generation is available but optional**

The type generation script can create types from the OpenAPI spec when needed.

## Type Generation Script

### Quick Start

```bash
# From the scaffald-sdk directory
pnpm generate:types
```

### How It Works

The script tries multiple sources in priority order:

1. **`OPENAPI_URL` environment variable** - Custom OpenAPI spec URL
2. **`SUPABASE_URL/functions/v1/api/openapi.json`** - Production instance
3. **`http://localhost:54321/functions/v1/api/openapi.json`** - Local development
4. **`./openapi-spec.json`** - Cached fallback file

If any source succeeds, types are generated to `src/types/api.ts`.

### Generation from Local Development

```bash
# Start Supabase locally (from project root)
cd /Users/clay/Development/UNI-Construct
pnpm supa start

# Generate types (from SDK directory)
cd packages/scaffald-sdk
pnpm generate:types
```

### Generation from Production

```bash
# Set production Supabase URL
export SUPABASE_URL=https://your-project.supabase.co

# Generate types
pnpm generate:types
```

### Generation from Custom URL

```bash
# Use a custom OpenAPI spec URL
OPENAPI_URL=https://api.scaffald.com/openapi.json pnpm generate:types
```

### Using Cached Spec

If you have a saved OpenAPI spec file:

```bash
# Save your OpenAPI spec as openapi-spec.json in the SDK root
cat > openapi-spec.json << 'EOF'
{
  "openapi": "3.1.0",
  "info": {
    "title": "Scaffald API",
    "version": "1.0.0"
  },
  ...
}
EOF

# Generate from cached file
pnpm generate:types
```

## Generated Types Structure

When successful, the script generates `src/types/api.ts` with:

```typescript
// Auto-generated from OpenAPI spec
// DO NOT EDIT - Changes will be overwritten

export interface paths {
  '/v1/jobs': {
    get: {
      parameters: { ... }
      responses: { ... }
    }
  }
  '/v1/api-keys': {
    get: { ... }
    post: { ... }
  }
  // ...
}

export interface components {
  schemas: {
    Job: { ... }
    Application: { ... }
    APIKey: { ... }
    // ...
  }
}
```

## Using Generated Types

### Option 1: Reference OpenAPI Types

```typescript
import type { paths, components } from './types/api.js'

// Use path operation types
type JobsListResponse = paths['/v1/jobs']['get']['responses']['200']['content']['application/json']

// Use component schemas
type Job = components['schemas']['Job']
```

### Option 2: Map to Resource Types

```typescript
// In resources/jobs.ts
import type { components } from '../types/api.js'

// Map OpenAPI schema to SDK type
export type Job = components['schemas']['Job']
```

## Hand-crafted vs Auto-generated

### Hand-crafted Types (Current)

**Pros:**
- Full control over type names and structure
- Can add helpful JSDoc comments
- Can simplify complex API responses
- No build dependency on running API
- Easier to review in pull requests

**Cons:**
- Must manually keep in sync with API
- Potential for drift over time
- More maintenance overhead

**Example:**
```typescript
/**
 * API key object
 */
export interface APIKey {
  id: string
  organization_id: string
  name: string
  key_prefix: string
  scopes: APIKeyScope[]
  rate_limit_tier: RateLimitTier
  is_active: boolean
  last_used_at: string | null
  created_at: string
  expires_at: string | null
}
```

### Auto-generated Types

**Pros:**
- Always in perfect sync with API
- Catches breaking changes immediately
- Less manual maintenance
- Comprehensive coverage of all endpoints

**Cons:**
- Less readable type names (paths-based)
- No custom documentation
- Requires running API for generation
- More verbose type references

**Example:**
```typescript
// Auto-generated
export interface paths {
  '/v1/api-keys': {
    get: {
      responses: {
        '200': {
          content: {
            'application/json': {
              data: Array<{
                id: string
                organization_id: string
                // ... all fields
              }>
            }
          }
        }
      }
    }
  }
}
```

## Recommended Workflow

### For SDK Development

1. **Use hand-crafted types** as the primary source
2. **Generate types periodically** to verify alignment with API
3. **Compare differences** and update hand-crafted types if needed
4. **Run type generation in CI** to catch drift

### For API Changes

When the API changes:

1. **Update OpenAPI schemas** in the API codebase
2. **Generate new types** in the SDK
3. **Review differences** between old and new types
4. **Update hand-crafted types** to match
5. **Update SDK implementation** to handle changes
6. **Update tests** to cover new behavior

## CI/CD Integration

Add type generation to your CI pipeline:

```yaml
# .github/workflows/sdk-types-check.yml
name: Check Type Sync

on: [pull_request]

jobs:
  check-types:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4

      - name: Install dependencies
        run: pnpm install

      - name: Start Supabase
        run: pnpm supa start

      - name: Generate types
        run: |
          cd packages/scaffald-sdk
          pnpm generate:types

      - name: Check for differences
        run: |
          if git diff --exit-code src/types/api.ts; then
            echo "✅ Types are in sync"
          else
            echo "❌ Generated types differ from committed types"
            echo "Run 'pnpm generate:types' to update"
            exit 1
          fi
```

## Troubleshooting

### Error: "Failed to generate types from any source"

**Solution 1: Start Supabase locally**
```bash
cd /Users/clay/Development/UNI-Construct
pnpm supa start
cd packages/scaffald-sdk
pnpm generate:types
```

**Solution 2: Use production URL**
```bash
export SUPABASE_URL=https://your-project.supabase.co
pnpm generate:types
```

**Solution 3: Save OpenAPI spec manually**
```bash
# Fetch from running API
curl http://localhost:54321/functions/v1/api/openapi.json > openapi-spec.json

# Generate from saved file
pnpm generate:types
```

### Error: "fetch failed" or "ECONNREFUSED"

This means the API server isn't running. Either:
- Start Supabase locally: `pnpm supa start`
- Use a different source (production URL or cached file)

### Generated types look different from hand-crafted types

This is expected! Generated types use path-based structure while hand-crafted types use simplified resource-based structure. Both are valid - choose based on your needs.

## Future Improvements

Potential enhancements to type generation:

1. **Hybrid approach** - Generate base types, add custom augmentations
2. **Type mapping** - Auto-convert path types to resource types
3. **Documentation preservation** - Extract and preserve JSDoc from OpenAPI
4. **Validation** - Compare hand-crafted and generated types for drift detection
5. **Watch mode** - Regenerate types when API spec changes

## Related Documentation

- [API Reference](/docs/api/overview)
- [Getting Started](/docs/guide/installation)
- [Contributing Guide](/docs/contributing)

## Help

For questions or issues with type generation:
- 🐛 [Report Issues](https://github.com/scaffald/scaffald-sdk/issues)
- 💬 [Discord Community](https://discord.gg/scaffald)
- 📧 [Email Support](mailto:support@scaffald.com)
