#!/bin/bash

# SCF-Neue Netlify Deployment Script
# Deploys the Expo web app to Netlify

set -e  # Exit on any error

echo "🚀 Starting Netlify Deployment"
echo "========================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Check if Netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "❌ Error: Netlify CLI is not installed"
    echo "   Install with: pnpm add -D netlify-cli"
    echo "   Or globally: pnpm add -g netlify-cli"
    exit 1
fi

# Parse command line arguments
DEPLOY_PROD=true
SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --preview)
            DEPLOY_PROD=false
            shift
            ;;
        --production)
            DEPLOY_PROD=true
            shift
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --preview      Deploy as preview (not production)"
            echo "  --production   Deploy to production (default)"
            echo "  --skip-build   Skip the build step (use existing build)"
            echo "  --help         Show this help message"
            exit 0
            ;;
        *)
            echo "❌ Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

if [ "$DEPLOY_PROD" = true ]; then
    ENVIRONMENT="production"
    echo "📋 Deploying to: Production"
else
    ENVIRONMENT="preview"
    echo "📋 Deploying to: Preview"
fi
echo ""

# Check if production environment file exists
if [ "$DEPLOY_PROD" = true ] && [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: .env.production file not found"
    echo "   Production deployments should have environment variables configured"
    echo ""
fi

# Run code quality checks (skip for quick deployments)
if [ "$SKIP_BUILD" = false ]; then
    echo "🔍 Running code quality checks..."
    if pnpm check; then
        echo "✅ Code quality checks passed"
    else
        echo "⚠️  Warning: Code quality checks had warnings (continuing anyway)"
    fi
    echo ""
fi

# Build the application
if [ "$SKIP_BUILD" = false ]; then
    echo "🏗️  Building web application..."
    
    # Clean previous build
    rm -rf apps/expo/dist
    
    # Build with production environment
    if [ "$DEPLOY_PROD" = true ]; then
        NODE_ENV=production pnpm web:build
    else
        pnpm web:build
    fi
    
    if [ ! -d "apps/expo/dist" ]; then
        echo "❌ Build failed - dist/ directory not found"
        exit 1
    fi
    
    echo "✅ Build successful"
    echo ""
else
    echo "⏭️  Skipping build (using existing build)"
    if [ ! -d "apps/expo/dist" ]; then
        echo "❌ No existing build found. Remove --skip-build flag."
        exit 1
    fi
    echo ""
fi

# Deploy to Netlify
echo "🚀 Deploying to Netlify..."
echo ""

cd apps/expo

if [ "$DEPLOY_PROD" = true ]; then
    # Production deployment
    netlify deploy --prod --dir=dist --message="Production deployment from $(git rev-parse --short HEAD)"
else
    # Preview deployment
    netlify deploy --dir=dist --message="Preview deployment from $(git rev-parse --short HEAD)"
fi

DEPLOY_EXIT_CODE=$?

cd ../..

if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "========================================"
    echo ""
    echo "📋 Deployment Information:"
    echo "   Environment: $ENVIRONMENT"
    echo "   Commit: $(git rev-parse --short HEAD)"
    echo "   Branch: $(git branch --show-current)"
    echo ""
    echo "🔗 Next Steps:"
    echo "   1. Test the deployed application"
    echo "   2. Verify authentication flows"
    echo "   3. Check API connectivity"
    echo "   4. Monitor for any errors"
    echo ""
    if [ "$DEPLOY_PROD" = true ]; then
        echo "🌐 Your site should be live at: https://preview.scaffald.com"
    else
        echo "🌐 Check the Netlify CLI output above for your preview URL"
    fi
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo "========================================"
    echo ""
    echo "🔍 Troubleshooting:"
    echo "   1. Ensure you're logged in: netlify login"
    echo "   2. Check if site is linked: netlify link"
    echo "   3. Verify build output exists: ls -la apps/expo/dist"
    echo "   4. Check Netlify site configuration"
    echo ""
    exit 1
fi
