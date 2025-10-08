import 'dotenv/config'

// Load environment-specific variables
const IS_DEV = process.env.APP_ENV === 'development'
const IS_STAGING = process.env.APP_ENV === 'staging'
const IS_PRODUCTION = process.env.APP_ENV === 'production'

// Load production environment variables if in production mode
if (IS_PRODUCTION) {
  require('dotenv').config({ path: '.env.production' })
}

export default {
  expo: {
    name: IS_PRODUCTION ? 'SCF-Neue' : `SCF-Neue (${process.env.APP_ENV || 'dev'})`,
    slug: 'scf-neue',
    jsEngine: 'hermes',
    scheme: 'myapp',
    version: '1.0.0',
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
      bundleIdentifier: 'com.scaffald.app',
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
      package: 'com.scaffald.app',
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
        styleURL: process.env.EXPO_PUBLIC_MAPBOX_STYLE_URL,
        apiBaseUrl: process.env.EXPO_PUBLIC_MAPBOX_API_URL,
      },
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
