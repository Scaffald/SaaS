# Phase 1.3: Deployment Strategy Planning

## Overview
This document outlines the deployment migration strategy from Next.js on Vercel to Expo web hosting, including rollback plans and zero-downtime deployment approaches.

## Current Deployment Setup

### Next.js on Vercel
- **Domain**: Likely using custom domain on Vercel
- **Environment Variables**: Configured in Vercel dashboard
- **Build Command**: `yarn build` (Next.js build)
- **Deploy Triggers**: Git push to main branch
- **Preview Deployments**: Branch-based previews

### Target: Expo Web Deployment
- **Build Output**: Static files from `expo export --platform web`
- **Hosting Options**: Multiple options available (see below)
- **Environment Variables**: Need to migrate configuration
- **Deploy Process**: Updated build and deploy pipeline

## Deployment Options Analysis

### Option 1: Stay on Vercel (Recommended)
**Pros:**
- ✅ Minimal infrastructure changes
- ✅ Keep existing domain and SSL setup
- ✅ Familiar deployment pipeline
- ✅ Easy environment variable migration
- ✅ Branch previews continue to work
- ✅ Edge network and CDN included

**Cons:**
- ⚠️ Need to update build configuration
- ⚠️ Static hosting only (no serverless functions)

**Migration Steps:**
1. Update `vercel.json` configuration
2. Change build command to Expo web build
3. Update output directory configuration
4. Test deployment on preview branch

### Option 2: Netlify
**Pros:**
- ✅ Excellent static site hosting
- ✅ Built-in form handling
- ✅ Edge functions for API needs
- ✅ Branch-based deployments
- ✅ Great developer experience

**Cons:**
- ⚠️ Domain migration required
- ⚠️ DNS changes needed
- ⚠️ Learning curve for team

### Option 3: Expo Application Services (EAS)
**Pros:**
- ✅ Integrated with Expo ecosystem
- ✅ Unified mobile and web deployments
- ✅ Preview deployments
- ✅ Built for Expo apps

**Cons:**
- ⚠️ Newer service, less mature
- ⚠️ Limited customization options
- ⚠️ Domain migration required

## Recommended Migration Plan: Vercel

### Phase 1: Preparation
```json
// vercel.json (new configuration)
{
  "buildCommand": "cd apps/expo && yarn web:build",
  "outputDirectory": "apps/expo/dist",
  "framework": null,
  "installCommand": "yarn install",
  "env": {
    "EXPO_PUBLIC_SUPABASE_URL": "@expo_public_supabase_url",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "@expo_public_supabase_anon_key"
  },
  "build": {
    "env": {
      "EXPO_PUBLIC_SUPABASE_URL": "@expo_public_supabase_url",
      "EXPO_PUBLIC_SUPABASE_ANON_KEY": "@expo_public_supabase_anon_key"
    }
  }
}
```

### Phase 2: Environment Variables Migration
Current Next.js environment variables need to be prefixed with `EXPO_PUBLIC_` for client-side access:

```bash
# Current (Next.js)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...

# Target (Expo)
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### Phase 3: Build Pipeline Updates
```bash
# Current Next.js build
yarn workspace next-app build

