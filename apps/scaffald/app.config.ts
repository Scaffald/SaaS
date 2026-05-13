import appPackage from "./package.json";
import dotenv from "dotenv";
import path from "path";

// Mapbox configuration constants
// Note: Inlined here because Expo's config evaluation can't resolve TypeScript imports from packages
const MAP_STYLE_CONFIG = {
  light: "mapbox://styles/mapbox/standard",
  dark: "mapbox://styles/scaffald/cmhzad6vd001b01rs4rbn93p9",
} as const;

const MAPBOX_API_BASE_URL = "https://api.mapbox.com" as const;

const APP_ENV = process.env.APP_ENV || "development";
const ENV_FILE_MAP: Record<string, string> = {
  production: ".env.production",
  preview: ".env.preview",
  staging: ".env.staging",
  dev: ".env.dev",
  "dev-local": ".env.dev-local",
  development: ".env",
};

const envPath = path.resolve(
  __dirname,
  "..",
  "..",
  ENV_FILE_MAP[APP_ENV] || ".env",
);
dotenv.config({ path: envPath, override: true });

const IS_PRODUCTION = APP_ENV === "production";
const packageVersion = (appPackage.version as string | undefined) ?? "1.0.0";
const APP_VERSION = process.env.APP_VERSION || packageVersion;

const deriveVersionCode = (version: string) => {
  const [major = 0, minor = 0, patch = 0] = version
    .split(".")
    .map((segment) => Number.parseInt(segment, 10))
    .map((segment) => (Number.isNaN(segment) ? 0 : segment));

  return major * 10_000 + minor * 100 + patch;
};

const derivedVersionCode = deriveVersionCode(APP_VERSION);
const IOS_BUILD_NUMBER =
  (process.env.APP_IOS_BUILD_NUMBER || `${derivedVersionCode}`).toString();
const ANDROID_VERSION_CODE = Number.parseInt(
  process.env.APP_ANDROID_VERSION_CODE || `${derivedVersionCode}`,
  10,
);

// SECURITY: Only use EXPO_PUBLIC_* variables in client bundle
// Non-public PostHog keys should be server-side only
const EXPO_PUBLIC_POSTHOG_API_KEY = process.env.EXPO_PUBLIC_POSTHOG_API_KEY;
const EXPO_PUBLIC_POSTHOG_HOST = process.env.EXPO_PUBLIC_POSTHOG_HOST;
const EXPO_PUBLIC_POSTHOG_PROJECT = process.env.EXPO_PUBLIC_POSTHOG_PROJECT;
const EXPO_PUBLIC_SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const EXPO_PUBLIC_SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const EXPO_PUBLIC_SENTRY_DSN_NATIVE = process.env.EXPO_PUBLIC_SENTRY_DSN_NATIVE;
const EXPO_PUBLIC_SENTRY_DSN_WEB = process.env.EXPO_PUBLIC_SENTRY_DSN_WEB;

// Fallback for app.config.ts (only used during build, not in client bundle)
const POSTHOG_HOST = EXPO_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

// Privacy manifest needs the actual tracking-host list. Sentry's ingest host
// is encoded in the DSN (e.g. `https://abc@o12345.ingest.us.sentry.io/...`),
// so we parse it out instead of duplicating a string that can drift. The
// PostHog host is configured via env and is already a bare hostname or URL.
const safeHostname = (value: string | undefined): string | undefined => {
  if (!value) return undefined;
  try {
    return new URL(value.startsWith("http") ? value : `https://${value}`)
      .hostname;
  } catch {
    return undefined;
  }
};

const TRACKING_DOMAINS = Array.from(
  new Set(
    [
      safeHostname(EXPO_PUBLIC_POSTHOG_HOST),
      safeHostname(POSTHOG_HOST),
      safeHostname(EXPO_PUBLIC_SENTRY_DSN_NATIVE),
    ].filter((value): value is string => Boolean(value))
  )
);

const IOS_BUNDLE_BASE = "com.scaffald.app";
const ANDROID_PACKAGE_BASE = "com.scaffald.app";
const iosBundleIdentifier = IS_PRODUCTION
  ? IOS_BUNDLE_BASE
  : `${IOS_BUNDLE_BASE}.${APP_ENV}`;
const androidPackage = IS_PRODUCTION
  ? ANDROID_PACKAGE_BASE
  : `${ANDROID_PACKAGE_BASE}.${APP_ENV}`;

