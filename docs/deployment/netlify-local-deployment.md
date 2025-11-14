# Netlify Local Deployment Guide

This guide explains how to deploy your web app directly to Netlify from your local machine, bypassing GitHub Actions.

## 🎯 When to Use Local Deployment

- **Quick testing** - Test changes without pushing to GitHub
- **Emergency deploys** - When GitHub Actions is down or slow
- **Development iterations** - Rapid deployment cycles during development
- **Preview deployments** - Create preview URLs for stakeholders

## 📋 Prerequisites

1. **Netlify CLI** installed globally:
   ```bash
   npm install -g netlify-cli
   ```

2. **Netlify Authentication**:
   ```bash
   netlify login
   ```

3. **.env.production** file with production credentials

## 🚀 Deployment Methods

### Method 1: Interactive Deployment (Recommended)

Use the interactive deployment script to deploy Netlify along with other components:

```bash
pnpm prod
```

When prompted, select option `4` for Netlify deployment. You'll then be asked to choose:
- **Direct Netlify deployment** (local build) - Choose preview or production
- **GitHub Actions trigger** (remote build) - Triggers GitHub Actions workflow

This method allows you to deploy Netlify along with migrations, functions, or seed in a single workflow.

**Aliases:**
- `pnpm deploy` → `pnpm prod`

### Method 2: Legacy Commands (Backward Compatibility)

#### Preview Deployment
```bash
pnpm deploy:netlify
```

This will:
- Build all workspace packages
- Build the web application
- Deploy to Netlify (creates a preview URL)
- Takes ~5-10 minutes depending on caching

#### Production Deployment
```bash
pnpm deploy:netlify:prod
```

This will:
- Build and deploy to production URL (https://preview.scaffald.com)
- **⚠️ Use with caution** - deploys directly to production

**Note:** These commands are kept for backward compatibility. The interactive `pnpm prod` script is recommended for new deployments.

## 📊 Deployment Process

The script follows these steps:

1. **Pre-flight Checks**
   - Verifies you're in the project root
   - Checks for .env.production file
   - Verifies Netlify CLI is installed
   - Warns about uncommitted changes

2. **Build Phase**
   - Sources .env.production
   - Builds workspace packages (UI, Core, Schemas)
   - Builds web application
   - Verifies dist/ directory exists

3. **Deploy Phase**
   - Uploads to Netlify
   - Provides deployment URL
   - Shows deployment summary

## 🔍 Troubleshooting

### Issue: "Netlify CLI not found"

**Solution:**
```bash
npm install -g netlify-cli
netlify login
```

### Issue: ".env.production not found"

**Solution:**
Create .env.production with your production credentials:
```bash
cp .env.template .env.production
# Edit .env.production with production values
```

### Issue: "Build failed"

**Solution:**
1. Check for TypeScript errors:
   ```bash
   pnpm typecheck
   ```

2. Check for linting issues:
   ```bash
   pnpm lint:fix
   ```

3. Try a clean build:
   ```bash
   pnpm reset
   pnpm install
   pnpm build
   ```

### Issue: "Deploy takes too long"

**First deployment** (~15-18 minutes):
- No cached dependencies
- All packages build from scratch

**Subsequent deployments** (~5-10 minutes):
- Cached dependencies
- Faster package builds

**Speed up deployments:**
```bash
# Skip unchanged packages
pnpm build --filter='[HEAD^1]'
```

## 📈 Comparing Deployment Methods

| Method | Time | Use Case |
|--------|------|----------|
| **pnpm deploy** | 10-15 min | Full production deployment (Supabase + Web) |
| **pnpm deploy:netlify** | 5-10 min | Quick web-only preview |
| **pnpm deploy:netlify:prod** | 5-10 min | Web-only production |
| **GitHub Actions** | 10-15 min | Automated, triggered by push |

## 🔐 Environment Variables

The script uses variables from `.env.production`:

```bash
# Required for build
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_URL

# Mapbox
EXPO_PUBLIC_MAPBOX_TOKEN

# OAuth
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
EXPO_PUBLIC_GOOGLE_IOS_SCHEME
```

## 💡 Best Practices

### 1. Test Locally First
```bash
# Build and test locally
pnpm web:build
cd apps/expo
npx serve dist
```

### 2. Use Preview for Testing
```bash
# Always test with preview first
pnpm deploy:netlify

# Then deploy to production
pnpm deploy:netlify:prod
```

### 3. Check for Issues
```bash
# Run checks before deploying
pnpm check
pnpm build
```

### 4. Monitor Deployment
- Watch terminal output for errors
- Check Netlify dashboard for deployment status
- Verify site loads correctly after deployment

## 🆘 Getting Help

If you encounter issues:

1. Check this documentation
2. Review script output for error messages
3. Check [Netlify Status](https://www.netlifystatus.com/)
4. Review [Netlify Documentation](https://docs.netlify.com/)

## 📚 Related Documentation

- [GitHub Actions + Netlify Setup](./github-actions-netlify-setup.md)
- [Production Deployment](./PRODUCTION_DEPLOYMENT.md)
- [Supabase Cloud Setup](./supabase-cloud-setup.md)