# New Expo web build
yarn workspace expo-app web:build
```

### Phase 4: Testing Strategy
1. **Preview Deployment**: Deploy to Vercel preview URL
2. **Functionality Testing**: Test all routes and features
3. **Performance Testing**: Compare with current Next.js deployment
4. **SEO Testing**: Verify meta tags and social sharing
5. **Mobile Testing**: Test responsive design and mobile experience

## Zero-Downtime Migration Strategy

### Option A: Blue-Green Deployment
1. **Setup**: Create new Vercel project for Expo app
2. **Test**: Deploy and test on temporary domain
3. **Switch**: Update DNS to point to new deployment
4. **Rollback**: Keep old deployment as backup

### Option B: Branch-Based Migration
1. **Branch**: Create `expo-migration` branch
2. **Configure**: Update Vercel to deploy from this branch
3. **Test**: Use preview URL for testing
4. **Merge**: Merge to main when ready
5. **Deploy**: Automatic deployment to production

### Option C: Gradual Migration (Advanced)
1. **Subdomain**: Deploy Expo app to subdomain (e.g., `new.yourdomain.com`)
2. **Testing**: Extensive testing on subdomain
3. **Traffic Split**: Use Vercel edge functions to split traffic
4. **Full Migration**: Switch all traffic when confident

## API Routes Migration

### Current API Routes
- `apps/next/pages/api/news.ts` - News API endpoint

### Migration Options

#### Option 1: Supabase Edge Functions (Recommended)
```typescript
// supabase/functions/news/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Migrate news API logic here
  return new Response(
    JSON.stringify({ news: "data" }),
    { headers: { "Content-Type": "application/json" } },
  )
})
```

#### Option 2: Vercel Serverless Functions
```typescript
// api/news.ts (in separate Vercel project)
export default function handler(req, res) {
  // Migrate news API logic here
  res.status(200).json({ news: "data" })
}
```

#### Option 3: External API Service
- Deploy API routes to separate service (Railway, Render, etc.)
- Update client to call external API endpoints

## Environment Configuration

### Development Environment
```bash
# .env.local (for development)
EXPO_PUBLIC_SUPABASE_URL=http://localhost:54321
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

### Production Environment
```bash
# Vercel environment variables
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
EXPO_PUBLIC_API_URL=https://your-api-domain.com
```

## Rollback Plan

### Immediate Rollback (< 5 minutes)
1. **Vercel Dashboard**: Rollback to previous deployment
2. **DNS**: Revert DNS changes if made
3. **Monitoring**: Check all systems operational

### Extended Rollback (< 30 minutes)
1. **Git Revert**: Revert commits if needed
2. **Environment Variables**: Restore previous configuration
3. **API Endpoints**: Ensure API routes are functional
4. **Testing**: Verify all functionality restored

## Monitoring and Validation

### Pre-Migration Metrics
- [ ] Page load times
- [ ] Core Web Vitals scores
- [ ] Error rates
- [ ] User engagement metrics
- [ ] SEO rankings

### Post-Migration Validation
- [ ] All routes accessible
- [ ] Authentication flow working
- [ ] API integrations functional
- [ ] Performance metrics maintained or improved
- [ ] No increase in error rates

### Monitoring Tools
- **Vercel Analytics**: Built-in performance monitoring
- **Google Analytics**: User behavior tracking
- **Lighthouse CI**: Automated performance testing
- **Sentry**: Error tracking and monitoring
- **Uptime Monitoring**: Service availability tracking

## Timeline and Milestones

### Week 1: Preparation
- [ ] Create Vercel configuration
- [ ] Set up environment variables
- [ ] Configure build pipeline
- [ ] Create rollback procedures

### Week 2: Testing
- [ ] Deploy to preview environment
- [ ] Comprehensive functionality testing
- [ ] Performance benchmarking
- [ ] SEO validation
- [ ] Mobile testing

### Week 3: Migration
- [ ] Final testing and validation
- [ ] Stakeholder approval
- [ ] Production deployment
- [ ] Post-migration monitoring
- [ ] Documentation updates

## Success Criteria
- [ ] Zero downtime during migration
- [ ] All functionality preserved
- [ ] Performance maintained or improved
- [ ] SEO impact minimized
- [ ] Team comfortable with new deployment process
- [ ] Rollback plan tested and ready

## Risk Assessment

### High Risk
- **Domain/DNS Issues**: Could cause complete outage
- **Environment Variable Errors**: Could break authentication
- **Build Pipeline Failures**: Could prevent deployments

### Medium Risk
- **Performance Regression**: Could impact user experience
- **SEO Impact**: Could affect search rankings
- **API Integration Issues**: Could break functionality

### Low Risk
- **Minor UI Differences**: Easily fixable post-migration
- **Analytics Tracking**: Can be updated after migration

## Next Steps
1. Choose deployment option (recommend Vercel)
2. Create migration timeline
3. Set up preview environment for testing
4. Begin Phase 2: Code Migration planning
