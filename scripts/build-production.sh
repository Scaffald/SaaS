#!/bin/bash
# Production build script for local testing

set -e

echo "🚀 Building for Production"
echo "=========================="

# Set environment
export NODE_ENV=production
export APP_ENV=production
export EXPO_USE_FAST_REFRESH=false
export TAMAGUI_DISABLE_WARN_DYNAMIC_LOAD=1

# Check for .env.production
if [ ! -f ".env.production" ]; then
    echo "⚠️  Warning: .env.production not found"
    echo "   Create one with production environment variables"
    exit 1
fi

# Load production environment
source .env.production

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf apps/expo/dist
rm -rf apps/expo/.expo

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install --frozen-lockfile

# Build workspace packages
echo "🏗️  Building workspace packages..."
pnpm --filter @app/ui build
pnpm --filter @app/core build
pnpm --filter @app/schemas build

# Run quality checks
echo "🔍 Running quality checks..."
pnpm typecheck || true
pnpm lint || true

# Build web app
echo "🌐 Building web application..."
cd apps/expo
pnpm web:build

# Create redirects
echo "📝 Creating redirects..."
echo "/* /index.html 200" > dist/_redirects

# Create headers
echo "📝 Creating headers..."
cat > dist/_headers << 'EOF'
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate
EOF

cd ../..

echo ""
echo "✅ Production build complete!"
echo "=========================="
echo "📁 Output: apps/expo/dist/"
echo "📊 Size: $(du -sh apps/expo/dist/ | cut -f1)"
echo ""
echo "🚀 To deploy:"
echo "   pnpm deploy:aws:prod"
echo ""
echo "🧪 To test locally:"
echo "   cd apps/expo && pnpm web:serve"
