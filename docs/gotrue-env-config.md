# GoTrue Environment Variable Configuration

## Overview

GoTrue (Supabase's authentication service) uses environment variables to configure magic link redirect URLs. These can be set in `.env` or `.env.test` files.

## Environment Variables

### Required for Magic Links

- **`GOTRUE_SITE_URL`** (or **`APP_URL`**): Base URL for magic links
  - Default: `http://localhost:5173`
  - Example: `GOTRUE_SITE_URL=http://localhost:5173`
  - Alternative: `APP_URL=http://localhost:5173` (will be used if `GOTRUE_SITE_URL` not set)

- **`GOTRUE_URI_ALLOW_LIST`**: Comma-separated list of allowed redirect URLs
  - Default: Auto-generated from `GOTRUE_SITE_URL`
  - Example: `GOTRUE_URI_ALLOW_LIST=http://localhost:5173,http://localhost:5173/auth/callback,http://127.0.0.1:5173,http://127.0.0.1:5173/auth/callback`

## Configuration Files

### .env or .env.test

Add these variables to your `.env` or `.env.test` file:

```bash
# GoTrue Configuration
GOTRUE_SITE_URL=http://localhost:5173
# Or use APP_URL as alternative:
# APP_URL=http://localhost:5173

# Optional: Explicit allow list (auto-generated if not set)
GOTRUE_URI_ALLOW_LIST=http://localhost:5173,http://localhost:5173/auth/callback,http://127.0.0.1:5173,http://127.0.0.1:5173/auth/callback
```

## How It Works

1. **Docker Compose Override**: `packages/scf-supabase/supabase/docker-compose.override.yml` reads these environment variables
2. **Start Script**: `scripts/supabase-start.sh` loads `.env` and `.env.test` (in test mode) and exports the variables
3. **Fix Script**: `scripts/fix-gotrue-env.sh` can be run after Supabase starts to apply changes

## Priority Order

1. `GOTRUE_SITE_URL` environment variable (highest priority)
2. `APP_URL` environment variable (fallback)
3. Default: `http://localhost:5173` (lowest priority)

## Usage

### Development

```bash
# In .env
GOTRUE_SITE_URL=http://localhost:5173
```

### Testing

```bash
# In .env.test
GOTRUE_SITE_URL=http://localhost:5173
APP_URL=http://localhost:5173  # Alternative
```

### After Changing Variables

If Supabase is already running, you need to either:

1. **Restart Supabase** (recommended):
   ```bash
   pnpm supa stop
   pnpm supa start
   ```

2. **Or run the fix script**:
   ```bash
   bash scripts/fix-gotrue-env.sh
   ```

## Verification

Check if GoTrue has the correct environment variables:

```bash
docker exec supabase_auth_packages env | grep GOTRUE_SITE_URL
# Should show: GOTRUE_SITE_URL=http://localhost:5173
```

## Code Reference

The `emailRedirectTo` parameter in code (e.g., `Start.tsx`) is passed to Supabase, but GoTrue will only use it if:
1. The URL is in `GOTRUE_URI_ALLOW_LIST`
2. `GOTRUE_SITE_URL` is set correctly (used as fallback)

See:
- `apps/forsured-web/src/pages/Start.tsx` (line 35, 44) - Sets `emailRedirectTo`
- `packages/scf-supabase/supabase/docker-compose.override.yml` - Docker config
- `scripts/supabase-start.sh` - Startup script
- `scripts/fix-gotrue-env.sh` - Fix script

