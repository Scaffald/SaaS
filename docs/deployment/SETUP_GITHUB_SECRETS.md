# GitHub Secrets Setup Guide

Complete guide for connecting GitHub Actions to Netlify and Supabase for automatic deployments.

## 🎯 Overview

To enable automatic deployments, you need to configure secrets in your GitHub repository. These secrets allow GitHub Actions to:
- Deploy your web app to Netlify
- Deploy Edge Functions to Supabase
- Access environment variables during build

## 📋 Required Secrets

### 1. Netlify Secrets

#### `NETLIFY_AUTH_TOKEN`
**Purpose:** Allows GitHub Actions to deploy to your Netlify site

**How to get it:**
1. Go to [Netlify](https://app.netlify.com)
2. Click your profile icon (bottom left) → **User settings**
3. Navigate to **Applications** → **Personal access tokens**
4. Click **New access token**
5. Name it: `GitHub Actions Deployment`
6. Copy the token (you won't see it again!)

#### `NETLIFY_SITE_ID`
**Purpose:** Identifies which Netlify site to deploy to

**How to get it:**
1. Go to your (Netlify site dashboard)[https://app.netlify.com/projects/scaffald/configuration/general]
2. Navigate to **Site settings** → **General** → **Site details**
3. Copy the **Site ID** (looks like: `abc123-def456-ghi789`)

### 2. Supabase Secrets (Optional but Recommended)

#### `SUPABASE_ACCESS_TOKEN`
**Purpose:** Allows GitHub Actions to deploy Edge Functions

**How to get it:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click your profile icon (top right) → **Account Settings**
3. Navigate to **Access Tokens**
4. Click **Generate new token**
5. Name it: `GitHub Actions Deployment`
6. Copy the token immediately

#### `SUPABASE_PROJECT_ID`
**Purpose:** Identifies which Supabase project to deploy to

**How to get it:**
1. Go to your Supabase project
2. Click **Settings** (gear icon) → **General**
3. Copy the **Reference ID** (under "General settings")

### 3. Application Environment Variables

These are your actual app configuration values:

#### `EXPO_PUBLIC_SUPABASE_URL`
- Your Supabase project URL
- Format: `https://your-project-ref.supabase.co`
- Find in: Supabase Dashboard → Settings → API → Project URL

#### `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Your Supabase anonymous/public key
- Find in: Supabase Dashboard → Settings → API → anon/public key

#### `EXPO_PUBLIC_URL`
- Your production website URL
- Example: `https://your-site.netlify.app` or your custom domain

#### Google OAuth (if using)
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`
- `EXPO_PUBLIC_GOOGLE_IOS_SCHEME`

#### Mapbox (if using)
- `EXPO_PUBLIC_MAPBOX_TOKEN`
- `EXPO_PUBLIC_MAPBOX_API_URL` (optional override)

### 4. Preview Environment Overrides

To keep the `preview` branch completely isolated from production, duplicate the required secrets with a `PREVIEW_` prefix. These values should point to your preview Supabase project, Netlify site, and any preview-specific OAuth/Mapbox credentials.

| Secret | Purpose |
| --- | --- |
| `PREVIEW_EXPO_PUBLIC_SUPABASE_URL` | Preview Supabase project URL |
| `PREVIEW_EXPO_PUBLIC_SUPABASE_ANON_KEY` | Preview Supabase anon key |
| `PREVIEW_EXPO_PUBLIC_URL` | Preview web base URL |
| `PREVIEW_EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | Preview Google OAuth web client |
| `PREVIEW_EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | Preview Google OAuth iOS client |
| `PREVIEW_EXPO_PUBLIC_GOOGLE_IOS_SCHEME` | Preview custom URL scheme |
| `PREVIEW_EXPO_PUBLIC_MAPBOX_TOKEN` | Preview Mapbox token |
| `PREVIEW_EXPO_PUBLIC_MAPBOX_API_URL` | Preview Mapbox API URL override |
| `PREVIEW_NETLIFY_SITE_ID` | Dedicated Netlify site for preview deploys |
| `PREVIEW_NETLIFY_AUTH_TOKEN` | (Optional) Netlify access token scoped to the preview site |
| `PREVIEW_SUPABASE_ACCESS_TOKEN` | Supabase access token for preview |
| `PREVIEW_SUPABASE_PROJECT_ID` | Preview Supabase project ref |

> ⚠️ The GitHub Action intentionally fails for the `preview` branch when these secrets are missing. Configure them before pushing to avoid accidentally deploying preview builds into production infrastructure.

## 🔧 Adding Secrets to GitHub

### Via GitHub Web Interface

1. **Navigate to your repository** on GitHub
2. Click **Settings** (top menu)
3. Click **Secrets and variables** → **Actions** (left sidebar)
4. Click **New repository secret**
5. Add each secret:
   - **Name:** Enter the secret name (e.g., `NETLIFY_AUTH_TOKEN`)
   - **Value:** Paste the secret value
   - Click **Add secret**
6. Repeat for all secrets

### Via GitHub CLI (Alternative)

```bash
# Netlify secrets
gh secret set NETLIFY_AUTH_TOKEN
gh secret set NETLIFY_SITE_ID
gh secret set PREVIEW_NETLIFY_AUTH_TOKEN   # optional if sharing the same token
gh secret set PREVIEW_NETLIFY_SITE_ID

# Supabase secrets
gh secret set SUPABASE_ACCESS_TOKEN
gh secret set SUPABASE_PROJECT_ID
gh secret set PREVIEW_SUPABASE_ACCESS_TOKEN
gh secret set PREVIEW_SUPABASE_PROJECT_ID

# App environment variables
gh secret set EXPO_PUBLIC_SUPABASE_URL
gh secret set EXPO_PUBLIC_SUPABASE_ANON_KEY
gh secret set EXPO_PUBLIC_URL
gh secret set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
gh secret set EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
gh secret set EXPO_PUBLIC_GOOGLE_IOS_SCHEME
gh secret set EXPO_PUBLIC_MAPBOX_TOKEN
gh secret set EXPO_PUBLIC_MAPBOX_API_URL

# Preview overrides
gh secret set PREVIEW_EXPO_PUBLIC_SUPABASE_URL
gh secret set PREVIEW_EXPO_PUBLIC_SUPABASE_ANON_KEY
gh secret set PREVIEW_EXPO_PUBLIC_URL
gh secret set PREVIEW_EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
gh secret set PREVIEW_EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
gh secret set PREVIEW_EXPO_PUBLIC_GOOGLE_IOS_SCHEME
gh secret set PREVIEW_EXPO_PUBLIC_MAPBOX_TOKEN
gh secret set PREVIEW_EXPO_PUBLIC_MAPBOX_API_URL
```

## 📝 Netlify Site Setup (Simplified)

Good news! Your project already has a `netlify.toml` configured, so setup is much simpler.

### 1. Get Your Netlify Site ID

**If you already have a site:**
1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Select your site
3. Go to **Site settings** → **General** → **Site details**
4. Copy the **Site ID** (e.g., `ce335a05-285b-4e5b-84f9-5da31a6cdf6f`)

**If you need to create a site:**
1. Go to [Netlify](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect to GitHub and select your repository
4. **Important:** Choose "Deploy without building" or skip build settings
5. Your `netlify.toml` will be automatically detected
6. Copy the Site ID from Site settings

### 2. What netlify.toml Provides

Your `netlify.toml` already configures:
- ✅ Build settings (deploys pre-built files from GitHub Actions)
- ✅ Publish directory (`apps/expo/dist`)
- ✅ SPA routing redirects
- ✅ Security headers
- ✅ Caching strategy
- ✅ Production/staging contexts

**No manual Netlify configuration needed!**

## 🗄️ Supabase Project Setup

### 1. Link Local Project to Production

```bash
cd packages/supabase
pnpx supabase link --project-ref YOUR-PROJECT-REF
pnpx supabase db remote --status
cd ../..
```

### 2. Create Production Environment File

Create `.env.production` in project root:

```bash
# Supabase Production
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SECRET=your-service-role-key

# App URL
EXPO_PUBLIC_URL=https://your-production-domain.com

# OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-client-id
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id
EXPO_PUBLIC_GOOGLE_IOS_SCHEME=com.yourapp.scaffald

# Mapbox
EXPO_PUBLIC_MAPBOX_TOKEN=your-token

# Database (for local seeding scripts)
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
```

**⚠️ Important:** Never commit `.env.production` to git!

## ✅ Verification Checklist

### GitHub Secrets
- [ ] `NETLIFY_AUTH_TOKEN` set
- [ ] `NETLIFY_SITE_ID` set
- [ ] `PREVIEW_NETLIFY_SITE_ID` set
- [ ] `SUPABASE_ACCESS_TOKEN` set (optional)
- [ ] `SUPABASE_PROJECT_ID` set (optional)
- [ ] `PREVIEW_SUPABASE_PROJECT_ID` set (optional)
- [ ] All `EXPO_PUBLIC_*` variables set
- [ ] All `PREVIEW_EXPO_PUBLIC_*` variables set

### Netlify
- [ ] Site created
- [ ] Site ID copied
- [ ] Auth token generated
- [ ] Production branch set to `production`
- [ ] Automatic builds disabled (GitHub Actions handles it)

### Supabase
- [ ] Project created
- [ ] Local project linked
- [ ] `.env.production` created
- [ ] Access token generated (for Edge Functions)

## 🚀 Testing the Setup

### 1. Test GitHub Actions → Netlify

```bash
# Make a small change
echo "# Test deployment" >> README.md
git add README.md
git commit -m "test: verify deployment pipeline"
git push origin production
```

Watch the GitHub Actions workflow:
```
https://github.com/YOUR-USERNAME/SCF-Neue/actions
```

### 2. Verify Netlify Deployment

1. Check GitHub Actions logs for "Deploy to Netlify" step
2. Look for deployment URL in logs
3. Visit your Netlify site
4. Verify the site is live

### 3. Test Edge Functions Deployment

If you configured Supabase secrets:

1. Check GitHub Actions logs for "Deploy Edge Functions" step
2. Go to Supabase Dashboard → Edge Functions
3. Verify functions are deployed (trpc, job-import, news)

## 🔍 Troubleshooting

### "Netlify deployment failed"

**Check:**
- `NETLIFY_AUTH_TOKEN` is correct
- `NETLIFY_SITE_ID` is correct
- Token has deploy permissions
- Site exists in Netlify

**Fix:**
1. Regenerate Netlify access token
2. Update GitHub secret
3. Re-run workflow

### "Edge Functions deployment failed"

**Check:**
- `SUPABASE_ACCESS_TOKEN` is correct
- `SUPABASE_PROJECT_ID` is correct
- Token has function deployment permissions

**Fix:**
1. Ensure Supabase project is linked locally
2. Regenerate access token if needed
3. The workflow has `continue-on-error: true` so it won't fail the entire deployment

### "Missing environment variables"

**Check:**
- All required `EXPO_PUBLIC_*` secrets are set in GitHub
- Secret names match exactly (case-sensitive)
- No typos in secret names

**Fix:**
1. Review list of required secrets above
2. Add missing secrets to GitHub
3. Re-run workflow

## 📊 Deployment Flow Summary

```
Developer pushes to production branch
          ↓
GitHub Actions triggered
          ↓
Install dependencies & build packages
          ↓
Build web app (with secrets as env vars)
          ↓
Upload artifacts
          ↓
Deploy Edge Functions to Supabase (if configured)
          ↓
Deploy to Netlify (using auth token)
          ↓
✅ Production live!
```

## 🎉 Next Steps

After secrets are configured:

1. **Test the pipeline:**
   ```bash
   git push origin production
   ```

2. **Deploy database:**
   ```bash
   pnpm deploy:prod:db
   ```

3. **Verify everything:**
   ```bash
   pnpm deploy:verify:prod
   ```

4. **Monitor:**
   - GitHub Actions: Build logs
   - Netlify: Deployment logs
   - Supabase: Function logs

## 🔗 Quick Links

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Netlify Deploy Tokens](https://docs.netlify.com/cli/get-started/#obtain-a-token-via-the-command-line)
- [Supabase Access Tokens](https://supabase.com/docs/guides/cli/managing-environments#access-tokens)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
