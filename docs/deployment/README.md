# SCF-Neue Production Deployment Guide

Complete guide for deploying SCF-Neue to production using Netlify (frontend) and Supabase (backend).

## 📚 Documentation Structure

This deployment documentation is organized into focused guides:

1. **[GitHub Actions + Netlify Setup](./github-actions-netlify-setup.md)** - Frontend deployment
2. **[Supabase Cloud Setup](./supabase-cloud-setup.md)** - Backend deployment
3. **[Quick Start](#-quick-start)** - Rapid deployment checklist (this document)

## 🎯 Quick Start

Follow this checklist to deploy from scratch in ~1 hour:

### Prerequisites (5 minutes)

- [ ] GitHub account with repository access
- [ ] Netlify account (free tier)
- [ ] Supabase account (free tier)
- [ ] Google Cloud Console access (for OAuth)
- [ ] Mapbox account (for maps)

### Phase 1: Supabase Setup (20 minutes)

Follow: [Supabase Cloud Setup Guide](./supabase-cloud-setup.md)

- [ ] Create Supabase project
- [ ] Link local project: `pnpm supa link --project-ref YOUR-REF`
- [ ] Push migrations: `pnpm supa db push`
- [ ] Deploy Edge Functions: `pnpm supa functions deploy trpc`
- [ ] Configure storage buckets
- [ ] Set up Google/Apple OAuth
- [ ] Generate production types: `pnpm supa:generate:remote`

**Save these values:**
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJxxx...
```

### Phase 2: Netlify Setup (15 minutes)

Follow: [GitHub Actions + Netlify Setup Guide](./github-actions-netlify-setup.md)

- [ ] Install Netlify CLI: `npm install -g netlify-cli`
- [ ] Login: `netlify login`
- [ ] Create site: `netlify init`
- [ ] Get site ID and auth token
- [ ] Configure Netlify build settings

**Save these values:**
```
NETLIFY_SITE_ID=abc123-...
NETLIFY_AUTH_TOKEN=nfp_xxx...
```

### Phase 3: GitHub Configuration (10 minutes)

- [ ] Add all secrets to GitHub repository
- [ ] Verify workflow file exists: `.github/workflows/deploy-web.yml`
- [ ] Verify netlify.toml exists
- [ ] Push to main branch
- [ ] Watch GitHub Actions build

**Required GitHub Secrets:**
```
NETLIFY_AUTH_TOKEN
NETLIFY_SITE_ID
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_URL
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID
EXPO_PUBLIC_GOOGLE_IOS_SCHEME
EXPO_PUBLIC_MAPBOX_TOKEN
```

### Phase 4: OAuth Configuration (10 minutes)

#### Google OAuth
1. Go to Google Cloud Console
2. Add production URLs to authorized origins
3. Add Supabase callback URL to authorized redirects

#### Apple Sign In (if using)
1. Configure Apple Developer portal
2. Update redirect URIs
3. Generate new key if needed

### Phase 5: Testing (15 minutes)

- [ ] Visit production URL
- [ ] Test user registration
- [ ] Test Google/Apple sign in
- [ ] Test job discovery
- [ ] Test application submission
- [ ] Test file uploads
- [ ] Check browser console for errors

## 📋 Environment Variables Reference

### .env.production Template

Create `.env.production` with these values:

```bash
# App Configuration
NODE_ENV=production
APP_ENV=production
EXPO_PUBLIC_URL=https://your-domain.netlify.app

# Supabase (from Supabase Dashboard)
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
DATABASE_URL=postgresql://postgres:password@...
SUPABASE_AUTH_JWT_SECRET=your-jwt-secret
SUPABASE_REDIRECT_URI=https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback

# Google OAuth (from Google Cloud Console)
EXPO_PUBLIC_GOOGLE_IOS_SCHEME=com.googleusercontent.apps.YOUR-ID
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=YOUR-ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=YOUR-WEB-ID.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_MAPS_KEY=YOUR-GOOGLE-MAPS-KEY
GOOGLE_SECRET=GOCSPX-YOUR-SECRET

# Apple Sign In (from Apple Developer)
APPLE_CLIENT_ID=your-apple-client-id
APPLE_SECRET=your-apple-secret

# Mapbox (from Mapbox Dashboard)
EXPO_PUBLIC_MAPBOX_TOKEN=pk.YOUR-TOKEN

# Build Optimizations
EXPO_USE_FAST_REFRESH=false
TAMAGUI_DISABLE_WARN_DYNAMIC_LOAD=1
```

## 🔄 Deployment Workflow

### Automatic Deployment

```
Push to main branch
  ↓
GitHub Actions triggers
  ↓
10-15 minute build
  ↓
Deploy to Netlify
  ↓
Production live!
```

### Manual Deployment

```bash
# 1. Build locally
chmod +x scripts/build-production.sh
./scripts/build-production.sh

# 2. Deploy to Netlify
netlify deploy --dir=apps/expo/dist --prod
```

## 🚨 Common Issues

### Build Timeout on Netlify
✅ **Solved** - Using GitHub Actions for builds

### OAuth Redirects Fail
- Check redirect URLs match exactly
- Include https:// protocol
- Verify in both OAuth provider and Supabase

### Database Connection Errors
- Verify Supabase URL and keys
- Check RLS policies
- Ensure migrations applied

### Missing Environment Variables
- Double-check GitHub Secrets
- Verify variable names match exactly
- Check for typos in URLs/keys

## 📊 Cost Estimate

### Free Tier Limits

**Supabase Free Tier:**
- 500 MB database
- 1 GB file storage
- 2 GB bandwidth
- Unlimited API requests

**Netlify Free Tier:**
- 100 GB bandwidth
- 300 build minutes/month
- Unlimited sites

**GitHub Actions Free Tier:**
- 2,000 minutes/month (public repos unlimited)

### When to Upgrade

Upgrade when you exceed:
- Database size > 500 MB
- Monthly bandwidth > 100 GB
- Build minutes > 300/month

## 🔐 Security Checklist

- [ ] All secrets in GitHub Secrets (not in code)
- [ ] `.env.production` in `.gitignore`
- [ ] HTTPS enabled on custom domain
- [ ] Supabase RLS policies active
- [ ] OAuth credentials for production only
- [ ] Database backups configured
- [ ] Function secrets set in Supabase
- [ ] Security headers configured in netlify.toml

## 📈 Monitoring

### Set Up Monitoring

1. **Supabase Dashboard**
   - Database usage
   - API requests
   - Edge Function logs
   - Storage usage

2. **Netlify Dashboard**
   - Deploy status
   - Bandwidth usage
   - Function logs

3. **GitHub Actions**
   - Build success/failure
   - Build duration
   - Artifact size

### Recommended Alerts

- Failed deployments
- Database size > 80%
- API errors > threshold
- Build time > 20 minutes

## 🔄 Rollback Procedures

### Frontend Rollback

```bash
# In Netlify Dashboard
Deploys → Previous deploy → Publish deploy
```

Or via CLI:
```bash
netlify rollback
```

### Database Rollback

```bash
# Restore from backup (Supabase Dashboard)
Database → Backups → Restore point-in-time
```

### Function Rollback

```bash
# Redeploy previous version
git checkout <previous-commit>
pnpm supa functions deploy trpc
```

## 📚 Additional Resources

- [Expo Web Documentation](https://docs.expo.dev/workflow/web/)
- [Supabase Production Guide](https://supabase.com/docs/guides/platform/going-into-prod)
- [Netlify Documentation](https://docs.netlify.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🆘 Support

If you need help:

1. Review detailed guides:
   - [GitHub Actions + Netlify Setup](./github-actions-netlify-setup.md)
   - [Supabase Cloud Setup](./supabase-cloud-setup.md)

2. Check troubleshooting sections in each guide

3. Review logs:
   - GitHub Actions workflow logs
   - Netlify deploy logs
   - Supabase function logs

4. Create an issue in the repository with:
   - Error messages
   - Steps to reproduce
   - Environment details

## ✅ Post-Deployment Checklist

- [ ] Production URL accessible
- [ ] SSL certificate active
- [ ] User registration works
- [ ] Google/Apple OAuth works
- [ ] Job discovery functional
- [ ] Applications can be submitted
- [ ] File uploads working
- [ ] Maps displaying correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Performance acceptable
- [ ] SEO meta tags present
- [ ] Analytics configured (if applicable)
- [ ] Error tracking setup (if applicable)
- [ ] Monitoring alerts configured
- [ ] Team has access to dashboards
- [ ] Documentation updated
- [ ] Staging environment configured (optional)

## 🎉 Success!

Your SCF-Neue application is now deployed to production!

Next steps:
- Monitor initial user feedback
- Set up analytics
- Configure domain (if needed)
- Enable staging environment
- Set up CI/CD for other branches
