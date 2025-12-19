# Login Tests Setup Guide

This guide will help you get the login flow E2E tests passing.

## Prerequisites Checklist

### 1. Create `.env.test` File

Copy the template and fill in your values:

```bash
cp .env.test.example .env.test
```

**Required variables for login tests:**

```bash
# Supabase Configuration (get from `pnpm supa status` after starting Supabase)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# GoTrue Configuration (CRITICAL for magic links)
GOTRUE_SITE_URL=http://localhost:5173
GOTRUE_URI_ALLOW_LIST=http://localhost:5173,http://localhost:5173/auth/callback,http://127.0.0.1:5173,http://127.0.0.1:5173/auth/callback,http://127.0.0.1:8081

# Authentication Mode (MUST be false for magic link tests)
VITE_FORSURED_USE_OAUTH=false

# Mailpit (optional, defaults to http://127.0.0.1:54324)
MAILPIT_URL=http://127.0.0.1:54324
```

**Note:** The default Supabase keys above are for local development. If you're using a different Supabase instance, get the keys from `pnpm supa status`.

### 2. Start Supabase with Mailpit

The tests require Supabase and Mailpit to be running. Mailpit is automatically enabled when running in test mode.

```bash
# From project root
pnpm supa start
```

**Verify Supabase is running:**
```bash
pnpm supa status
```

**Verify Mailpit is running:**
```bash
curl http://127.0.0.1:54324/api/v1/messages
# Should return JSON with messages array
```

**Or open in browser:**
- Mailpit UI: http://127.0.0.1:54324

### 3. Configure GoTrue Environment Variables

GoTrue (Supabase Auth) needs to know the correct redirect URL for magic links. This is **critical** for tests to pass.

**Option A: Use docker-compose.override.yml (Recommended)**

The file `packages/supabase/supabase/docker-compose.override.yml` should already be configured to read from environment variables. Make sure your `.env.test` has:

```bash
GOTRUE_SITE_URL=http://localhost:5173
GOTRUE_URI_ALLOW_LIST=http://localhost:5173,http://localhost:5173/auth/callback,http://127.0.0.1:5173,http://127.0.0.1:5173/auth/callback,http://127.0.0.1:8081
```

**Option B: Use fix script after starting Supabase**

If the override file doesn't work, run the fix script:

```bash
bash scripts/fix-gotrue-env.sh
```

**Verify GoTrue configuration:**

```bash
# Check what container name Supabase is using
docker ps | grep auth

# Check environment variables (replace container name)
docker exec supabase_auth_supabase env | grep GOTRUE
```

Should show:
```
GOTRUE_SITE_URL=http://localhost:5173
GOTRUE_URI_ALLOW_LIST=http://localhost:5173,http://localhost:5173/auth/callback,...
```

### 4. Ensure Mailpit is Enabled in Supabase Config

Check `packages/supabase/config.toml`:

```toml
[inbucket]
enabled = true
```

If it's `false`, the `supabase-start.sh` script should enable it automatically in test mode, but you can verify:

```bash
grep -A 2 "\[inbucket\]" packages/supabase/config.toml
```

### 5. Run Database Migrations

Ensure all migrations are applied:

```bash
pnpm supa db push
```

## Running the Tests

### Run All Login Tests

```bash
# From project root
pnpm --filter @unicornlove/forsured-app test:e2e tests/e2e/login-flow.spec.ts
```

### Run Specific Test

```bash
pnpm --filter @unicornlove/forsured-app test:e2e tests/e2e/login-flow.spec.ts -g "new user can submit email"
```

### Run with UI (for debugging)

```bash
pnpm --filter @unicornlove/forsured-app test:e2e tests/e2e/login-flow.spec.ts --ui
```

## Troubleshooting

### Test Fails: "Email not found in Mailpit"

**Symptoms:**
- Test submits email successfully
- But email never appears in Mailpit

**Solutions:**

1. **Check Mailpit is running:**
   ```bash
   curl http://127.0.0.1:54324/api/v1/messages
   ```

2. **Check Supabase logs:**
   ```bash
   docker logs supabase_auth_supabase --tail 50
   ```
   Look for email sending errors.

3. **Verify Mailpit is enabled:**
   ```bash
   grep "enabled" packages/supabase/config.toml
   ```

4. **Increase timeout in test** (if email is slow):
   The test already waits 30 seconds, but you can increase it in `login-flow.spec.ts`:
   ```typescript
   const email = await getLatestEmail(testEmail, 60000); // 60 seconds
   ```

### Test Fails: "Magic link not found in email"

**Symptoms:**
- Email arrives in Mailpit
- But magic link extraction fails

**Solutions:**

1. **Check email content in Mailpit UI:**
   - Open http://127.0.0.1:54324
   - Click on the email
   - Check if there's a link in the HTML

2. **Check magic link format:**
   The link should match one of these patterns:
   - `https://.../auth/v1/verify?token=...`
   - `http://.../auth/callback#access_token=...`
   - `http://...?token=...&type=magiclink`

3. **Update extraction regex** in `tests/utils/mailpit.ts` if Supabase changes email format.

### Test Fails: "Redirect timeout" or "Wrong redirect URL"

**Symptoms:**
- Magic link works
- But redirects to wrong URL (e.g., `http://127.0.0.1:3000` instead of `http://localhost:5173`)

**Solutions:**

