# GitHub Actions + Netlify Deployment Guide

This guide explains how to deploy your SCF-Neue web app using GitHub Actions for building and Netlify for hosting.

## 📋 Overview

**Problem**: Netlify's free tier has a 15-minute build timeout, but our monorepo takes 18+ minutes to build.

**Solution**: Build in GitHub Actions (30+ minute timeout) and deploy pre-built files to Netlify (< 1 minute).

## 🏗️ Architecture

```
GitHub Push → GitHub Actions (Build) → Netlify (Deploy)
     ↓              ↓                      ↓
   main         10-15 minutes          < 1 minute
                  + caching
```

## 🚀 Setup Steps

### Step 1: Get Netlify Credentials

#### 1.1 Install Netlify CLI

```bash
npm install -g netlify-cli
```

#### 1.2 Login to Netlify

```bash
netlify login
```

This opens your browser for authentication.

#### 1.3 Create Netlify Site

```bash
# In project root
netlify init
```

Follow the prompts:
- Choose "Create & configure a new site"
- Select your team
- Site name: `scf-neue` (or your preferred name)

#### 1.4 Get Site ID

```bash
netlify sites:list --json
```

Or find it in the Netlify dashboard URL:
```
https://app.netlify.com/sites/YOUR-SITE-ID/overview
```

#### 1.5 Get Auth Token

1. Go to: https://app.netlify.com/user/applications
2. Click "New access token"
3. Name it: "GitHub Actions Deploy"
4. Copy the token (save it somewhere safe!)

### Step 2: Configure GitHub Secrets

Go to your GitHub repository:
```
Settings → Secrets and variables → Actions → New repository secret
```

Add these secrets:

#### Required Secrets

| Secret Name | Value | Where to Get It |
|------------|-------|-----------------|
| `NETLIFY_AUTH_TOKEN` | `nfp_xxx...` | From Step 1.5 |
| `NETLIFY_SITE_ID` | `abc123-...` | From Step 1.4 |
| `EXPO_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Supabase Dashboard |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx...` | Supabase Dashboard |
| `EXPO_PUBLIC_URL` | `https://your-app.netlify.app` | Your production URL |

#### OAuth Secrets

| Secret Name | Value | Where to Get It |
|------------|-------|-----------------|
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Google Cloud Console |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Google Cloud Console |
| `EXPO_PUBLIC_GOOGLE_IOS_SCHEME` | `com.googleusercontent.apps.xxx` | Google Cloud Console |

#### Mapbox Secrets

| Secret Name | Value | Where to Get It |
|------------|-------|-----------------|
| `EXPO_PUBLIC_MAPBOX_TOKEN` | `pk.eyJ1xxx...` | Mapbox Dashboard |

### Step 3: Update Netlify Site Settings

In Netlify Dashboard:

#### 3.1 Build Settings
- **Base directory**: Leave empty
- **Build command**: `echo 'Using pre-built files from GitHub Actions'`
- **Publish directory**: `apps/expo/dist`

#### 3.2 Deploy Settings
- **Builds**: Disable automatic builds
- **Deploy contexts**: Enable for main branch only

#### 3.3 Environment Variables (Optional)
You can add environment variables in Netlify, but they're not needed since we build in GitHub Actions.

### Step 4: Test Deployment

#### 4.1 Test Locally First

```bash
# Make script executable
chmod +x scripts/build-production.sh

# Create .env.production with your production values
cp .env.template .env.production
# Edit .env.production with production values

# Run build
./scripts/build-production.sh
```

#### 4.2 Test Local Deploy

```bash
# Deploy to Netlify (preview)
netlify deploy --dir=apps/expo/dist

# If it looks good, deploy to production
netlify deploy --dir=apps/expo/dist --prod
```

#### 4.3 Push to GitHub

```bash
git add .
git commit -m "Add GitHub Actions deployment workflow"
git push origin main
```

GitHub Actions will automatically:
1. Detect the push
2. Build your app (10-15 minutes)
3. Deploy to Netlify (< 1 minute)
4. Comment on the commit with deploy preview URL

### Step 5: Monitor Deployment

#### View GitHub Actions

1. Go to your GitHub repo
2. Click "Actions" tab
3. Click on the running workflow
4. Watch the build progress

#### View Netlify Deploy

1. Go to Netlify Dashboard
2. Click on your site
3. View "Deploys" tab
4. See the deployment from GitHub Actions

## 📊 Workflow Behavior

### Main Branch (Production)
```
git push origin main
  ↓
GitHub Actions builds
  ↓
Deploys to production URL
```

### Staging Branch
```
git push origin staging
  ↓
GitHub Actions builds
  ↓
Deploys to staging URL
```

### Pull Requests
```
Create PR
  ↓
GitHub Actions builds
  ↓
Creates deploy preview
  ↓
Comments on PR with preview URL
```

## 🔧 Troubleshooting

### Build Fails in GitHub Actions

**Check the logs**:
```
GitHub → Actions → Click workflow → View logs
```

**Common issues**:
- Missing environment variables
- TypeScript errors
- Build timeout (increase timeout in workflow)

### Deploy Fails to Netlify

**Check**:
1. Netlify auth token is correct
2. Site ID is correct
3. `dist/` folder was created in build step

### Site Loads But Features Don't Work

**Check**:
1. Environment variables are set correctly
2. Supabase URL is reachable
3. OAuth credentials are for production domain
4. Browser console for errors

### Long Build Times

**Optimize**:
1. Check if caching is working
2. Review what packages are being rebuilt
3. Consider splitting workspace builds

## 📈 Performance Metrics

### Expected Build Times

| Stage | Time | Notes |
|-------|------|-------|
| Setup | 1-2 min | Install pnpm, Node, cache restore |
| Dependencies | 2-3 min | Cached after first run |
| Package Builds | 3-5 min | UI, Core, Schemas |
| Quality Checks | 1-2 min | TypeCheck, Lint |
| Web Build | 4-6 min | Expo export with Tamagui |
| Deploy | < 1 min | Upload to Netlify |
| **Total** | **10-15 min** | First run ~18 min, cached ~10 min |

### Cache Effectiveness

After the first build:
- Dependencies: 90% faster
- Package builds: 50% faster
- Overall: 40% faster

## 🎯 Best Practices

### 1. Branch Strategy

```
main → production deployment
staging → staging deployment
feature/* → preview deployments
```

### 2. Environment Management

```
.env.development → local development
.env.staging → staging environment
.env.production → production environment (not in git)
```

### 3. Rollback Strategy

If deployment fails:
```bash
# In Netlify Dashboard
Deploys → Previous deploy → Publish deploy
```

Or via CLI:
```bash
netlify rollback
```

### 4. Monitoring

Set up alerts for:
- Build failures
- Deploy failures
- Runtime errors (use Sentry or similar)

## 🔐 Security Checklist

- [ ] All secrets stored in GitHub Secrets
- [ ] `.env.production` not committed to git
- [ ] Production OAuth credentials configured
- [ ] Netlify security headers configured
- [ ] HTTPS enabled on custom domain
- [ ] CSP headers configured (if needed)

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Netlify Deployment Documentation](https://docs.netlify.com/site-deploys/overview/)
- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [Tamagui Optimization Guide](https://tamagui.dev/docs/guides/compiler-optimization)

## 🆘 Getting Help

If you encounter issues:

1. Check workflow logs in GitHub Actions
2. Check deploy logs in Netlify Dashboard
3. Review this documentation
4. Check the [troubleshooting section](#-troubleshooting)
5. Create an issue in the repository
