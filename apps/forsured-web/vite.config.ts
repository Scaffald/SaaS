import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type { Plugin as EsbuildPlugin } from 'esbuild';

// Path to shim files for missing modules
const shimPath = path.resolve(__dirname, './src/shims/react-native-shims.ts');
const expoRouterShimPath = path.resolve(__dirname, './src/shims/expo-router-shim.ts');

// Patterns that need to be shimmed (internal RN paths that don't exist in react-native-web)
const shimPatterns = [
  'react-native/Libraries/Renderer/shims/ReactFabric',
  'react-native/Libraries/Utilities/codegenNativeComponent',
  'react-native-web/Libraries/Renderer/shims/ReactFabric',
  'react-native-web/Libraries/Utilities/codegenNativeComponent',
];

/**
 * esbuild plugin to shim missing React Native internals during dependency optimization
 * This runs BEFORE Vite's alias system processes imports
 */
function reactNativeShimsEsbuild(): EsbuildPlugin {
  return {
    name: 'react-native-shims-esbuild',
    setup(build) {
      // Intercept problematic imports before they fail
      build.onResolve({ filter: /react-native.*Libraries/ }, (args) => {
        for (const pattern of shimPatterns) {
          if (args.path === pattern || args.path.includes(pattern)) {
            return { path: shimPath };
          }
        }
        return null;
      });
    },
  };
}

/**
 * Vite plugin to shim missing React Native internals for web builds
 * react-native-reanimated and react-native-svg import internal RN modules
 * that don't exist in react-native-web
 */
function reactNativeShims(): Plugin {
  return {
    name: 'react-native-shims',
    enforce: 'pre', // Run before other plugins including alias
    resolveId(source) {
      // Check if this import needs to be shimmed
      for (const pattern of shimPatterns) {
        if (source === pattern || source.includes(pattern)) {
          return shimPath;
        }
      }
      return null;
    },
  };
}

/**
 * Vite plugin for tRPC middleware
 * Routes /api/trpc requests to the tRPC handler during development
 */
function trpcMiddleware(): Plugin {
  return {
    name: 'trpc-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/trpc')) {
          try {
            // Dynamically import the handler to avoid build issues
            const { trpcMiddleware } = await import('./src/server/api/handler');

            // Parse body for POST requests
            if (req.method === 'POST') {
              let body = '';
              req.on('data', (chunk) => {
                body += chunk.toString();
              });
              req.on('end', async () => {
                try {
                  req.body = JSON.parse(body);
                } catch {
                  req.body = body;
                }
                await trpcMiddleware(req, res);
              });
            } else {
              await trpcMiddleware(req, res);
            }
          } catch (error) {
            console.error('tRPC middleware error:', error);
            res.statusCode = 500;
            res.end(JSON.stringify({ error: 'Internal server error' }));
          }
        } else {
          next();
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  // Load .env files from monorepo root (UNI-Construct root)
  envDir: '../..',
  // Resolve packages from monorepo
  root: __dirname,
  plugins: [reactNativeShims(), react(), trpcMiddleware()],
  optimizeDeps: {
    exclude: ['lucide-react', 'expo-router'],
    include: ['tamagui', 'react-native-web'],
    esbuildOptions: {
      plugins: [reactNativeShimsEsbuild()],
    },
  },
  server: {
    port: parseInt(process.env.VITE_PORT || '5173'),
    // Note: tRPC requests are handled by trpcMiddleware plugin above
    // No additional proxy needed for /api/trpc routes
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Ensure api/ directory is not affected by build
    rollupOptions: {
      output: {
        // Organize output files
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          trpc: ['@trpc/client', '@trpc/react-query'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Use extended react-native-web shim that includes missing exports (TurboModuleRegistry, etc.)
      'react-native': path.resolve(__dirname, './src/shims/react-native-web-extended.ts'),
      // Shim expo-router for web (we use react-router-dom instead)
      'expo-router': expoRouterShimPath,
    },
    extensions: ['.web.tsx', '.web.ts', '.web.jsx', '.web.js', '.tsx', '.ts', '.jsx', '.js'],
  },
  define: {
    'process.env': {},
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
