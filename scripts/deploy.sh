#!/bin/bash

# SCF-Neue Expo Web Deployment Script
# This script handles the complete deployment process for the Expo web application

set -e  # Exit on any error

echo "🚀 Starting SCF-Neue Expo Web Deployment"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if required tools are installed
if ! command -v eas &> /dev/null; then
    echo "❌ Error: EAS CLI is not installed. Install with: yarn global add eas-cli"
    exit 1
fi

# Parse command line arguments
ENVIRONMENT="production"
PROFILE="production-web"

while [[ $# -gt 0 ]]; do
    case $1 in
        --preview)
            ENVIRONMENT="preview"
            PROFILE="preview"
            shift
            ;;
        --production)
            ENVIRONMENT="production"
            PROFILE="production-web"
            shift
            ;;
        --help)
            echo "Usage: $0 [--preview|--production]"
            echo ""
            echo "Options:"
            echo "  --preview     Deploy to preview environment"
            echo "  --production  Deploy to production environment (default)"
            echo "  --help        Show this help message"
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

echo "📋 Deployment Configuration:"
echo "   Environment: $ENVIRONMENT"
echo "   Profile: $PROFILE"
echo ""

# Check if production environment file exists
if [ "$ENVIRONMENT" = "production" ] && [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: .env.production file not found"
    echo "   Make sure to configure production environment variables"
    echo ""
fi

# Run code quality checks
echo "🔍 Running code quality checks..."
if ! yarn check; then
    echo "❌ Code quality checks failed. Please fix issues before deploying."
    exit 1
fi
echo "✅ Code quality checks passed"
echo ""

# Build locally first to catch any issues
echo "🏗️  Building web application locally..."
if ! yarn build:web; then
    echo "❌ Local build failed. Please fix build issues before deploying."
    exit 1
fi
echo "✅ Local build successful"
echo ""

# Deploy using EAS
echo "🚀 Deploying to Expo hosting..."
echo "   This may take several minutes..."
echo ""

cd apps/expo

if [ "$ENVIRONMENT" = "production" ]; then
    NODE_ENV=production eas build --platform web --profile $PROFILE --non-interactive
else
    eas build --platform web --profile $PROFILE --non-interactive
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "========================================"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Test the deployed application"
    echo "   2. Verify authentication flows"
    echo "   3. Check API connectivity"
    echo "   4. Monitor for any errors"
    echo ""
    echo "📊 Build Information:"
    echo "   Environment: $ENVIRONMENT"
    echo "   Profile: $PROFILE"
    echo "   Bundle Size: ~6.78 MB"
    echo ""
    echo "🔗 Useful Commands:"
    echo "   Check build status: eas build:list"
    echo "   View build logs: eas build:view [build-id]"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo "========================================"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Check build logs for specific errors"
    echo "   2. Verify environment variables are set correctly"
    echo "   3. Ensure all dependencies are installed"
    echo "   4. Check EAS project configuration"
    echo ""
    echo "📋 Debug Commands:"
    echo "   View build logs: eas build:view [build-id]"
    echo "   Check project config: expo config"
    echo "   List recent builds: eas build:list"
    echo ""
    exit 1
fi
