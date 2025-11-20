import dotenv from 'dotenv'
import 'dotenv/config'

// Mapbox configuration constants
// Note: Inlined here because Expo's config evaluation can't resolve TypeScript imports from packages
const MAP_STYLE_CONFIG = {
  light: 'mapbox://styles/mapbox/standard',
  dark: 'mapbox://styles/scaffald/cmhzad6vd001b01rs4rbn93p9',
} as const

const MAPBOX_API_BASE_URL = 'https://api.mapbox.com' as const

const APP_ENV = process.env.APP_ENV || 'development'
// Load environment-specific variables
const IS_PRODUCTION = APP_ENV === 'production'
const APP_VERSION = process.env.APP_VERSION || '1.0.0'

// SECURITY: Only use EXPO_PUBLIC_* variables in client bundle
// Non-public PostHog keys should be server-side only
const EXPO_PUBLIC_POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY
const EXPO_PUBLIC_POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST
const EXPO_PUBLIC_POSTHOG_PROJECT = process.env.EXPO_PUBLIC_POSTHOG_PROJECT

// Fallback for app.config.ts (only used during build, not in client bundle)
const POSTHOG_HOST = EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'

const IOS_BUNDLE_BASE = 'com.scaffald.app'
const ANDROID_PACKAGE_BASE = 'com.scaffald.app'
const iosBundleIdentifier = IS_PRODUCTION ? IOS_BUNDLE_BASE : `${IOS_BUNDLE_BASE}.${APP_ENV}`
const androidPackage = IS_PRODUCTION ? ANDROID_PACKAGE_BASE : `${ANDROID_PACKAGE_BASE}.${APP_ENV}`

// Load production environment variables if in production mode
if (IS_PRODUCTION) {
  dotenv.config({ path: '.env.production' })
}

export default {
  expo: {
    name: IS_PRODUCTION ? 'SCF-Neue' : `SCF-Neue (${APP_ENV})`,
    slug: 'scf-neue',
    jsEngine: 'hermes',
    scheme: 'com.scaffald',
    version: APP_VERSION,
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash.png',
      contentFit: 'contain',
      backgroundColor: '#ffffff',
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/your-project-id',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: iosBundleIdentifier,
      buildNumber: '6',
      infoPlist: {
        UIBackgroundModes: ['location', 'fetch', 'remote-notification'],
        NSLocationWhenInUseUsageDescription: 'This app requires access to your location when open.',
        NSLocationAlwaysAndWhenInUseUsageDescription:
          'This app requires access to your location even when closed.',
        NSLocationAlwaysUsageDescription: 'This app requires access to your location when open.',
      },
    },
    android: {
      softwareKeyboardLayoutMode: 'pan',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#FFFFFF',
      },
      package: androidPackage,
      permissions: ['android.permission.RECORD_AUDIO'],
      versionCode: 3,
    },
    web: {
      favicon: './assets/favicon.png',
      bundler: 'metro',
      name: 'Scaffald',
      shortName: 'Scaffald',
      description: 'Modern hiring for technical trades',
      startUrl: '/',
      display: 'standalone',
      orientation: 'portrait',
      themeColor: '#ffffff',
      backgroundColor: '#ffffff',
      lang: 'en',
      dir: 'ltr',
      meta: {
        viewport: 'width=device-width, initial-scale=1, shrink-to-fit=no',
        'theme-color': '#ffffff',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'default',
        'apple-mobile-web-app-title': 'Scaffald',
        'format-detection': 'telephone=no',
        'mobile-web-app-capable': 'yes',
        'msapplication-TileColor': '#ffffff',
        'msapplication-tap-highlight': 'no',
      },
    },
    plugins: [
      [
        'expo-notifications',
        {
          icon: './assets/icon.png',
          color: '#ffffff',
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: 'The app accesses your photos to let you share them with your friends.',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.',
          locationAlwaysPermission: 'Allow $(PRODUCT_NAME) to use your location.',
          locationWhenInUsePermission: 'Allow $(PRODUCT_NAME) to use your location.',
          isIosBackgroundLocationEnabled: true,
          isAndroidBackgroundLocationEnabled: true,
        },
      ],
      [
        '@react-native-google-signin/google-signin',
        {
          // https://react-native-google-signin.github.io/docs/setting-up/expo
          iosUrlScheme:
            process.env.EXPO_PUBLIC_GOOGLE_IOS_SCHEME ||
            'com.googleusercontent.apps.163454683152-e4357cqnub2rg3vadkktap71i4nqea88',
        },
      ],
      'expo-apple-authentication',
      'expo-router',
      'expo-build-properties',
      'expo-font',
      [
        '@rnmapbox/maps',
        {
          RNMapboxMapsDownloadToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
        },
      ],
    ],
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: 'b5f02af2-6475-4d9e-81b3-664f89564580',
      },
      mapbox: {
        accessToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
        styleURL: MAP_STYLE_CONFIG.light,
        styleURLDark: MAP_STYLE_CONFIG.dark,
        apiBaseUrl: MAPBOX_API_BASE_URL,
      },
      analytics: {
        posthog: {
          // Only use EXPO_PUBLIC variables - these are safe to expose to clients
          host: EXPO_PUBLIC_POSTHOG_HOST || POSTHOG_HOST || 'https://app.posthog.com',
          key: EXPO_PUBLIC_POSTHOG_API_KEY || '',
          env: APP_ENV,
          project: EXPO_PUBLIC_POSTHOG_PROJECT,
        },
      },
      appEnv: APP_ENV,
      // Only expose public PostHog config - non-public keys should be server-side only
      posthogHost: EXPO_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
      posthogKey: EXPO_PUBLIC_POSTHOG_API_KEY || '',
      posthogProject: EXPO_PUBLIC_POSTHOG_PROJECT,
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    experiments: {
      autolinkingModuleResolution: true,
    },
    owner: 'Unicorn',
  },
}
