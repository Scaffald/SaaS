# Supabase Cloud Deployment Guide

This guide explains how to deploy your database, Edge Functions, and configure authentication for production.

## 📋 Overview

Your local Supabase setup includes:
- 78+ database migrations
- 3 Edge Functions (tRPC, job-import, news)
- Storage buckets (avatars, certifications, application-attachments)
- Auth providers (Google, Apple)
- Row Level Security (RLS) policies

## 🚀 Setup Steps

### Step 1: Create Supabase Project

#### 1.1 Create Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Fill in details:
   - **Name**: `SCF-Neue` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Start with Free tier

4. Wait for project to be created (~2 minutes)

#### 1.2 Note Down Credentials

After creation, go to Project Settings → API:
- **Project URL**: `https://xxx.supabase.co`
- **Anon/Public Key**: `eyJhxxx...` (for client apps)
- **Service Role Key**: `eyJhxxx...` (for server-side, keep secret!)

Go to Project Settings → Database:
- **Connection String**: `postgresql://postgres:[password]@...`

### Step 2: Link Local Project to Cloud

#### 2.1 Install Supabase CLI

Already installed via pnpm workspace, but verify:
```bash
pnpm supa --version
```

#### 2.2 Login to Supabase

```bash
pnpm supa login
```

This opens browser for authentication.

#### 2.3 Link Project

Get your project reference (from dashboard URL):
```
https://supabase.com/dashboard/project/YOUR-PROJECT-REF
```

Link it:
```bash
cd packages/supabase
pnpm supa link --project-ref YOUR-PROJECT-REF
```

Verify:
```bash
pnpm supa db remote --status
```

### Step 3: Configure API Exposed Schemas and Auth URLs

**IMPORTANT:** After creating the `core` and `cms` schemas, you must configure PostgREST to expose them. Also ensure auth URLs use production values.

The `config.toml` file uses environment variables (e.g., `env(EXPO_PUBLIC_URL)`). Use the appropriate command:

**For Production:**
```bash
pnpm supa:config:push:prod --yes
```
This loads `.env.production` and pushes config with production URLs (e.g., `https://preview.scaffald.com`).

**For Local Development:**
```bash
pnpm supa:config:push --yes
```
This loads `.env` and pushes config with local URLs (e.g., `http://localhost:8081`).

**What gets updated:**
- API exposed schemas: `auth`, `public`, `core`, `cms`, `storage`, `data`, `onet`
- `extra_search_path` to match
- Auth `site_url` and `additional_redirect_urls` (uses `EXPO_PUBLIC_URL` from env file)
- Shows a diff of changes before applying

**Note:** 
- Always use `supa:config:push:prod` for production deployments to avoid pushing localhost URLs
- Without this step, API calls to `core.*` or `cms.*` tables will fail with "schema must be one of..." errors
- Auth redirect URLs must match your production domain for OAuth to work correctly

### Step 4: Push Database Migrations

#### 4.1 Review Migrations

Check what will be applied:
```bash
pnpm supa db diff --linked
```

#### 4.2 Push All Migrations

```bash
pnpm supa db push
```

This applies all migrations in order. Watch for:
- ✅ Success messages for each migration
- ❌ Any errors (address immediately)

#### 4.3 Verify Tables

```bash
# List all tables
pnpm supa db remote --list

# Or check in dashboard
# Project → Database → Tables
```

### Step 5: Deploy Edge Functions

#### 5.1 Deploy tRPC Router

```bash
pnpm supa functions deploy trpc --project-ref YOUR-PROJECT-REF
```

#### 5.2 Deploy Job Import Function

```bash
pnpm supa functions deploy job-import --project-ref YOUR-PROJECT-REF
```

#### 5.3 Deploy News Function

```bash
pnpm supa functions deploy news --project-ref YOUR-PROJECT-REF
```

#### 5.4 Verify Deployments

```bash
pnpm supa functions list
```

Or check dashboard:
```
Project → Edge Functions
```

### Step 6: Configure Storage Buckets

#### 6.1 Create Buckets

In Supabase Dashboard:
```
Storage → Create bucket
```

Create these buckets:
- `avatars` (public)
- `certifications` (private)
- `application-attachments` (private)

#### 6.2 Configure Bucket Policies

For each bucket, set up RLS policies matching your migrations:

