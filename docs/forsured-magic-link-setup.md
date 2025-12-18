# Forsured Magic Link Setup

## Issue

Supabase CLI's GoTrue service uses hardcoded `GOTRUE_SITE_URL=http://127.0.0.1:3000` instead of reading `site_url` from `config.toml`. This causes magic links to redirect to the wrong URL.

## Current Status

- ✅ `config.toml` has correct `site_url = "http://localhost:5173"`
- ✅ `additional_redirect_urls` includes callback paths
- ❌ GoTrue container still uses `GOTRUE_SITE_URL=http://127.0.0.1:3000`
- ⚠️  This is a known limitation of Supabase CLI

## Workaround

### Option 1: Manual Container Recreation (Recommended)

After starting Supabase, manually recreate the auth container with correct environment variables:

```bash
# Stop and remove the auth container
docker stop supabase_auth_scf-supabase
docker rm supabase_auth_scf-supabase

# Get the network name
NETWORK=$(docker network ls | grep supabase | awk '{print $2}' | head -1)

# Recreate with correct environment variables
docker run -d \
  --name supabase_auth_scf-supabase \
  --network "$NETWORK" \
  -e "GOTRUE_SITE_URL=http://localhost:5173" \
  -e "GOTRUE_URI_ALLOW_LIST=http://localhost:5173,http://localhost:5173/auth/callback,http://127.0.0.1:5173,http://127.0.0.1:5173/auth/callback,http://127.0.0.1:8081" \
  $(docker inspect supabase_auth_scf-supabase --format '{{range .Config.Env}}{{println .}}{{end}}' 2>/dev/null | grep -v "GOTRUE_SITE_URL\|GOTRUE_URI_ALLOW_LIST" | xargs -n1 echo | sed 's/^/-e /' | tr '\n' ' ') \
  public.ecr.aws/supabase/gotrue:v2.184.0 \
  auth
```

### Option 2: Use Fix Script

Run the fix script after starting Supabase:

```bash
bash scripts/fix-gotrue-env.sh
```

### Option 3: Verify It Works Anyway

Despite the environment variables showing wrong values, Supabase might read `config.toml` at runtime. Test the magic link flow to see if it works:

1. Start Supabase: `pnpm supa start`
2. Start Forsured: `pnpm dev:forsured`
3. Submit email on `/start` page
4. Check Mailpit for the magic link
5. Verify the `redirect_to` parameter in the link

## Verification

Check if environment variables are set correctly:

```bash
docker exec supabase_auth_scf-supabase env | grep GOTRUE_SITE_URL
# Should show: GOTRUE_SITE_URL=http://localhost:5173
```

## Future Fix

This should be fixed in Supabase CLI to properly read `site_url` from `config.toml` and set `GOTRUE_SITE_URL` accordingly.