1. **Check GOTRUE_SITE_URL:**
   ```bash
   docker exec supabase_auth_supabase env | grep GOTRUE_SITE_URL
   ```
   Should be `http://localhost:5173`

2. **Check GOTRUE_URI_ALLOW_LIST:**
   ```bash
   docker exec supabase_auth_supabase env | grep GOTRUE_URI_ALLOW_LIST
   ```
   Should include `http://localhost:5173/auth/callback`

3. **Restart Supabase with correct env vars:**
   ```bash
   pnpm supa stop
   # Make sure .env.test has correct values
   pnpm supa start
   # Or run fix script
   bash scripts/fix-gotrue-env.sh
   ```

4. **Check Start.tsx redirect URL:**
   The code in `apps/forsured-web/src/pages/Start.tsx` should use:
   ```typescript
   const redirectTo = `${window.location.protocol}//${window.location.host}/auth/callback`;
   ```
   This should resolve to `http://localhost:5173/auth/callback` in tests.

### Test Fails: "Session not established"

**Symptoms:**
- Magic link redirects correctly
- But authentication fails

**Solutions:**

1. **Check Supabase session:**
   The callback handler waits for Supabase to process hash fragments. If it's timing out:
   - Increase wait time in `Callback.tsx` (line 132)
   - Check browser console for Supabase errors

2. **Verify database triggers:**
   When a user is created in Supabase Auth, triggers should create:
   - `core.users` record
   - `core.profile` record
   - `forsured.user_profiles` record (if using Forsured schema)

   Check if triggers are working:
   ```sql
   -- In Supabase SQL editor
   SELECT * FROM core.users ORDER BY created_at DESC LIMIT 5;
   SELECT * FROM forsured.user_profiles ORDER BY created_at DESC LIMIT 5;
   ```

3. **Check RLS policies:**
   Ensure RLS policies allow profile creation:
   ```sql
   -- Check if user can create their own profile
   SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
   ```

### Test Fails: "Services not ready"

**Symptoms:**
- Global setup fails
- Tests don't start

**Solutions:**

1. **Check services are running:**
   ```bash
   # Supabase
   curl http://localhost:54321/rest/v1/
   
   # Auth
   curl http://localhost:54321/auth/v1/health
   
   # Mailpit
   curl http://127.0.0.1:54324/api/v1/messages
   ```

2. **Increase timeout in global-setup.ts:**
   The setup waits up to 30 attempts. If services are slow to start, increase `maxRetries`.

3. **Check port conflicts:**
   ```bash
   lsof -i :54321  # Supabase
   lsof -i :54324  # Mailpit
   lsof -i :5173  # Dev server
   ```

## Quick Setup Script

Here's a quick script to set everything up:

```bash
#!/bin/bash
# setup-login-tests.sh

echo "🔧 Setting up login tests..."

# 1. Create .env.test from template
if [ ! -f .env.test ]; then
  echo "📝 Creating .env.test from template..."
  cp .env.test.example .env.test
  echo "⚠️  Please edit .env.test and fill in your values"
else
  echo "✓ .env.test already exists"
fi

# 2. Start Supabase
echo "🚀 Starting Supabase..."
pnpm supa start

# 3. Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 5

# 4. Fix GoTrue env vars
echo "🔧 Fixing GoTrue environment variables..."
bash scripts/fix-gotrue-env.sh

# 5. Verify services
echo "✅ Verifying services..."
curl -s http://127.0.0.1:54324/api/v1/messages > /dev/null && echo "✓ Mailpit is running" || echo "❌ Mailpit is not running"
curl -s http://localhost:54321/rest/v1/ > /dev/null && echo "✓ Supabase is running" || echo "❌ Supabase is not running"

echo ""
echo "🎉 Setup complete! Run tests with:"
echo "   pnpm --filter @unicornlove/forsured-app test:e2e tests/e2e/login-flow.spec.ts"
```

## Test Flow Overview

1. **User submits email** on `/start` page
2. **Supabase sends magic link** via email (captured by Mailpit)
3. **Test extracts magic link** from Mailpit email
4. **Test navigates to magic link** (Supabase processes it)
5. **Supabase redirects to `/auth/callback`** with session
6. **Callback handler** creates profile if needed
7. **User redirected to `/signup`** (new user) or `/dashboard` (existing)

## Key Files

- **Test file**: `apps/forsured-web/tests/e2e/login-flow.spec.ts`
- **Test utilities**: `apps/forsured-web/tests/utils/mailpit.ts`
- **Global setup**: `apps/forsured-web/tests/global-setup.ts`
- **Start page**: `apps/forsured-web/src/pages/Start.tsx`
- **Callback handler**: `apps/forsured-web/src/pages/Callback.tsx`
- **Verify page**: `apps/forsured-web/src/pages/VerifyEmail.tsx`
- **GoTrue config**: `packages/supabase/supabase/docker-compose.override.yml`
- **Start script**: `scripts/supabase-start.sh`
- **Fix script**: `scripts/fix-gotrue-env.sh`

## Next Steps

Once tests are passing:

1. ✅ All login flow tests pass
2. ✅ Email delivery works
3. ✅ Magic link authentication works
4. ✅ Profile creation works
5. ✅ Redirects work correctly

Then you can:
- Add more test cases
- Test OAuth flow (`VITE_FORSURED_USE_OAUTH=true`)
- Test existing user login
- Test error scenarios