**Avatars (Public Read)**
```sql
-- Allow public to read avatars
CREATE POLICY "Public avatars are viewable by everyone"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**Certifications (Private)**
```sql
-- Users can only see their own certifications
CREATE POLICY "Users can view their own certifications"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'certifications' AND auth.uid()::text = (storage.foldername(name))[1]);
```

#### 6.3 Configure File Size Limits

In each bucket settings:
- Max file size: 50MB (or adjust as needed)
- Allowed MIME types: Configure as needed

### Step 7: Configure Authentication

#### 7.1 Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (or use existing)
4. Add authorized redirect URIs:
   ```
   https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
   https://your-production-domain.com
   ```

In Supabase Dashboard:
```
Authentication → Providers → Google
```

Configure:
- Enable Google provider
- **Client ID**: From Google Console
- **Client Secret**: From Google Console
- **Redirect URL**: Pre-filled by Supabase

#### 7.2 Apple Sign In Setup

1. Go to [Apple Developer](https://developer.apple.com)
2. Configure Sign in with Apple
3. Get Service ID and Key

In Supabase Dashboard:
```
Authentication → Providers → Apple
```

Configure:
- Enable Apple provider
- **Client ID** (Services ID): From Apple Developer
- **Client Secret**: Generated from Apple key

#### 7.3 Auth Settings

In Supabase Dashboard:
```
Authentication → Settings
```

Configure:
- **Site URL**: `https://your-production-domain.com`
- **Redirect URLs**: Add your production URL
- **JWT Expiry**: 3600 (1 hour)
- **Enable email confirmations**: Yes
- **Minimum password length**: 8

### Step 8: Set Function Secrets

Edge Functions need environment variables:

```bash
# Set Google OAuth secret
pnpm supa secrets set GOOGLE_SECRET=your-google-secret

# Set Apple OAuth secret (if using)
pnpm supa secrets set APPLE_SECRET=your-apple-secret

# Verify secrets
pnpm supa secrets list
```

### Step 9: Generate TypeScript Types

After all migrations are applied:

```bash
# Generate types from production database
pnpm supa:generate:remote

# This updates packages/supabase/types.ts
```

Commit the updated types:
```bash
git add packages/supabase/types.ts
git commit -m "Update Supabase types from production"
```

### Step 10: Test Database Connection

#### 10.1 Test from Local App

Update your `.env.production`:
```bash
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Test locally:
```bash
# Source production env
source .env.production

# Start dev server
pnpm dev
```

#### 10.2 Test Authentication

1. Try signing up a new user
2. Check user appears in:
   ```
   Authentication → Users
   ```
3. Verify user record created in `profiles` table

#### 10.3 Test Storage

1. Try uploading an avatar
2. Check file appears in Storage bucket
3. Verify access permissions work

### Step 11: Configure Database Backups

In Supabase Dashboard:
```
Project Settings → Database → Backup
```

- **Point-in-time Recovery**: Enabled (automatic)
- **Manual Backups**: Schedule weekly
- **Backup Retention**: 7 days (free tier)

## 📊 Production Checklist

### Database
- [ ] All migrations applied successfully
- [ ] No migration errors
- [ ] All tables visible in dashboard
- [ ] RLS policies enabled on all tables
- [ ] Indexes created for performance

### Edge Functions
- [ ] All functions deployed
- [ ] Function secrets configured
- [ ] Functions respond correctly
- [ ] No CORS errors

### Storage
- [ ] All buckets created
- [ ] Bucket policies configured
- [ ] File size limits set
- [ ] Test upload/download works

### Authentication
- [ ] Google OAuth configured
- [ ] Apple Sign In configured
- [ ] Site URL set correctly
- [ ] Redirect URLs configured
- [ ] Email confirmations enabled

### Security
- [ ] Service role key secured
- [ ] RLS policies tested
- [ ] Auth providers verified
- [ ] API rate limiting reviewed

## 🔧 Troubleshooting

### Migration Fails

**Error: relation already exists**
```bash
# Reset remote database (CAUTION: Destroys data!)
pnpm supa db reset --linked

# Or manually fix the conflict
```

**Error: permission denied**
```bash
# Check RLS policies
# Ensure grants are correct in migrations
```

### Edge Function Errors

**Error: Missing environment variable**
```bash
# Set the secret
pnpm supa secrets set VAR_NAME=value
```

**Error: Import resolution failed**
```bash
# Check import_map.json
# Verify all dependencies listed
```

### Auth Not Working

**OAuth redirect fails**
```bash
# Verify redirect URLs in:
# 1. Supabase dashboard
# 2. OAuth provider console
# 3. Match exactly (including https://)
```

**Users can't sign in**
```bash
# Check:
# 1. Email confirmations required?
# 2. User in correct state?
# 3. Browser console errors?
```

## 📈 Performance Optimization

### Database

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_jobs_location ON jobs USING gist(location);
CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_job_id ON applications(job_id);
```

### Edge Functions

- Keep functions small and focused
- Use connection pooling
- Cache frequent queries
- Monitor function logs

### Storage

- Use CDN for public assets
- Implement image optimization
- Set appropriate cache headers

## 🔐 Security Best Practices

1. **Never commit service role key to git**
2. **Use RLS policies for all tables**
3. **Validate all user input**
4. **Enable email confirmations**
5. **Set up monitoring and alerts**
6. **Regular security audits**
7. **Keep Supabase CLI updated**

## 📚 Additional Resources

- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Auth Deep Dive](https://supabase.com/docs/guides/auth)

## 🆘 Getting Help

If you encounter issues:

1. Check Supabase logs in dashboard
2. Review migration files for errors
3. Test with Supabase CLI
4. Check [Supabase Discord](https://discord.supabase.com)
5. Review [Supabase Discussions](https://github.com/supabase/supabase/discussions)