export default {
  expo: {
    name: IS_PRODUCTION ? "Scaffald" : `Scaffald (${APP_ENV})`,
    slug: "scf-scaffald",
    jsEngine: "hermes",
    scheme: "com.scaffald",
    version: APP_VERSION,
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    splash: {
      image: "./assets/splash.png",
      contentFit: "contain",
      backgroundColor: "#E9FCFF",
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: "https://u.expo.dev/your-project-id",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: iosBundleIdentifier,
      buildNumber: IOS_BUILD_NUMBER,
      infoPlist: {
        // App uses standard HTTPS / no custom encryption. Setting this to
        // false skips Apple's per-upload encryption-export questionnaire.
        // If we ever ship custom crypto we'll need to flip this to true and
        // provide ECCN documentation.
        ITSAppUsesNonExemptEncryption: false,
        // "location" intentionally NOT declared: Apple App Store review will
        // reject apps that declare background-location capability without
        // actively using TaskManager / startLocationUpdatesAsync. Add it back
        // only when a real background-location feature ships.
        UIBackgroundModes: ["fetch", "remote-notification"],
        // Permission strings must match what's declared in App Store Connect →
        // App Privacy and explain WHY the data is collected. Apple frequently
        // rejects generic strings like "Allow access to your location."
        // Background-location strings (NSLocationAlways*) are intentionally
        // omitted: we use foreground location only. Re-add them only if a
        // real background-tracking feature ships.
        NSLocationWhenInUseUsageDescription:
          "Scaffald uses your location to show nearby trade jobs and workers on the map.",
        NSPhotoLibraryUsageDescription:
          "Scaffald accesses your photos so you can upload a profile picture and attach images to job listings.",
        NSCameraUsageDescription:
          "Scaffald uses the camera so you can take a profile photo or capture jobsite images for listings.",
        // App Tracking Transparency (Apple Guideline 5.1.2(i)). The string is
        // also configured via the expo-tracking-transparency plugin below; we
        // duplicate it here so EAS/`expo prebuild` cannot produce a binary
        // without it. Wording follows Apple's HIG: lead with the user benefit,
        // not the company benefit. See packages/scf-core/utils/privacy/ for
        // the runtime request flow.
        NSUserTrackingUsageDescription:
          "Allow Scaffald to use your activity so we can keep your account in sync across devices and improve the experience with anonymous usage analytics.",
      },
      // Apple Privacy Manifest (PrivacyInfo.xcprivacy). Required since
      // May 2024 — Expo merges this dict into the file it generates at
      // prebuild time. Update whenever a new SDK or data category lands.
      // See app-store-assets/privacy-checklist.md for the source-of-truth
      // mapping.
      privacyManifests: {
        // We ship App Tracking Transparency (Path B). The Boolean must be
        // true whenever we *might* link identifiers across apps/sites for
        // advertising — Apple errs on the side of requiring this even when
        // analytics are the only consumer. The runtime decision is
        // user-controlled via the ATT prompt.
        NSPrivacyTracking: true,
        // Domains Scaffald may exchange tracking-relevant data with. Apple
        // will inspect this list against outbound TLS traffic at review time;
        // if the binary contacts a tracking host not listed here, the
        // submission is rejected. Built from PostHog + Sentry env config so
        // we cannot drift if an org rotates hosts. If the env is missing at
        // build time, fall back to the public clouds so the manifest is
        // never empty.
        NSPrivacyTrackingDomains:
          TRACKING_DOMAINS.length > 0
            ? TRACKING_DOMAINS
            : ["us.i.posthog.com", "app.posthog.com"],
        // Required-reason API declarations. Expo prebuild already populates
        // entries for APIs used by installed pods (UserDefaults, file
        // timestamps, system boot time, disk space). They are listed here
        // explicitly so this file remains the single source of truth and
        // doesn't silently regress if prebuild's detection misses a pod.
        NSPrivacyAccessedAPITypes: [
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
            NSPrivacyAccessedAPITypeReasons: ["CA92.1", "C56D.1"],
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
            NSPrivacyAccessedAPITypeReasons: ["C617.1", "0A2A.1", "3B52.1"],
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
            NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
          },
          {
            NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace",
            NSPrivacyAccessedAPITypeReasons: ["E174.1", "85F4.1"],
          },
        ],
        // Data we collect. Each entry must match an answer in App Store
        // Connect → App Privacy or Apple will flag inconsistency.
        NSPrivacyCollectedDataTypes: [
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeEmailAddress",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeName",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePhoneNumber",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePhotosorVideos",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeCoarseLocation",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePreciseLocation",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeUserID",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: true,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
              "NSPrivacyCollectedDataTypePurposeAnalytics",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeDeviceID",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: true,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAnalytics",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeProductInteraction",
            NSPrivacyCollectedDataTypeLinked: true,
            NSPrivacyCollectedDataTypeTracking: true,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAnalytics",
              "NSPrivacyCollectedDataTypePurposeProductPersonalization",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeCrashData",
            NSPrivacyCollectedDataTypeLinked: false,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAppFunctionality",
              "NSPrivacyCollectedDataTypePurposeAnalytics",
            ],
          },
          {
            NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypePerformanceData",
            NSPrivacyCollectedDataTypeLinked: false,
            NSPrivacyCollectedDataTypeTracking: false,
            NSPrivacyCollectedDataTypePurposes: [
              "NSPrivacyCollectedDataTypePurposeAnalytics",
            ],
          },
        ],
      },
    },
    android: {
      softwareKeyboardLayoutMode: "pan",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#FFFFFF",
      },
      package: androidPackage,
      permissions: ["android.permission.RECORD_AUDIO"],
      versionCode: ANDROID_VERSION_CODE,
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
      name: "Scaffald",
      shortName: "Scaffald",
      description: "Modern hiring for technical trades",
      startUrl: "/",
      display: "standalone",
      orientation: "portrait",
      themeColor: "#ffffff",
      backgroundColor: "#ffffff",
      lang: "en",
      dir: "ltr",
      meta: {
        viewport: "width=device-width, initial-scale=1, shrink-to-fit=no",
        "theme-color": "#ffffff",
        "apple-mobile-web-app-capable": "yes",
        "apple-mobile-web-app-status-bar-style": "default",
        "apple-mobile-web-app-title": "Scaffald",
        "format-detection": "telephone=no",
        "mobile-web-app-capable": "yes",
        "msapplication-TileColor": "#ffffff",
        "msapplication-tap-highlight": "no",
      },
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#ffffff",
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission:
            "Scaffald accesses your photos so you can upload a profile picture and attach images to job listings.",
          cameraPermission:
            "Scaffald uses the camera so you can take a profile photo or capture jobsite images for listings.",
        },
      ],
      [
        "expo-location",
        {
          // Foreground-only — we do not use background location. Background
          // flags are intentionally false to match the App Privacy form and
          // avoid rejection for declaring unused capabilities.
          locationWhenInUsePermission:
            "Scaffald uses your location to show nearby trade jobs and workers on the map.",
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
        },
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          // https://react-native-google-signin.github.io/docs/setting-up/expo
          iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_SCHEME ||
            "com.googleusercontent.apps.163454683152-e4357cqnub2rg3vadkktap71i4nqea88",
        },
      ],
      "expo-apple-authentication",
      [
        "expo-tracking-transparency",
        {
          // Required by Apple Guideline 5.1.2(i). The runtime prompt is
          // triggered post-onboarding from packages/scf-core/utils/privacy/
          // so the user sees the in-app context card immediately before the
          // system dialog (HIG recommendation). Until the user resolves the
          // prompt, identify/alias calls into PostHog and Sentry setUser are
          // skipped — see AuthProvider.
          userTrackingPermission:
            "Allow Scaffald to use your activity so we can keep your account in sync across devices and improve the experience with anonymous usage analytics.",
        },
      ],
      "expo-router",
      "expo-build-properties",
      "expo-font",
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsDownloadToken: process.env.MAPBOX_DOWNLOADS_TOKEN || process.env.EXPO_PUBLIC_MAPBOX_TOKEN,
        },
      ],
    ],
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: "ba0f9b47-eb78-494c-a03f-c33b9defa904",
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
          host: EXPO_PUBLIC_POSTHOG_HOST || POSTHOG_HOST ||
            "https://app.posthog.com",
          key: EXPO_PUBLIC_POSTHOG_API_KEY || "",
          env: APP_ENV,
          project: EXPO_PUBLIC_POSTHOG_PROJECT,
        },
      },
      sentry: {
        // Only use EXPO_PUBLIC variables - these are safe to expose to clients
        dsnNative: EXPO_PUBLIC_SENTRY_DSN_NATIVE || "",
        dsnWeb: EXPO_PUBLIC_SENTRY_DSN_WEB || "",
        env: APP_ENV,
      },
      supabase: {
        url: EXPO_PUBLIC_SUPABASE_URL,
        anonKey: EXPO_PUBLIC_SUPABASE_ANON_KEY,
      },
      appEnv: APP_ENV,
      // Only expose public PostHog config - non-public keys should be server-side only
      posthogHost: EXPO_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
      posthogKey: EXPO_PUBLIC_POSTHOG_API_KEY || "",
      posthogProject: EXPO_PUBLIC_POSTHOG_PROJECT,
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    experiments: {
      autolinkingModuleResolution: true,
    },
    owner: "unicorn-love",
  },
};
