# SCF-Neue Deployment Documentation

## Overview

This directory contains comprehensive deployment documentation for the SCF-Neue Expo web application. The project has been successfully migrated from a Next.js + Expo hybrid stack to a pure Expo-based architecture with production deployment capabilities.

## Quick Start

### Deploy to Production

```bash
# Using the automated deployment script (recommended)
yarn deploy:prod

# Or using direct commands
yarn deploy:web
```

### Deploy to Preview

```bash
# Using the automated deployment script
yarn deploy --preview

# Or using direct commands
yarn deploy:preview
```

## Project Status

✅ **Migration Complete**: Successfully migrated from Next.js + Expo to pure Expo architecture  
✅ **Build System**: Optimized for Expo web bundling (6.78 MB bundle)  
✅ **Environment Configuration**: Production and development environments configured  
✅ **Deployment Pipeline**: Automated deployment scripts and EAS configuration  
✅ **Documentation**: Comprehensive deployment guides and troubleshooting  

## Architecture

### Current Stack
- **Frontend**: Expo Router + React Native Web
- **UI Framework**: Tamagui + Bento components
- **Backend**: Supabase + tRPC
- **Build System**: Metro bundler
- **Deployment**: Expo hosting via EAS Build

### Key Features
- Cross-platform (web + native) from single codebase
- Unified authentication system
- Production-ready build pipeline
- Automated deployment scripts
- Environment-specific configurations

## Files in This Directory

### [expo-web-hosting-guide.md](./expo-web-hosting-guide.md)
Comprehensive guide covering:
- Prerequisites and setup
- Environment variable configuration
- Deployment commands and processes
- Custom domain configuration
- Monitoring and troubleshooting
- Security considerations
- Performance optimization

## Deployment Scripts

### Automated Script: `scripts/deploy.sh`
- **Location**: `scripts/deploy.sh`
- **Usage**: `yarn deploy` or `yarn deploy:prod`
- **Features**:
  - Pre-deployment validation
  - Code quality checks
  - Local build testing
  - Environment-specific deployments
  - Comprehensive error handling
  - Post-deployment guidance

### Package.json Scripts
```bash
yarn deploy          # Deploy to production (default)
yarn deploy:prod     # Deploy to production (explicit)
yarn deploy --preview # Deploy to preview environment
yarn build:web       # Build locally for testing
yarn web:serve       # Serve built files locally
```

## Environment Configuration

### Development
- **File**: `.env`
- **URLs**: `localhost:8081`, `localhost:54321`
- **Purpose**: Local development and testing

### Production
- **File**: `.env.production`
- **URLs**: Production domains (to be configured)
- **Purpose**: Live production deployment

## Build Information

### Current Build Stats
- **Bundle Size**: 6.78 MB (optimized)
- **Assets**: 23 static assets (fonts, icons, images)
- **Build Time**: ~5 seconds
- **Output**: `apps/expo/dist/`

### Optimization Opportunities
- Code splitting for larger applications
- Asset optimization
- Lazy loading implementation
- Bundle analysis and tree shaking

## Deployment Process

1. **Pre-deployment**
   - Update production environment variables
   - Run code quality checks (`yarn check`)
   - Test build locally (`yarn build:web`)

2. **Deployment**
   - Run deployment script (`yarn deploy:prod`)
   - Monitor build progress
   - Verify successful deployment

3. **Post-deployment**
   - Test deployed application
   - Verify authentication flows
   - Check API connectivity
   - Monitor for errors

## Monitoring & Maintenance

### Build Monitoring
- Track build times and bundle sizes
- Monitor for build warnings/errors
- Review asset optimization opportunities

### Application Monitoring
- Web vitals and performance metrics
- JavaScript error tracking
- API response time monitoring
- User authentication flow monitoring

### Updates
- Use Expo's over-the-air update system
- Test updates in preview environment first
- Monitor update adoption rates

## Troubleshooting

### Common Issues
1. **Environment Variables**: Ensure `.env.production` is configured
2. **OAuth Configuration**: Verify redirect URIs for production domains
3. **Build Failures**: Check TypeScript errors and dependencies
4. **Deployment Errors**: Review EAS build logs

### Debug Commands
```bash
# Check build status
eas build:list

# View specific build logs
eas build:view [build-id]

# Check project configuration
expo config

# Test local build
yarn build:web
```

## Security Considerations

- Production environment variables are not committed to version control
- OAuth providers configured for production domains
- API keys and secrets properly secured
- Regular security dependency updates

## Support & Resources

### Documentation
- [Expo Documentation](https://docs.expo.dev/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Hosting Documentation](https://docs.expo.dev/distribution/publishing-websites/)

### Project-Specific
- See `expo-web-hosting-guide.md` for detailed deployment instructions
- Check `scripts/deploy.sh` for automated deployment options
- Review `.env.production` for environment variable templates

## Next Steps

With the deployment pipeline now established, consider these optimization areas:

1. **Performance Optimization**: Bundle analysis and code splitting
2. **Mobile App Store Deployment**: Configure EAS Build for iOS/Android
3. **CI/CD Integration**: Automate deployments via GitHub Actions
4. **Monitoring Setup**: Implement comprehensive application monitoring
5. **Testing Infrastructure**: Add automated testing for deployment pipeline

---

**Last Updated**: December 2024  
**Status**: Production Ready ✅
