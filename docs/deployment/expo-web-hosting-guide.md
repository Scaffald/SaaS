# Expo Web Hosting Deployment Guide

## Overview

This guide covers deploying the SCF-Neue Expo web application to production using Expo's hosting services and EAS Build.

## Prerequisites

- Expo CLI installed (`yarn global add @expo/cli`)
- EAS CLI installed (`yarn global add eas-cli`)
- Expo account with access to the project
- Production environment variables configured

## Project Configuration

### EAS Configuration

The project is configured with the following build profiles in `eas.json`:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "channel": "production"
    },
    "production-web": {
      "platform": "web",
      "channel": "production"
    }
  }
}
```

### Environment Variables

Production environment variables are configured in `.env.production`. Update the following values:

```bash
# Production URLs
EXPO_PUBLIC_URL=https://your-app-domain.com
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-production-supabase-anon-key

# Supabase Configuration
SUPABASE_AUTH_JWT_SECRET=your-production-jwt-secret-at-least-32-chars
SUPABASE_REDIRECT_URI=https://your-project-id.supabase.co/auth/v1/callback

# OAuth Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_SECRET=your-google-oauth-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_SECRET=your-apple-secret

# Mapbox Configuration
EXPO_PUBLIC_MAPBOX_TOKEN=your-production-mapbox-token
MAPBOX_DOWNLOADS_TOKEN=your-production-mapbox-downloads-token
```

## Deployment Commands

### Local Testing

Test the production build locally:

```bash
# Build for web
yarn build:web

# Serve locally (optional)
yarn web:serve
```

### Deploy to Expo Hosting

Deploy to production:

```bash
# Deploy production web build
yarn deploy:web

# Deploy preview build
yarn deploy:preview
```

### Manual EAS Commands

If you need to run EAS commands directly:

```bash
# From the apps/expo directory
cd apps/expo

# Build for web production
eas build --platform web --profile production-web

# Build for web preview
eas build --platform web --profile preview
```

## Build Output

The production build generates:

- **Bundle Size**: ~6.78 MB (optimized)
- **Assets**: 23 static assets including fonts and icons
- **Output Directory**: `apps/expo/dist/`

## Deployment Process

1. **Environment Setup**
   - Update `.env.production` with production values
   - Ensure all OAuth providers are configured for production domains

2. **Build & Test**
   - Run `yarn build:web` to test locally
   - Verify all functionality works with production environment

3. **Deploy**
   - Run `yarn deploy:web` to deploy to Expo hosting
   - Monitor build logs for any issues

4. **Verification**
   - Test the deployed application
   - Verify authentication flows work
   - Check API connectivity

## Custom Domain Configuration

To use a custom domain with Expo hosting:

1. **Configure DNS**
   - Add CNAME record pointing to Expo's hosting
   - Configure SSL certificate

2. **Update Environment Variables**
   - Update `EXPO_PUBLIC_URL` in `.env.production`
   - Update OAuth redirect URIs

3. **Redeploy**
   - Run deployment command again after DNS changes

## Monitoring & Maintenance

### Build Monitoring

- Monitor build times and bundle sizes
- Check for any build warnings or errors
- Review asset optimization opportunities

### Performance Monitoring

- Monitor web vitals and loading times
- Check for JavaScript errors in production
- Monitor API response times

### Updates

- Use Expo's update system for over-the-air updates
- Test updates in preview environment first
- Monitor update adoption rates

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**
   - Ensure `.env.production` is in the root directory
   - Verify `NODE_ENV=production` is set during build

2. **OAuth Issues**
   - Check redirect URIs match production domain
   - Verify client IDs are correct for production

3. **Build Failures**
   - Check for TypeScript errors
   - Verify all dependencies are installed
   - Review build logs for specific errors

### Debug Commands

```bash
# Check build status
eas build:list

# View build logs
eas build:view [build-id]

# Check project configuration
expo config
```

## Security Considerations

- Never commit production environment variables to version control
- Use Expo's secure environment variable storage
- Regularly rotate API keys and secrets
- Monitor for security vulnerabilities in dependencies

## Performance Optimization

- Bundle size is currently 6.78 MB - consider code splitting for larger apps
- Optimize images and assets
- Use lazy loading for non-critical components
- Monitor and optimize Core Web Vitals

## Support

For deployment issues:
- Check Expo documentation: https://docs.expo.dev/
- Review EAS Build documentation: https://docs.expo.dev/build/introduction/
- Contact Expo support for hosting-specific issues
